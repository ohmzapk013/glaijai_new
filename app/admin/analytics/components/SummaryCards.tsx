"use client";

import { BarChart3, Eye, SkipForward, TrendingUp, LucideIcon } from "lucide-react";

interface SummaryCardsProps {
    summary: {
        totalQuestions: number;
        totalViews: number;
        totalSkips: number;
        avgSkipRate: number;
    } | undefined;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Total Questions</span>
                    <BarChart3 className="text-blue-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{summary?.totalQuestions || 0}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Total Views</span>
                    <Eye className="text-green-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{summary?.totalViews?.toLocaleString() || 0}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Total Skips</span>
                    <SkipForward className="text-orange-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{summary?.totalSkips?.toLocaleString() || 0}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Avg Skip Rate</span>
                    <TrendingUp className="text-red-500" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{summary?.avgSkipRate || 0}%</p>
            </div>
        </div>
    );
}
