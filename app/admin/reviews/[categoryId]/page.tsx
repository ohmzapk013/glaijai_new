"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Trash2, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

interface Review {
    id: string;
    categoryId: string;
    userId: string | null;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface Category {
    id: string;
    title_th: string;
    title_en: string;
    totalReviews?: number;
    averageRating?: number;
}

export default function CategoryReviewsPage() {
    const params = useParams();
    const categoryId = params?.categoryId as string;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (categoryId) {
            fetchCategory();
            fetchReviews();
        }
    }, [categoryId]);

    const fetchCategory = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                const cat = data.find((c: Category) => c.id === categoryId);
                setCategory(cat || null);
            }
        } catch (error) {
            console.error("Failed to fetch category", error);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/categories/${categoryId}/reviews`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        setDeletingId(reviewId);
        try {
            const res = await fetch(`/api/admin/reviews/${categoryId}/${reviewId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId));
                // Refresh category to update stats
                fetchCategory();
            } else {
                alert("Failed to delete review");
            }
        } catch (error) {
            console.error("Failed to delete review", error);
            alert("Error deleting review");
        } finally {
            setDeletingId(null);
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
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/reviews"
                    className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Categories</span>
                </Link>

                {category && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {category.title_th}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-yellow-700">
                                    {(category.averageRating || 0).toFixed(1)}
                                </span>
                            </div>
                            <span className="text-gray-600">
                                {category.totalReviews || 0} total reviews
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">No reviews yet for this category.</p>
                    </div>
                ) : (
                    reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-50 p-2 rounded-full">
                                        <User size={20} className="text-pink-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{review.userName}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    disabled={deletingId === review.id}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deletingId === review.id ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <Trash2 size={20} />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={16}
                                        className={`${star <= review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                            }`}
                                    />
                                ))}
                            </div>

                            {review.comment && (
                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
