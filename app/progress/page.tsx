"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2, ArrowLeft, Target } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

interface CategoryProgress {
    categoryId: string;
    completed: number;
    total: number;
    percentage: number;
    lastPlayed?: string;
}

interface OverallProgress {
    completed: number;
    total: number;
    percentage: number;
}

interface Category {
    id: string;
    title_th: string;
    title_en: string;
}

export default function ProgressPage() {
    const [progress, setProgress] = useState<CategoryProgress[]>([]);
    const [overall, setOverall] = useState<OverallProgress>({ completed: 0, total: 0, percentage: 0 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        checkLoginAndFetchProgress();
    }, []);

    const checkLoginAndFetchProgress = async () => {
        try {
            const res = await fetch("/api/members/me");
            if (res.ok) {
                setIsLoggedIn(true);
                await Promise.all([fetchProgress(), fetchCategories()]);
            } else {
                setIsLoggedIn(false);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const res = await fetch("/api/progress");
            if (res.ok) {
                const data = await res.json();
                setProgress(data.progress);
                setOverall(data.overall);
            }
        } catch (error) {
            console.error("Failed to fetch progress", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        return category ? t(category.title_th, category.title_en) : categoryId;
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
                <Target className="text-pink-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("กรุณาเข้าสู่ระบบ", "Please Login")}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    {t(
                        "คุณต้องเข้าสู่ระบบเพื่อดูความคืบหน้า",
                        "You need to login to view your progress"
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
            <div className="max-w-4xl mx-auto">
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
                        <TrendingUp className="text-pink-500" size={32} />
                        {t("ความคืบหน้าของคุณ", "Your Progress")}
                    </h1>
                </div>

                {/* Overall Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-8 mb-8 text-white shadow-xl"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-2">
                                {t("ความคืบหน้าโดยรวม", "Overall Progress")}
                            </h2>
                            <p className="text-white/80">
                                {t("คำถามที่เล่นแล้ว", "Questions Played")}
                            </p>
                        </div>
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="white"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - overall.percentage / 100)}`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{overall.percentage}%</span>
                                <span className="text-sm text-white/80">
                                    {overall.completed}/{overall.total}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Category Progress */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {t("ความคืบหน้าแต่ละหมวดหมู่", "Progress by Category")}
                    </h2>

                    {progress.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Target className="text-gray-300 mx-auto mb-4" size={64} />
                            <h3 className="text-xl font-medium text-gray-600 mb-2">
                                {t("ยังไม่มีความคืบหน้า", "No progress yet")}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {t(
                                    "เริ่มเล่นคำถามเพื่อติดตามความคืบหน้า",
                                    "Start playing questions to track your progress"
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
                        progress.map((item, index) => (
                            <motion.div
                                key={item.categoryId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-800">
                                        {getCategoryName(item.categoryId)}
                                    </h3>
                                    <span className="text-sm font-medium text-pink-600">
                                        {item.percentage}%
                                    </span>
                                </div>
                                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percentage}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                                    <span>
                                        {item.completed} / {item.total} {t("ข้อ", "questions")}
                                    </span>
                                    <Link
                                        href={`/game/${item.categoryId}`}
                                        className="text-pink-500 hover:text-pink-600 transition-colors"
                                    >
                                        {t("เล่นต่อ", "Continue")} →
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
