"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, MessageCircle, Loader2, Pencil, Download, Upload, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "../../../components/Modal";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jschardet from "jschardet";

interface Category {
    id: string;
    slug: string;
    title_th: string;
    title_en: string;
}

interface Question {
    id: string;
    content_th: string;
    content_en: string;
    categoryId: string;
}

export default function CategoryQuestionsPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params?.categoryId as string;

    const [category, setCategory] = useState<Category | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [contentTh, setContentTh] = useState("");
    const [contentEn, setContentEn] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        fetchCategory();
        fetchQuestions();
    }, [categoryId, searchTerm, sortBy, sortOrder]);

    const fetchCategory = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                const cat = data.find((c) => c.id === categoryId);
                setCategory(cat || null);
            }
        } catch (error) {
            console.error("Failed to fetch category", error);
        }
    };

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                categoryId,
                limit: "1000",
                ...(searchTerm && { search: searchTerm }),
                sortBy,
                sortOrder,
            });
            const res = await fetch(`/api/questions?${params.toString()}`);
            const data = await res.json();

            if (data.data && Array.isArray(data.data)) {
                setQuestions(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (question: Question) => {
        setEditingId(question.id);
        setContentTh(question.content_th);
        setContentEn(question.content_en);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setContentTh("");
        setContentEn("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingId ? "/api/questions" : "/api/questions";
            const method = editingId ? "PUT" : "POST";
            const body = {
                id: editingId,
                content_th: contentTh,
                content_en: contentEn,
                categoryId: categoryId,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const updatedQuestion = await res.json();
                if (editingId) {
                    setQuestions(questions.map(q => q.id === editingId ? updatedQuestion : q));
                } else {
                    setQuestions([updatedQuestion, ...questions]);
                }
                handleCloseModal();
            }
        } catch (error) {
            console.error("Failed to save question", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        try {
            const res = await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setQuestions(questions.filter((q) => q.id !== id));
                setSelectedIds(selectedIds.filter(sid => sid !== id));
            }
        } catch (error) {
            console.error("Failed to delete question", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} questions?`)) return;

        try {
            const res = await fetch("/api/questions/batch", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (res.ok) {
                setQuestions(questions.filter((q) => !selectedIds.includes(q.id)));
                setSelectedIds([]);
                alert("Questions deleted successfully");
            } else {
                alert("Failed to delete questions");
            }
        } catch (error) {
            console.error("Failed to bulk delete", error);
            alert("Error deleting questions");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === questions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(questions.map(q => q.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleExport = () => {
        const headers = "Question (TH),Question (EN)\n";
        const csvContent = questions.map(q =>
            `"${q.content_th.replace(/"/g, '""')}","${q.content_en.replace(/"/g, '""')}"`
        ).join("\n");

        const blob = new Blob(["\uFEFF" + headers + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `questions_${category?.title_en || "export"}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        const isCSV = fileName.endsWith('.csv');

        if (!isXLSX && !isCSV) {
            alert("Please upload a CSV or XLSX file");
            e.target.value = "";
            return;
        }

        try {
            let newQuestions: { content_th: string; content_en: string }[] = [];

            if (isXLSX) {
                // Handle XLSX files
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

                // Skip header row and process data
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.length >= 2 && row[0] && row[1]) {
                        newQuestions.push({
                            content_th: String(row[0]).trim(),
                            content_en: String(row[1]).trim()
                        });
                    }
                }
                await processImport(newQuestions);
                e.target.value = "";
            } else {
                // Handle CSV files with auto-encoding detection
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Detect encoding
                const detected = jschardet.detect(Buffer.from(uint8Array));
                const encoding = detected.encoding || 'UTF-8';

                console.log(`Auto-detected encoding: ${encoding}`);

                // Parse CSV with detected encoding
                Papa.parse(file, {
                    encoding: encoding,
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        if (results.data && Array.isArray(results.data)) {
                            results.data.forEach((row: any) => {
                                const keys = Object.keys(row);
                                const thKey = keys.find(k => k.toLowerCase().includes("th")) || keys[0];
                                const enKey = keys.find(k => k.toLowerCase().includes("en")) || keys[1];

                                if (row[thKey] && row[enKey]) {
                                    newQuestions.push({
                                        content_th: row[thKey],
                                        content_en: row[enKey]
                                    });
                                }
                            });
                        }

                        await processImport(newQuestions);
                        e.target.value = "";
                    },
                    error: (error: any) => {
                        console.error("CSV Parse Error:", error);
                        alert("Error parsing CSV file");
                        e.target.value = "";
                    }
                });
            }
        } catch (error) {
            console.error("Import error:", error);
            alert("Error processing file");
            e.target.value = "";
        }
    };

    const processImport = async (newQuestions: { content_th: string; content_en: string }[]) => {
        if (newQuestions.length > 0) {
            if (confirm(`Found ${newQuestions.length} questions. Import them?`)) {
                try {
                    const res = await fetch("/api/questions/batch", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            categoryId,
                            questions: newQuestions
                        }),
                    });

                    if (res.ok) {
                        alert("Import successful!");
                        fetchQuestions();
                    } else {
                        alert("Import failed");
                    }
                } catch (error) {
                    console.error("Import error:", error);
                    alert("Error importing questions");
                }
            }
        } else {
            alert("No valid questions found. Please ensure the file has 'Question (TH)' and 'Question (EN)' columns");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/categories" className="text-gray-600 hover:text-pink-600 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {category ? `${category.title_en} / ${category.title_th}` : "Questions"}
                        </h1>
                        <p className="text-gray-500">Manage questions for this category.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={20} />
                            Delete ({selectedIds.length})
                        </button>
                    )}

                    <button
                        onClick={handleExport}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={20} />
                        Export CSV
                    </button>

                    <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 cursor-pointer">
                        <Upload size={20} />
                        Import
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setContentTh("");
                            setContentEn("");
                            setIsModalOpen(true);
                        }}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Question
                    </button>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? "Edit Question" : "Add New Question"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question (TH)</label>
                            <textarea
                                value={contentTh}
                                onChange={(e) => setContentTh(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="คำถามภาษาไทย"
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question (EN)</label>
                            <textarea
                                value={contentEn}
                                onChange={(e) => setContentEn(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="Question in English"
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingId ? <Pencil size={18} /> : <Plus size={18} />)}
                            {editingId ? "Update Question" : "Add Question"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Search and Sort Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search Box */}
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="🔍 Search questions (Thai or English)..."
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                    />
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none bg-white"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="content_th">Thai (A-Z)</option>
                        <option value="content_en">English (A-Z)</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </button>

                    {(searchTerm || sortBy !== "createdAt" || sortOrder !== "asc") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSortBy("createdAt");
                                setSortOrder("asc");
                            }}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {questions.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
                        >
                            {selectedIds.length === questions.length && questions.length > 0 ? (
                                <CheckSquare size={20} className="text-pink-500" />
                            ) : (
                                <Square size={20} />
                            )}
                            <span className="text-sm font-medium">Select All</span>
                        </button>
                        <span className="text-sm text-gray-400">
                            ({selectedIds.length} selected)
                        </span>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading questions...</div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No questions found. Add one above!
                    </div>
                ) : (
                    <AnimatePresence>
                        {questions.map((question, index) => (
                            <motion.div
                                key={question.id || `question-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between group transition-colors ${selectedIds.includes(question.id)
                                    ? "border-pink-200 bg-pink-50/30"
                                    : "border-gray-100"
                                    }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleSelect(question.id)}
                                        className="text-gray-400 hover:text-pink-500 transition-colors"
                                    >
                                        {selectedIds.includes(question.id) ? (
                                            <CheckSquare size={20} className="text-pink-500" />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800">{question.content_en}</h3>
                                        <p className="text-sm text-gray-500">{question.content_th}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(question)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(question.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
