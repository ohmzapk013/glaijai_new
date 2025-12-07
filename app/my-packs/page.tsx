"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Share2, Trash2, Pencil, Loader2, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import FloatingHearts from "../components/FloatingHearts";

interface CustomPack {
    id: string;
    title: string;
    description: string;
    shareCode: string;
    questions: Array<{
        content_th: string;
        content_en: string;
    }>;
    playCount: number;
    createdAt: string;
}

export default function MyPacksPage() {
    const [packs, setPacks] = useState<CustomPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { t } = useLanguage();
    const router = useRouter();

    useEffect(() => {
        checkLoginAndFetchPacks();
    }, []);

    const checkLoginAndFetchPacks = async () => {
        try {
            const res = await fetch("/api/members/me");
            if (res.ok) {
                setIsLoggedIn(true);
                fetchPacks();
            } else {
                setIsLoggedIn(false);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    };

    const fetchPacks = async () => {
        try {
            const res = await fetch("/api/custom-packs");
            if (res.ok) {
                const data = await res.json();
                setPacks(data.packs);
            }
        } catch (error) {
            console.error("Failed to fetch packs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("ต้องการลบชุดคำถามนี้?", "Delete this pack?"))) {
            return;
        }

        try {
            const res = await fetch(`/api/custom-packs?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setPacks(packs.filter((p) => p.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete pack", error);
        }
    };

    const copyShareCode = (code: string) => {
        const shareUrl = `${window.location.origin}/play/${code}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
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
                <FloatingHearts />
                <Package className="text-pink-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("กรุณาเข้าสู่ระบบ", "Please Login")}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    {t(
                        "คุณต้องเข้าสู่ระบบเพื่อสร้างและจัดการชุดคำถาม",
                        "You need to login to create and manage question packs"
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
            <FloatingHearts />
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Package className="text-pink-500" size={32} />
                            {t("ชุดคำถามของฉัน", "My Question Packs")}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {t(
                                "สร้างและแชร์ชุดคำถามของคุณเอง",
                                "Create and share your own question packs"
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                        >
                            <ArrowLeft size={20} />
                            {t("กลับหน้าหลัก", "Back to Home")}
                        </Link>
                        <Link
                            href="/my-packs/create"
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            {t("สร้างชุดใหม่", "Create Pack")}
                        </Link>
                    </div>
                </div>

                {/* Packs Grid */}
                {packs.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Package className="text-gray-300 mx-auto mb-4" size={64} />
                        <h3 className="text-xl font-medium text-gray-600 mb-2">
                            {t("ยังไม่มีชุดคำถาม", "No packs yet")}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {t(
                                "สร้างชุดคำถามแรกของคุณเพื่อเริ่มต้น",
                                "Create your first pack to get started"
                            )}
                        </p>
                        <Link
                            href="/my-packs/create"
                            className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors"
                        >
                            {t("สร้างชุดใหม่", "Create Pack")}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {packs.map((pack) => (
                                <motion.div
                                    key={pack.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">
                                                {pack.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {pack.description || t("ไม่มีคำอธิบาย", "No description")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <span>{pack.questions.length} {t("คำถาม", "questions")}</span>
                                        <span>•</span>
                                        <span>{pack.playCount} {t("ครั้ง", "plays")}</span>
                                    </div>

                                    {/* Share Code */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t("รหัสแชร์", "Share Code")}
                                                </p>
                                                <p className="font-mono font-bold text-pink-600">
                                                    {pack.shareCode}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyShareCode(pack.shareCode)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                {copiedCode === pack.shareCode ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} className="text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/play/${pack.shareCode}`}
                                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors text-center text-sm font-medium"
                                        >
                                            {t("เล่น", "Play")}
                                        </Link>
                                        <Link
                                            href={`/my-packs/${pack.id}/edit`}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Pencil size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(pack.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
