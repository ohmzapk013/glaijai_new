"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import CategoryTable from "./components/CategoryTable";

interface AnalyticsData {
    summary: {
        totalQuestions: number;
        totalViews: number;
        totalSkips: number;
        avgSkipRate: number;
    };
    topViewed: any[];
    mostSkipped: any[];
    highestSkipRate: any[];
    trending: any[];
    categoryStats: any[];
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/analytics/questions", { cache: "no-store" });
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-pink-500" size={48} />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">ไม่สามารถโหลดข้อมูลสถิติได้</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">สถิติคำถาม</h1>
                <p className="text-gray-500">ข้อมูลเชิงลึกและสถิติแยกตามหมวดหมู่</p>
            </div>

            <CategoryTable data={analytics.categoryStats} />
        </div>
    );
}
