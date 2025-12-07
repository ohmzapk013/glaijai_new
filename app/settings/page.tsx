"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Loader2, Lock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import FloatingHearts from "../components/FloatingHearts";

export default function SettingsPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState("");

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/members/settings");
            if (res.status === 401) {
                router.push("/member-login");
                return;
            }
            const data = await res.json();
            if (data.displayName) {
                setDisplayName(data.displayName);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            setMessage({ type: 'error', text: t("โหลดข้อมูลไม่สำเร็จ", "Failed to load settings") });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDisplayName = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/members/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: t("บันทึกชื่อเล่นแล้ว", "Display name saved successfully") });
                // Refresh the page to update member data in header
                setTimeout(() => {
                    router.refresh();
                    window.location.reload();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: data.error || t("บันทึกไม่สำเร็จ", "Failed to save") });
            }
        } catch (error) {
            console.error("Failed to save display name", error);
            setMessage({ type: 'error', text: t("บันทึกไม่สำเร็จ", "Failed to save") });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: t("กรุณากรอกข้อมูลให้ครบ", "Please fill in all fields") });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t("รหัสผ่านใหม่ไม่ตรงกัน", "New passwords do not match") });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: t("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "Password must be at least 6 characters") });
            return;
        }

        setIsChangingPassword(true);
        setMessage(null);

        try {
            const res = await fetch("/api/members/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: t("เปลี่ยนรหัสผ่านสำเร็จ", "Password changed successfully") });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: 'error', text: data.error || t("เปลี่ยนรหัสผ่านไม่สำเร็จ", "Failed to change password") });
            }
        } catch (error) {
            console.error("Failed to change password", error);
            setMessage({ type: 'error', text: t("เปลี่ยนรหัสผ่านไม่สำเร็จ", "Failed to change password") });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <FloatingHearts />

            <div className="max-w-2xl mx-auto p-6 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="text-gray-600" size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t("การตั้งค่า", "Settings")}
                    </h1>
                </div>

                {/* Settings Form */}
                <div className="space-y-6">
                    {/* Display Name Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User className="text-pink-500" size={20} />
                            {t("ข้อมูลโปรไฟล์", "Profile Settings")}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("ชื่อเล่น", "Display Name")}
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder={t("ชื่อที่จะแสดงบนเว็บไซต์", "Name to display on website")}
                                />
                            </div>
                            <button
                                onClick={handleSaveDisplayName}
                                disabled={isSaving}
                                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Save size={20} />
                                )}
                                {t("บันทึกชื่อเล่น", "Save Display Name")}
                            </button>
                        </div>
                    </div>

                    {/* Security Section (Password Change) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lock className="text-pink-500" size={20} />
                            {t("ความปลอดภัย", "Security")}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("รหัสผ่านปัจจุบัน", "Current Password")}
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("รหัสผ่านใหม่", "New Password")}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder={t("อย่างน้อย 6 ตัวอักษร", "At least 6 characters")}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("ยืนยันรหัสผ่านใหม่", "Confirm New Password")}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isChangingPassword ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Lock size={20} />
                                )}
                                {t("เปลี่ยนรหัสผ่าน", "Change Password")}
                            </button>
                        </div>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div className={`p-4 rounded-xl text-center ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
