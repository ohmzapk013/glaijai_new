import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, Play, Eye } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface CategoryCardProps {
    id: string;
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    iconClass?: string;
    iconColor?: string;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    averageRating?: number;
    totalReviews?: number;
    playCount?: number;
    totalViews?: number;
}

export default function CategoryCard({
    id,
    title_th,
    title_en,
    description_th,
    description_en,
    iconClass,
    iconColor = "pink-500",
    isFavorite = false,
    onToggleFavorite,
    averageRating = 0,
    totalReviews = 0,
    playCount = 0,
    totalViews = 0
}: CategoryCardProps) {
    const { t } = useLanguage();

    return (
        <div className="relative">
            <Link href={`/game/${id}`}>
                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow cursor-pointer border border-pink-100 h-full flex flex-col items-center text-center gap-3"
                >
                    {/* Icon with iconColor border */}
                    <div
                        className={`p-4 rounded-full bg-white relative overflow-hidden flex items-center justify-center w-16 h-16 border-4`}
                        style={{ borderColor: iconColor }}
                    >
                        {iconClass && (
                            <i className={`${iconClass} text-3xl`} style={{ color: iconColor }} />
                        )}
                    </div>

                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{t(title_th, title_en)}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{t(description_th, description_en)}</p>

                    {/* Stats Section */}
                    <div className="flex items-center gap-4 mt-2 pt-3 border-t border-gray-100 w-full justify-center">
                        {/* Rating */}
                        {totalReviews > 0 && (
                            <div className="flex items-center gap-1">
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {averageRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({totalReviews})
                                </span>
                            </div>
                        )}

                        {/* Play Count */}
                        {playCount > 0 && (
                            <div className="flex items-center gap-1">
                                <Play size={16} className="text-pink-500 fill-pink-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {playCount.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Total Views (Visits) */}
                        {totalViews > 0 && (
                            <div className="flex items-center gap-1">
                                <Eye size={16} className="text-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {totalViews.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </Link>
            {onToggleFavorite && (
                <button
                    onClick={onToggleFavorite}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all z-10 ${isFavorite
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-white/80 hover:bg-white border border-pink-200"
                        }`}
                >
                    <Heart
                        size={18}
                        className={isFavorite ? "text-white fill-white" : "text-pink-500"}
                    />
                </button>
            )}
        </div>
    );
}
