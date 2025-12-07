"use client";

import { useState, useEffect } from "react";
import { Save, Shield, Lock, AlertTriangle, Loader2 } from "lucide-react";

interface SecuritySettings {
    loginLockout: {
        enabled: boolean;
        maxAttempts: number;
        lockDurationMinutes: number;
    };
    turnstile: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
}

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<SecuritySettings>({
        loginLockout: {
            enabled: true,
            maxAttempts: 5,
            lockDurationMinutes: 10,
        },
        turnstile: {
            enabled: false,
            siteKey: "",
            secretKey: "",
        },
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                // Ensure structure integrity even if DB has partial data
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    loginLockout: { ...prev.loginLockout, ...(data.loginLockout || {}) },
                    turnstile: { ...prev.turnstile, ...(data.turnstile || {}) }
                }));
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            setMessage({ type: 'error', text: "Failed to load settings" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: "Settings saved successfully" });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Failed to save settings", error);
            setMessage({ type: 'error', text: "Failed to save settings" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-pink-500" size={40} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <Shield className="text-pink-500" />
                System Security Settings
            </h1>

            <div className="grid gap-8 max-w-4xl">
                {/* Account Lockout Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Lock size={20} className="text-pink-500" />
                            Account Lockout Policy
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.loginLockout.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    loginLockout: { ...settings.loginLockout, enabled: e.target.checked }
                                })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Failed Attempts
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.loginLockout.maxAttempts}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    loginLockout: { ...settings.loginLockout, maxAttempts: parseInt(e.target.value) || 5 }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Number of incorrect passwords before lockout</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lockout Duration (Minutes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.loginLockout.lockDurationMinutes}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    loginLockout: { ...settings.loginLockout, lockDurationMinutes: parseInt(e.target.value) || 10 }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">How long the account remains locked</p>
                        </div>
                    </div>
                </div>

                {/* Cloudflare Turnstile Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Shield size={20} className="text-pink-500" />
                            Cloudflare Turnstile (Captcha)
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.turnstile.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    turnstile: { ...settings.turnstile, enabled: e.target.checked }
                                })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Site Key
                            </label>
                            <input
                                type="text"
                                value={settings.turnstile.siteKey}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    turnstile: { ...settings.turnstile, siteKey: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                                placeholder="0x4AAAAAA..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                value={settings.turnstile.secretKey}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    turnstile: { ...settings.turnstile, secretKey: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                                placeholder="0x4AAAAAA..."
                            />
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl flex items-start gap-3 text-sm text-yellow-700">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>
                                Ensure you have added your domain to Cloudflare Turnstile dashboard before enabling.
                                Invalid keys will prevent users from registering.
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-center ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <Save size={20} />
                    )}
                    Save Settings
                </button>
            </div>
        </div>
    );
}
