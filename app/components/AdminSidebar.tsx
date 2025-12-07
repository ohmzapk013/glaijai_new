"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Layers, LogOut, Users, Users2, Bell, BarChart3, MessageCircle, Settings } from "lucide-react";

export default function AdminSidebar({ user }: { user?: any }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/admin", permission: "dashboard" },
        { icon: Layers, label: "หมวดหมู่", href: "/admin/categories", permission: "categories" },
        { icon: BarChart3, label: "สถิติ", href: "/admin/analytics", permission: "dashboard" },
        { icon: Users2, label: "สมาชิก", href: "/admin/members", permission: "members" },
        { icon: MessageCircle, label: "รีวิว", href: "/admin/reviews", permission: "categories" },
        { icon: Users, label: "ผู้ดูแลระบบ", href: "/admin/users", permission: "users" },
        { icon: Bell, label: "การแจ้งเตือน", href: "/admin/notifications", permission: "dashboard" },
        { icon: Settings, label: "การตั้งค่า", href: "/admin/settings", permission: "users" },
    ];

    // Filter items based on permissions
    const filteredItems = menuItems.filter(item =>
        !user || !user.permissions || user.permissions.includes(item.permission)
    );

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                    ระบบจัดการ
                </h1>
                {user && <p className="text-xs text-gray-500 mt-1">เข้าสู่ระบบในนาม: {user.username}</p>}
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? "bg-pink-50 text-pink-600 font-medium shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <item.icon size={20} className={isActive ? "text-pink-500" : "text-gray-400"} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut size={20} />
                    ออกจากระบบ
                </button>
            </div>
        </aside>
    );
}
