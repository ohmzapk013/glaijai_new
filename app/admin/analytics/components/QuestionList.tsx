"use client";

import { LucideIcon } from "lucide-react";

interface QuestionListProps {
    title: string;
    icon: LucideIcon;
    iconColor: string;
    questions: any[];
    emptyMessage?: string;
    renderStats: (question: any) => React.ReactNode;
}

export default function QuestionList({
    title,
    icon: Icon,
    iconColor,
    questions,
    emptyMessage = "No data yet",
    renderStats
}: QuestionListProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Icon className={iconColor} size={24} />
                {title}
            </h2>
            <div className="space-y-3">
                {!questions || questions.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">{emptyMessage}</p>
                ) : (
                    questions.map((q: any, index: number) => (
                        <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{q.content_en}</p>
                                    <p className="text-sm text-gray-500">{q.content_th}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                {renderStats(q)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
