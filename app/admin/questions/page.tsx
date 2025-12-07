"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MessageCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";

interface Category {
    id: string;
    title_th: string;
    title_en: string;
}

interface Question {
    id: string;
    content_th: string;
    content_en: string;
    categoryId: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Form state
    const [contentTh, setContentTh] = useState("");
    const [contentEn, setContentEn] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [page, selectedCategory]); // Refetch when page or category filter changes (if we add filter)

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
                if (data.length > 0 && !selectedCategory) {
                    setSelectedCategory(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            // Note: Currently API fetches all questions if no categoryId, or filtered by categoryId.
            // We might want to filter by category in the list too, but for now let's just show all or implement a filter.
            // Let's implement a simple filter dropdown for the list too? Or just fetch all paginated.
            // The current API supports pagination.

            const res = await fetch(`/api/questions?page=${page}&limit=${limit}`);
            const data = await res.json();

            if (data.data && Array.isArray(data.data)) {
                setQuestions(data.data);
                setTotalPages(data.meta.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) {
            alert("Please create a category first!");
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content_th: contentTh,
                    content_en: contentEn,
                    categoryId: selectedCategory,
                }),
            });

            if (res.ok) {
                const newQuestion = await res.json();
                // If on first page, prepend. Otherwise, maybe just refresh or let it be.
                if (page === 1) {
                    setQuestions([newQuestion, ...questions].slice(0, limit));
                }
                setContentTh("");
                setContentEn("");
                setIsModalOpen(false);
                // Optionally refresh to update counts/pages
                fetchQuestions();
            }
        } catch (error) {
            console.error("Failed to create question", error);
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
                // Ideally fetch again to fill the gap
            }
        } catch (error) {
            console.error("Failed to delete question", error);
        }
    };

    const getCategoryName = (id: string) => {
        const cat = categories.find((c) => c.id === id);
        return cat ? `${cat.title_en} / ${cat.title_th}` : "Unknown Category";
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Questions</h1>
                    <p className="text-gray-500">Manage conversation starters.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Question
                </button>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Question"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none bg-white"
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.title_en} / {cat.title_th}
                                </option>
                            ))}
                        </select>
                    </div>

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
                            disabled={isSubmitting || categories.length === 0}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            Add Question
                        </button>
                    </div>
                </form>
            </Modal>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading questions...</div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No questions found. Add one above!
                    </div>
                ) : (
                    <>
                        <AnimatePresence>
                            {questions.map((question) => (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center flex-shrink-0">
                                            <MessageCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{question.content_en}</h3>
                                            <p className="text-sm text-gray-500">{question.content_th}</p>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-1 inline-block">
                                                {getCategoryName(question.categoryId)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(question.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
