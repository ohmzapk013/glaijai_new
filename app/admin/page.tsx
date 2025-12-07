"use client";

import { useEffect, useState } from "react";
import { Layers, MessageCircle, Users, Users2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ categories: 0, questions: 0, members: 0, admins: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesRes, questionsRes, membersRes, usersRes] = await Promise.all([
                    fetch("/api/categories"),
                    fetch("/api/questions"),
                    fetch("/api/members?page=1&limit=1"),
                    fetch("/api/users"),
                ]);

                const categories = await categoriesRes.json();
                const questionsData = await questionsRes.json();
                const membersData = await membersRes.json();
                const users = await usersRes.json();

                // Count total questions from all categories
                let totalQuestions = 0;
                if (questionsData && typeof questionsData === 'object') {
                    Object.values(questionsData).forEach((categoryQuestions: any) => {
                        if (Array.isArray(categoryQuestions)) {
                            totalQuestions += categoryQuestions.length;
                        }
                    });
                }

                setStats({
                    categories: Array.isArray(categories) ? categories.length : 0,
                    questions: totalQuestions,
                    members: membersData?.meta?.total || 0,
                    admins: Array.isArray(users) ? users.length : 0,
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = [
        {
            label: "หมวดหมู่ทั้งหมด",
            value: stats.categories,
            icon: Layers,
            color: "bg-blue-500",
            bg: "bg-blue-50",
            text: "text-blue-600",
        },
        {
            label: "คำถามทั้งหมด",
            value: stats.questions,
            icon: MessageCircle,
            color: "bg-pink-500",
            bg: "bg-pink-50",
            text: "text-pink-600",
        },
        {
            label: "สมาชิก",
            value: stats.members,
            icon: Users2,
            color: "bg-purple-500",
            bg: "bg-purple-50",
            text: "text-purple-600",
        },
        {
            label: "ผู้ดูแลระบบ",
            value: stats.admins,
            icon: Users,
            color: "bg-green-500",
            bg: "bg-green-50",
            text: "text-green-600",
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">ภาพรวมแดชบอร์ด</h1>
                <p className="text-gray-500">ยินดีต้อนรับสู่ศูนย์ควบคุมของคุณ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                    >
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.text}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {isLoading ? "-" : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
