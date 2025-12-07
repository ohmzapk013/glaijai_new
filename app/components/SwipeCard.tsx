"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart } from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

interface SwipeCardProps {
    question: {
        content_th: string;
        content_en: string;
    };
    onSwipe: (direction: "left" | "right", isRevealed: boolean) => void;
    onReveal: () => void;
    currentIndex: number;
    totalQuestions: number;
}

export default function SwipeCard({ question, onSwipe, onReveal, currentIndex, totalQuestions }: SwipeCardProps) {
    const { t } = useLanguage();
    const [isRevealed, setIsRevealed] = useState(false);
    const [exitX, setExitX] = useState(0);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;

        if (Math.abs(info.offset.x) > threshold) {
            const direction = info.offset.x > 0 ? "right" : "left";
            setExitX(info.offset.x > 0 ? 500 : -500);
            onSwipe(direction, isRevealed);
        }
    };

    const handleReveal = () => {
        if (!isRevealed) {
            setIsRevealed(true);
            onReveal();
        }
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity,
                perspective: "1000px",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            onTap={handleReveal}
            animate={exitX !== 0 ? { x: exitX } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute w-full max-w-sm h-96 select-none"
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                {/* Front Side (Hidden Question) */}
                <div
                    className="absolute w-full h-full bg-gradient-to-br from-pink-400 to-pink-500 rounded-3xl shadow-2xl flex items-center justify-center p-8 cursor-pointer"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <div className="text-center text-white">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-5xl">?</span>
                            </div>
                            <p className="text-xl font-medium">{t("แตะเพื่อดูคำถาม", "Tap to reveal")}</p>
                            <p className="text-sm opacity-75">{t("หรือปัดเพื่อข้าม", "or swipe to skip")}</p>
                        </div>
                    </div>
                </div>

                {/* Back Side (Revealed Question) */}
                <div
                    className="absolute w-full h-full bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl shadow-2xl flex items-center justify-center p-8"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        cursor: "grab",
                    }}
                >
                    <div className="text-center text-white h-full flex flex-col justify-center">
                        <p className="text-xs opacity-75 absolute top-4 left-0 right-0">❤ {t("คำถามที่", "Question")} {currentIndex + 1} {t("จาก", "of")} {totalQuestions} ❤</p>
                        <p className="text-2xl font-medium leading-relaxed px-8">{t(question.content_th, question.content_en)}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
