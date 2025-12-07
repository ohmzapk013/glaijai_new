"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageCircle, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Category {
    id: string;
    title_th: string;
    title_en: string;
    totalReviews?: number;
    averageRating?: number;
}

export default function AdminReviewsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/categories/stats");
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-pink-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="text-pink-500" />
                    Category Reviews
                </h1>
                <p className="text-gray-500">Select a category to view and moderate reviews.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                    <Link href={`/admin/reviews/${category.id}`} key={category.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                                    {category.title_th}
                                </h3>
                                <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-pink-50 transition-colors">
                                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-500" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-yellow-700">
                                        {(category.averageRating || 0).toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {category.totalReviews || 0} reviews
                                </span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
