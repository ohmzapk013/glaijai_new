"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useRouter } from "next/navigation";
import CategoryCard from "../components/CategoryCard";

interface Favorite {
    categoryId: string;
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    iconClass?: string;
    iconColor?: string;
    savedAt: string;
}

export default function FavoritesPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkLoginAndFetchFavorites();
    }, []);

    const checkLoginAndFetchFavorites = async () => {
        try {
            const res = await fetch("/api/members/me");
            if (res.ok) {
                setIsLoggedIn(true);
                fetchFavorites();
            } else {
                setIsLoggedIn(false);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    };

    const fetchFavorites = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/favorites");
            if (res.ok) {
                const data = await res.json();
                setFavorites(data.favorites);
            }
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFavorite = async (categoryId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch(`/api/favorites?categoryId=${categoryId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setFavorites(favorites.filter((f) => f.categoryId !== categoryId));
            }
        } catch (error) {
            console.error("Failed to remove favorite", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Heart className="text-pink-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("กรุณาเข้าสู่ระบบ", "Please Login")}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    {t(
                        "คุณต้องเข้าสู่ระบบเพื่อดูหมวดหมู่ที่บันทึกไว้",
                        "You need to login to view your saved categories"
                    )}
                </p>
                <div className="flex gap-4">
                    <Link
                        href="/member-login"
                        className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors"
                    >
                        {t("เข้าสู่ระบบ", "Login")}
                    </Link>
                    <Link
                        href="/"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl transition-colors"
                    >
                        {t("กลับหน้าแรก", "Back to Home")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>{t("กลับหน้าแรก", "Back to Home")}</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Heart className="text-pink-500 fill-pink-500" size={32} />
                        {t("หมวดหมู่ที่บันทึกไว้", "Saved Categories")}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {t(
                            `ทั้งหมด ${favorites.length} หมวดหมู่`,
                            `Total ${favorites.length} categories`
                        )}
                    </p>
                </div>

                {/* Favorites Grid */}
                {favorites.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Heart className="text-gray-300 mx-auto mb-4" size={64} />
                        <h3 className="text-xl font-medium text-gray-600 mb-2">
                            {t("ยังไม่มีหมวดหมู่ที่บันทึกไว้", "No saved categories yet")}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {t(
                                "กดปุ่มหัวใจในหมวดหมู่เพื่อบันทึก",
                                "Tap the heart button on categories to save them"
                            )}
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors"
                        >
                            {t("เลือกหมวดหมู่", "Browse Categories")}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {favorites.map((favorite) => (
                                <motion.div
                                    key={favorite.categoryId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <CategoryCard
                                        id={favorite.categoryId}
                                        title_th={favorite.title_th}
                                        title_en={favorite.title_en}
                                        description_th={favorite.description_th}
                                        description_en={favorite.description_en}
                                        iconClass={favorite.iconClass}
                                        iconColor={favorite.iconColor}
                                        isFavorite={true}
                                        onToggleFavorite={(e) => removeFavorite(favorite.categoryId, e)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
