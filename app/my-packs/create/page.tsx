"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import FloatingHearts from "../../components/FloatingHearts";

interface Question {
    content_th: string;
    content_en: string;
}

export default function CreatePackPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([
        { content_th: "", content_en: "" }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useLanguage();
    const router = useRouter();

    const addQuestion = () => {
        setQuestions([...questions, { content_th: "", content_en: "" }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index: number, field: "content_th" | "content_en", value: string) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const filteredQuestions = questions.filter(
                (q) => q.content_th.trim() || q.content_en.trim()
            );

            console.log("Creating pack with data:", {
                title,
                description,
                questions: filteredQuestions,
            });

            const res = await fetch("/api/custom-packs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    questions: filteredQuestions,
                }),
            });

            console.log("Response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("Pack created successfully:", data);
                router.push("/my-packs");
            } else {
                const error = await res.json();
                console.error("Error response:", error);
                alert(error.error || "Failed to create pack");
            }
        } catch (error) {
            console.error("Error creating pack:", error);
            alert("Failed to create pack: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <FloatingHearts />
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/my-packs"
                        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>{t("กลับไปชุดคำถาม", "Back to Packs")}</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {t("สร้างชุดคำถามใหม่", "Create New Pack")}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {t(
                            "สร้างชุดคำถามของคุณเองและแชร์ให้เพื่อน",
                            "Create your own question pack and share with friends"
                        )}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Pack Info */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {t("ข้อมูลชุดคำถาม", "Pack Information")}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("ชื่อชุดคำถาม", "Pack Title")} *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                    placeholder={t("เช่น คำถามสำหรับคู่รัก", "e.g. Questions for Couples")}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("คำอธิบาย", "Description")}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                    placeholder={t("อธิบายเกี่ยวกับชุดคำถามนี้", "Describe this pack")}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {t("คำถาม", "Questions")} ({questions.length})
                            </h2>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
                            >
                                <Plus size={20} />
                                {t("เพิ่มคำถาม", "Add Question")}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-xl p-4 relative"
                                >
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(index)}
                                            className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t("คำถาม (ไทย)", "Question (TH)")}
                                            </label>
                                            <textarea
                                                value={question.content_th}
                                                onChange={(e) =>
                                                    updateQuestion(index, "content_th", e.target.value)
                                                }
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                                placeholder={t("พิมพ์คำถามเป็นภาษาไทย", "Type question in Thai")}
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t("คำถาม (อังกฤษ)", "Question (EN)")}
                                            </label>
                                            <textarea
                                                value={question.content_en}
                                                onChange={(e) =>
                                                    updateQuestion(index, "content_en", e.target.value)
                                                }
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                                                placeholder={t("Type question in English", "Type question in English")}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/my-packs"
                            className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            {t("ยกเลิก", "Cancel")}
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {t("กำลังสร้าง...", "Creating...")}
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    {t("สร้างชุดคำถาม", "Create Pack")}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
