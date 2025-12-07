"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Turnstile from "react-turnstile";

interface SecuritySettings {
    turnstile: {
        enabled: boolean;
        siteKey: string;
    }
}

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [settings, setSettings] = useState<SecuritySettings>({ turnstile: { enabled: false, siteKey: "" } });
    const [turnstileToken, setTurnstileToken] = useState("");

    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/system/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (settings.turnstile.enabled && !turnstileToken) {
            setError("Please complete the captcha verification");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/members/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    displayName,
                    cfTurnstileResponse: turnstileToken
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/member-login");
                }, 2000);
            } else {
                // If it was a captcha error, reset the token
                if (data.error.includes("Captcha")) {
                    setTurnstileToken("");
                }
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-violet-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-pink-100"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">สมัครสมาชิก</h1>
                    <p className="text-gray-500">สร้างบัญชีของคุณเพื่อเริ่มใช้งาน</p>
                </div>

                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">สมัครสมาชิกสำเร็จ!</h3>
                        <p className="text-gray-500">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">ชื่อผู้ใช้งาน</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                    placeholder="กรอกชื่อผู้ใช้งาน"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">อีเมล</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">รหัสผ่าน</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                    placeholder="สร้างรหัสผ่าน"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Turnstile Widget */}
                        {settings.turnstile.enabled && settings.turnstile.siteKey && (
                            <div className="flex justify-center">
                                <Turnstile
                                    sitekey={settings.turnstile.siteKey}
                                    onVerify={(token) => setTurnstileToken(token)}
                                    onError={() => setError("Captcha loading failed")}
                                    onExpire={() => setTurnstileToken("")}
                                />
                            </div>
                        )}

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
                            disabled={isLoading || (settings.turnstile.enabled && !turnstileToken)}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>สมัครสมาชิก</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center space-y-2">
                    <Link href="/member-login" className="text-sm text-pink-600 hover:text-pink-700 transition-colors block">
                        มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                    </Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-pink-600 transition-colors block">
                        ← กลับหน้าหลัก
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
