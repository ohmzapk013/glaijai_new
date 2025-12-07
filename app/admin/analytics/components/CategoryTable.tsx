"use client";

import { ArrowUpDown, HelpCircle } from "lucide-react";
import { useState } from "react";

interface CategoryStat {
    categoryId: string;
    categoryName: string;
    totalQuestions: number;
    totalSkips: number;
    avgSkipRate: number;
    playCount: number; // Times played to completion
    visitCount: number; // Times visited
}

interface CategoryTableProps {
    data: CategoryStat[];
}

const Tooltip = ({ text }: { text: string }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block">
            <HelpCircle
                size={14}
                className="text-gray-400 hover:text-pink-500 cursor-help ml-1"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            />
            {show && (
                <div className="absolute z-50 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg -top-2 left-6">
                    {text}
                    <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -left-1 top-3"></div>
                </div>
            )}
        </div>
    );
};

export default function CategoryTable({ data }: CategoryTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof CategoryStat; direction: 'asc' | 'desc' } | null>(null);

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof CategoryStat) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">สถิติตามหมวดหมู่</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ชื่อหมวดหมู่</th>
                            <th
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-pink-500"
                                onClick={() => handleSort('totalQuestions')}
                            >
                                <div className="flex items-center gap-2">
                                    จำนวนคำถาม
                                    <ArrowUpDown size={14} />
                                    <Tooltip text="จำนวนคำถามทั้งหมดในหมวดหมู่นี้" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-pink-500"
                                onClick={() => handleSort('playCount')}
                            >
                                <div className="flex items-center gap-2">
                                    เล่นจบ
                                    <ArrowUpDown size={14} />
                                    <Tooltip text="จำนวนครั้งที่ผู้ใช้เล่นจนถึงคำถามสุดท้าย" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-pink-500"
                                onClick={() => handleSort('visitCount')}
                            >
                                <div className="flex items-center gap-2">
                                    เข้าชม
                                    <ArrowUpDown size={14} />
                                    <Tooltip text="จำนวนครั้งที่ผู้ใช้เข้าหมวดหมู่นี้" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-pink-500"
                                onClick={() => handleSort('totalSkips')}
                            >
                                <div className="flex items-center gap-2">
                                    ข้ามทั้งหมด
                                    <ArrowUpDown size={14} />
                                    <Tooltip text="จำนวนครั้งที่คำถามถูกข้ามโดยไม่เปิดดู" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-pink-500"
                                onClick={() => handleSort('avgSkipRate')}
                            >
                                <div className="flex items-center gap-2">
                                    อัตราการข้าม
                                    <ArrowUpDown size={14} />
                                    <Tooltip text="เปอร์เซ็นต์ของการแสดงที่ถูกข้าม (ข้าม / ครั้งที่แสดง × 100%)" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map((stat) => (
                            <tr key={stat.categoryId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-800 font-medium">{stat.categoryName}</td>
                                <td className="px-6 py-4 text-gray-600">{stat.totalQuestions}</td>
                                <td className="px-6 py-4 text-pink-600 font-medium">{stat.playCount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-blue-600 font-medium">{stat.visitCount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-orange-600 font-medium">{stat.totalSkips.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${Number(stat.avgSkipRate) > 50
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-green-100 text-green-600'
                                        }`}>
                                        {stat.avgSkipRate}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No category data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
