"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Separate component to handle search params in Suspense
function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center text-red-500">
                <p>ลิงก์ไม่ถูกต้อง หรือหมดอายุแล้ว</p>
                <div className="mt-4">
                    <Link href="/forgot-password" className="text-pink-500 hover:underline">
                        ขอลิงก์ใหม่
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password.length < 6) {
            setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/members/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
            } else {
                setError(data.error || "ไม่สามารถรีเซ็ตรหัสผ่านได้ (ลิงก์อาจหมดอายุ)");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">เปลี่ยนรหัสผ่านสำเร็จ</h1>
                <p className="text-gray-600 mb-8">
                    รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว <br />สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                </p>
                <Link
                    href="/member-login"
                    className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition-colors w-full"
                >
                    เข้าสู่ระบบ
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งรหัสผ่านใหม่</h1>
                <p className="text-gray-500">กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 ml-1">รหัสผ่านใหม่</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 ml-1">ยืนยันรหัสผ่านใหม่</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>ยืนยันการเปลี่ียนรหัสผ่าน</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-violet-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-pink-100"
            >
                <Suspense fallback={<div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-pink-500" size={32} /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
