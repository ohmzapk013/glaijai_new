"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Home, Loader2, ChevronLeft, ChevronRight, Shuffle, Heart } from "lucide-react";
import Link from "next/link";
import SwipeCard from "../../components/SwipeCard";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import FloatingHearts from "../../components/FloatingHearts";
import { useLanguage } from "../../context/LanguageContext";
import ReviewModal from "../../components/ReviewModal";

interface Question {
    id: string;
    content_th: string;
    content_en: string;
    categoryId: string;
}

interface Category {
    id: string;
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    instructions_th?: string;
    instructions_en?: string;
    iconClass?: string;
    iconColor?: string;
}

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params?.categoryId as string;
    const { t } = useLanguage();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [history, setHistory] = useState<number[]>([0]);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [member, setMember] = useState<any>(null);
    const [isCurrentCardRevealed, setIsCurrentCardRevealed] = useState(false);
    const [showIntroModal, setShowIntroModal] = useState(true);
    const hasTrackedVisit = useRef(false);

    // Check if user is logged in
    useEffect(() => {
        const checkMember = async () => {
            try {
                const res = await fetch("/api/members/me");
                if (res.ok) {
                    const data = await res.json();
                    setMember(data);
                }
            } catch (error) {
                // Not logged in
            }
        };
        checkMember();
    }, []);

    // Load category and questions on mount
    useEffect(() => {
        if (categoryId) {
            setQuestions([]);
            setCurrentIndex(0);
            setPage(1);
            setHasMore(true);

            fetchCategory();
            fetchQuestions(1);

            // Track category visit (totalViews) - only once per session
            if (!hasTrackedVisit.current) {
                hasTrackedVisit.current = true;
                fetch(`/api/categories/${categoryId}/play`, {
                    method: "POST",
                }).catch(() => {
                    // Ignore errors
                });
            }
        }
    }, [categoryId]);

    const trackProgress = async (questionId: string) => {
        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId,
                    questionId,
                }),
            });
        } catch (error) {
            // User might not be logged in, ignore
        }
    };

    const trackQuestionView = async (questionId: string) => {
        try {
            await fetch("/api/questions/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId,
                    action: "view",
                }),
                keepalive: true,
            });
        } catch (error) {
            console.error("Failed to track question view", error);
        }
    };

    const trackQuestionSkip = async (questionId: string) => {
        try {
            await fetch("/api/questions/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId,
                    action: "skip",
                }),
                keepalive: true,
            });
        } catch (error) {
            console.error("Failed to track question skip", error);
        }
    };

    const handleCardReveal = () => {
        if (questions.length > 0 && categoryId) {
            const question = questions[currentIndex];
            if (!question) return;

            setIsCurrentCardRevealed(true);

            const questionId = question.id;
            const storageKey = `viewed_${categoryId}`;

            // Get viewed questions from session storage
            const storedViews = sessionStorage.getItem(storageKey);
            const viewedSet = new Set(storedViews ? JSON.parse(storedViews) : []);

            // Only track if not already viewed in this session
            if (!viewedSet.has(questionId)) {
                console.log("Tracking view for:", questionId);
                viewedSet.add(questionId);
                sessionStorage.setItem(storageKey, JSON.stringify(Array.from(viewedSet)));

                trackProgress(questionId);
                trackQuestionView(questionId);
            }
        }
    };

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

    const fetchQuestions = async (pageNum: number) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/questions?categoryId=${categoryId}&page=${pageNum}&limit=10`);
            const data = await res.json();

            if (data.data && Array.isArray(data.data)) {
                const validQuestions = data.data.filter((q: Question) => q.content_th || q.content_en);
                setQuestions(prev => pageNum === 1 ? validQuestions : [...prev, ...validQuestions]);
                setHasMore(data.meta.page < data.meta.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipe = (direction: "left" | "right", isRevealed: boolean) => {
        // Track skip if not revealed
        if (!isRevealed && questions[currentIndex]) {
            trackQuestionSkip(questions[currentIndex].id);
        }

        if (direction === "left") {
            goToPreviousQuestion();
        } else {
            goToNextQuestion();
        }
    };

    const goToPreviousQuestion = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            const previousIndex = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            setCurrentIndex(previousIndex);
            setIsCurrentCardRevealed(false);
        }
    };

    const goToNextQuestion = () => {
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                setHistory([...history, nextIndex]);
                setIsCurrentCardRevealed(false);

                // Load more when nearing the end
                if (nextIndex >= questions.length - 3 && hasMore && !isLoading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchQuestions(nextPage);
                }
            } else {
                // End of deck - Track completion
                fetch(`/api/categories/${categoryId}/complete`, {
                    method: "POST",
                }).catch(() => {
                    // Ignore errors
                });

                // Check if logged in before showing review
                if (member) {
                    setIsReviewOpen(true);
                } else {
                    if (confirm(t("กรุณาเข้าสู่ระบบเพื่อให้คะแนน", "Please login to leave a review"))) {
                        router.push("/member-login");
                    } else {
                        setCurrentIndex(0);
                        setHistory([0]);
                        setIsCurrentCardRevealed(false);
                    }
                }
            }
        }, 300);
    };

    const handleNextClick = () => {
        // Track skip if clicked next without revealing
        if (!isCurrentCardRevealed && questions[currentIndex]) {
            trackQuestionSkip(questions[currentIndex].id);
        }
        goToNextQuestion();
    };

    const handlePreviousClick = () => {
        goToPreviousQuestion();
    };

    const handleShuffle = () => {
        if (questions.length > 0) {
            const randomIndex = Math.floor(Math.random() * questions.length);
            setCurrentIndex(randomIndex);
            setHistory([...history, randomIndex]);
            setIsCurrentCardRevealed(false);
        }
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        try {
            const res = await fetch(`/api/categories/${categoryId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(`Failed to submit review: ${data.error || 'Unknown error'}`);
                return;
            }

            router.push("/");
        } catch (error) {
            console.error("Failed to submit review", error);
            alert("Error submitting review");
        }
    };

    const handleReviewClose = () => {
        setIsReviewOpen(false);
        setCurrentIndex(0);
        setHistory([0]);
    };

    if (isLoading && questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-white supports-[height:100dvh]:h-[100dvh] supports-[height:100svh]:h-[100svh]">
            <FloatingHearts />

            <div className="relative p-6 text-center space-y-2">
                <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-sm">{t("กลับไปหน้าหมวดหมู่", "Back to Categories")}</span>
                </Link>
                {category && (
                    <div className="mb-8 flex flex-col items-center justify-center sm:mb-10">
                        <h1 className="mb-3 flex items-center gap-2 text-center text-3xl font-bold text-pink-600 sm:text-4xl pt-8">
                            <Heart className="h-6 w-6 fill-pink-400 text-pink-400 sm:h-7 sm:w-7" />
                            {t(category.title_th, category.title_en)}
                            <Heart className="h-6 w-6 fill-pink-400 text-pink-400 sm:h-7 sm:w-7" />
                        </h1>
                        <p className="text-center text-base text-gray-600 sm:text-lg">
                            {t(category.description_th, category.description_en)}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative">
                <div className="absolute left-0 right-0 top-[-36px] text-center text-base text-gray-600">
                    {t("ปัดซ้ายหรือขวาเพื่อเปลี่ยนคำถาม", "Swipe left or right to change question")}
                </div>
                <AnimatePresence>
                    {questions.length > 0 ? (
                        <SwipeCard
                            key={`${questions[currentIndex].id}-${currentIndex}`}
                            question={questions[currentIndex]}
                            onSwipe={handleSwipe}
                            onReveal={handleCardReveal}
                            currentIndex={currentIndex}
                            totalQuestions={questions.length}
                        />
                    ) : (
                        <div className="text-center text-gray-500">
                            <p>{t("ยังไม่มีคำถามในหมวดนี้", "No questions in this category yet.")}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 space-y-4 relative z-10 bg-white/50 backdrop-blur-sm">
                {questions.length > 0 && (
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={handlePreviousClick}
                            disabled={history.length <= 1}
                            className="p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                        >
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <button
                            onClick={handleShuffle}
                            disabled={questions.length === 0}
                            className="p-4 rounded-full bg-purple-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                        >
                            <Shuffle size={24} className="text-white" />
                        </button>
                        <button
                            onClick={handleNextClick}
                            disabled={questions.length === 0}
                            className="p-4 rounded-full bg-pink-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                        >
                            <ChevronRight size={24} className="text-white" />
                        </button>
                    </div>
                )}

                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
                    >
                        <Home size={20} />
                        <span>{t("กลับหน้าหลัก", "Back to Home")}</span>
                    </Link>
                </div>
            </div>

            <ReviewModal
                isOpen={isReviewOpen}
                onClose={handleReviewClose}
                onSubmit={handleReviewSubmit}
            />

            {/* Intro Modal */}
            <AnimatePresence>
                {category && (category.instructions_th || category.instructions_en) && showIntroModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 fill-current" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {t(category.title_th, category.title_en)}
                                </h2>
                                <div className="text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-line">
                                    {t(category.instructions_th || category.description_th, category.instructions_en || category.description_en)}
                                </div>
                                <button
                                    onClick={() => setShowIntroModal(false)}
                                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95"
                                >
                                    {t("เริ่มเล่น", "Start Game")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
