"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Image as ImageIcon, Loader2, ChevronRight, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";
import Link from "next/link";

interface Category {
    id: string;
    slug: string;
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    iconClass?: string;
    iconColor?: string;
    questionCount?: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [slug, setSlug] = useState("");
    const [titleTh, setTitleTh] = useState("");
    const [titleEn, setTitleEn] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [iconClass, setIconClass] = useState("");
    const [iconColor, setIconColor] = useState("text-pink-500");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Search and sort state
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("title_en");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const colors = [
        { label: "Pink", value: "text-pink-500", bg: "bg-pink-500" },
        { label: "Blue", value: "text-blue-500", bg: "bg-blue-500" },
        { label: "Green", value: "text-green-500", bg: "bg-green-500" },
        { label: "Violet", value: "text-violet-500", bg: "bg-violet-500" },
        { label: "Orange", value: "text-orange-500", bg: "bg-orange-500" },
    ];

    useEffect(() => {
        fetchCategories();
    }, [searchTerm, sortBy, sortOrder]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                // Fetch question counts for each category
                const categoriesWithCounts = await Promise.all(
                    data.map(async (cat) => {
                        try {
                            const qRes = await fetch(`/api/questions?categoryId=${cat.id}&limit=1`);
                            const qData = await qRes.json();
                            return { ...cat, questionCount: qData.meta?.total || 0 };
                        } catch {
                            return { ...cat, questionCount: 0 };
                        }
                    })
                );

                // Apply search filter
                let filtered = categoriesWithCounts;
                if (searchTerm.trim()) {
                    const searchLower = searchTerm.toLowerCase().trim();
                    filtered = filtered.filter((cat) => {
                        const titleTh = (cat.title_th || "").toLowerCase();
                        const titleEn = (cat.title_en || "").toLowerCase();
                        const descTh = (cat.description_th || "").toLowerCase();
                        const descEn = (cat.description_en || "").toLowerCase();
                        return titleTh.includes(searchLower) ||
                            titleEn.includes(searchLower) ||
                            descTh.includes(searchLower) ||
                            descEn.includes(searchLower);
                    });
                }

                // Apply sorting
                filtered.sort((a, b) => {
                    let aVal, bVal;

                    if (sortBy === "questionCount") {
                        aVal = a.questionCount || 0;
                        bVal = b.questionCount || 0;
                    } else {
                        aVal = (a[sortBy as keyof Category] || "").toString().toLowerCase();
                        bVal = (b[sortBy as keyof Category] || "").toString().toLowerCase();
                    }

                    if (sortOrder === "desc") {
                        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                    } else {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    }
                });

                setCategories(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setSlug(category.slug);
        setTitleTh(category.title_th);
        setTitleEn(category.title_en);
        setDescriptionTh(category.description_th);
        setDescriptionEn(category.description_en);
        setIconClass(category.iconClass || "");
        setIconColor(category.iconColor || "text-pink-500");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSlug("");
        setTitleTh("");
        setTitleEn("");
        setDescriptionTh("");
        setDescriptionEn("");
        setIconClass("");
        setIconColor("text-pink-500");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingId ? "/api/categories" : "/api/categories";
            const method = editingId ? "PUT" : "POST";
            const body = {
                id: editingId, // Required for PUT
                slug,
                title_th: titleTh,
                title_en: titleEn,
                description_th: descriptionTh,
                description_en: descriptionEn,
                iconClass,
                iconColor,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const updatedCategory = await res.json();
                if (editingId) {
                    // Update existing category in list
                    setCategories(categories.map(c => c.id === editingId ? { ...updatedCategory, questionCount: c.questionCount } : c));
                } else {
                    // Add new category
                    setCategories([updatedCategory, ...categories]);
                }

                handleCloseModal();
            }
        } catch (error) {
            console.error("Failed to save category", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setCategories(categories.filter((c) => c.id !== id));
            } else {
                alert("Delete API not implemented yet");
            }
        } catch (error) {
            console.error("Failed to delete category", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                    <p className="text-gray-500">Manage your game categories.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setSlug("");
                        setTitleTh("");
                        setTitleEn("");
                        setDescriptionTh("");
                        setDescriptionEn("");
                        setIconClass("");
                        setIconColor("text-pink-500");
                        setIsModalOpen(true);
                    }}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Category
                </button>
            </div>

            {/* Search and Sort Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search Box */}
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="🔍 Search categories (Title or Description)..."
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
                        <option value="title_en">Name (English)</option>
                        <option value="title_th">Name (Thai)</option>
                        <option value="questionCount">Question Count</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </button>

                    {(searchTerm || sortBy !== "title_en" || sortOrder !== "asc") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSortBy("title_en");
                                setSortOrder("asc");
                            }}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? "Edit Category" : "Add New Category"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="e.g., you-and-me"
                            pattern="[a-z0-9-]+"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {editingId ? "Changing slug will migrate all questions (irreversible)." : "Used in URL: /game/" + (slug || 'your-slug')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (TH)</label>
                            <input
                                type="text"
                                value={titleTh}
                                onChange={(e) => setTitleTh(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="ชื่อหมวดหมู่ภาษาไทย"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                            <input
                                type="text"
                                value={titleEn}
                                onChange={(e) => setTitleEn(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="Category Name in English"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (TH)</label>
                            <textarea
                                value={descriptionTh}
                                onChange={(e) => setDescriptionTh(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="คำอธิบายสั้นๆ"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                            <textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="Short description"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Icon Class */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon Class (Font Awesome)
                        </label>
                        <input
                            type="text"
                            placeholder="เช่น fa fa-heart, fas fa-wine-glass"
                            value={iconClass}
                            onChange={(e) => setIconClass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            ใช้ Font Awesome class (เช่น fa fa-heart, fas fa-wine-glass)
                        </p>
                    </div>

                    {/* Icon Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            สีไอคอน (Icon Color)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="เช่น #FF1493, pink-500"
                                value={iconColor}
                                onChange={(e) => setIconColor(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                            <input
                                type="color"
                                value={iconColor.startsWith('#') ? iconColor : '#FF1493'}
                                onChange={(e) => setIconColor(e.target.value)}
                                className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            รองรับ hex color (#FF1493) หรือ Tailwind color (pink-500)
                        </p>
                        {/* Preview */}
                        {iconClass && (
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                                <span className="text-sm text-gray-600">ตัวอย่าง:</span>
                                <div
                                    className="p-3 rounded-full bg-white border-4 flex items-center justify-center w-14 h-14"
                                    style={{ borderColor: iconColor }}
                                >
                                    <i className={`${iconClass} text-2xl`} style={{ color: iconColor }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingId ? <Pencil size={18} /> : <Plus size={18} />)}
                            {editingId ? "Update Category" : "Create Category"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading categories...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No categories found. Create one above!
                    </div>
                ) : (
                    <AnimatePresence>
                        {categories.map((category) => (
                            <Link key={category.id} href={`/admin/categories/${category.id}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-lg ${category.iconColor || "text-pink-500"} bg-gray-50 flex items-center justify-center overflow-hidden`}>
                                            {category.iconClass ? (
                                                <i className={`${category.iconClass} text-2xl`} />
                                            ) : (
                                                <div className="w-6 h-6 bg-current opacity-20 rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{category.title_en} / {category.title_th}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1">{category.description_en}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium">
                                                {category.questionCount || 0} questions
                                            </span>
                                            <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleEdit(category);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(category.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
