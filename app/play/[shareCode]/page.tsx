"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Shuffle, Package } from "lucide-react";
import Link from "next/link";
import SwipeCard from "../../components/SwipeCard";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import FloatingHearts from "../../components/FloatingHearts";
import { useLanguage } from "../../context/LanguageContext";

interface Question {
    content_th: string;
    content_en: string;
}

interface CustomPack {
    id: string;
    title: string;
    description: string;
    creatorName: string;
    questions: Question[];
    shareCode: string;
}

export default function PlayPackPage() {
    const params = useParams();
    const shareCode = params?.shareCode as string;
    const { t } = useLanguage();

    const [pack, setPack] = useState<CustomPack | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<number[]>([0]);

    const lastFetchedCode = useRef<string | null>(null);

    useEffect(() => {
        const fetchPack = async () => {
            if (shareCode === lastFetchedCode.current) return;
            lastFetchedCode.current = shareCode;

            try {
                const res = await fetch(`/api/custom-packs/${shareCode}`);
                if (res.ok) {
                    const data = await res.json();
                    setPack(data);
                } else {
                    setError("Pack not found");
                }
            } catch (error) {
                console.error("Error fetching pack:", error);
                setError("Failed to load pack");
                lastFetchedCode.current = null; // Reset on error to allow retry
            } finally {
                setIsLoading(false);
            }
        };

        if (shareCode) {
            fetchPack();
        }
    }, [shareCode]);

    const handleNext = () => {
        if (pack && currentIndex < pack.questions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setHistory([...history, nextIndex]);
        }
    };

    const handlePrevious = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            const prevIndex = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            setCurrentIndex(prevIndex);
        }
    };

    const handleShuffle = () => {
        if (pack && pack.questions.length > 0) {
            const randomIndex = Math.floor(Math.random() * pack.questions.length);
            setCurrentIndex(randomIndex);
            setHistory([...history, randomIndex]);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    if (error || !pack) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <FloatingHearts />
                <Package className="text-pink-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("ไม่พบชุดคำถาม", "Pack Not Found")}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    {t(
                        "ชุดคำถามนี้อาจถูกลบหรือรหัสไม่ถูกต้อง",
                        "This pack may have been deleted or the code is incorrect"
                    )}
                </p>
                <Link
                    href="/"
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors"
                >
                    {t("กลับหน้าแรก", "Back to Home")}
                </Link>
            </div>
        );
    }

    if (pack.questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <FloatingHearts />
                <Package className="text-pink-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("ชุดคำถามว่างเปล่า", "Empty Pack")}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    {t(
                        "ชุดคำถามนี้ยังไม่มีคำถามใดๆ",
                        "This pack does not contain any questions yet"
                    )}
                </p>
                <Link
                    href="/"
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors"
                >
                    {t("กลับหน้าแรก", "Back to Home")}
                </Link>
            </div>
        );
    }

    const currentQuestion = pack.questions[currentIndex];

    return (
        <div className="min-h-screen flex flex-col">
            <FloatingHearts />
            {/* Header */}
            <div className="relative p-6 text-center space-y-2">
                <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors z-10">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">{t("กลับหน้าหลัก", "Home")}</span>
                </Link>
                {pack && (
                    <div className="mb-8 flex flex-col items-center justify-center sm:mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="text-pink-500" size={24} />
                            <span className="text-sm text-gray-500">
                                {t("โดย", "by")} {pack.creatorName}
                            </span>
                        </div>
                        <h1 className="mb-3 text-center text-3xl font-bold text-pink-600 sm:text-4xl pt-2">
                            {pack.title}
                        </h1>
                        {pack.description && (
                            <p className="text-center text-base text-gray-600 sm:text-lg max-w-2xl">
                                {pack.description}
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            {currentIndex + 1} / {pack.questions.length}
                        </p>
                    </div>
                )}
            </div>

            {/* Card Container */}
            <div className="flex-1 flex items-center justify-center px-4 pb-32">
                <div className="w-full max-w-sm h-96 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SwipeCard
                                question={{
                                    content_th: currentQuestion.content_th,
                                    content_en: currentQuestion.content_en,
                                }}
                                onSwipe={() => { }}
                                onReveal={() => { }}
                                currentIndex={currentIndex}
                                totalQuestions={pack.questions.length}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-6">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    {/* Navigation Buttons */}
                    {pack.questions.length > 0 && (
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={handlePrevious}
                                disabled={history.length <= 1}
                                className="p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                            >
                                <ChevronLeft size={24} className="text-gray-700" />
                            </button>
                            <button
                                onClick={handleShuffle}
                                disabled={pack.questions.length === 0}
                                className="p-4 rounded-full bg-purple-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                            >
                                <Shuffle size={24} className="text-white" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={pack.questions.length === 0}
                                className="p-4 rounded-full bg-pink-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                            >
                                <ChevronRight size={24} className="text-white" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
