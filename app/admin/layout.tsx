"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setIsAuthorized(true);
                } else {
                    router.push("/login");
                }
            } catch (error) {
                router.push("/login");
            }
        };
        checkAuth();
    }, [router, pathname]); // Re-fetch on pathname change to get fresh permissions

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar user={user} />
            <div className="pl-64">
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}
