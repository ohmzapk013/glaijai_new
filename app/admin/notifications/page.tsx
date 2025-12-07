"use client";

import { useEffect, useState } from "react";
import { Bell, Check, UserPlus, Package } from "lucide-react";
import { motion } from "framer-motion";

interface Notification {
    id: string;
    type: 'new_user' | 'new_pack' | 'system';
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_user': return <UserPlus size={20} className="text-blue-500" />;
            case 'new_pack': return <Package size={20} className="text-purple-500" />;
            default: return <Bell size={20} className="text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    <p className="text-gray-500">Stay updated with latest activities.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                        Unread: {notifications.filter(n => !n.isRead).length}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification, index) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl border flex items-start gap-4 transition-colors ${notification.isRead
                                    ? "bg-white border-gray-100"
                                    : "bg-blue-50 border-blue-100"
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${notification.isRead ? "bg-gray-50" : "bg-white"}`}>
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1">
                                <p className={`text-sm ${notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {!notification.isRead && (
                                <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                    title="Mark as read"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
