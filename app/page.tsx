"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CategoryCard from "./components/CategoryCard";
import LanguageSwitcher from "./components/LanguageSwitcher";
import FloatingHearts from "./components/FloatingHearts";
import { Loader2, User, LogOut, Heart, TrendingUp, Package, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useLanguage } from "./context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  title_th: string;
  title_en: string;
  description_th: string;
  description_en: string;
  iconClass?: string;
  iconColor?: string;
  averageRating?: number;
  totalReviews?: number;
  playCount?: number;
  totalViews?: number;
}

interface MemberSession {
  email: string;
  displayName: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<MemberSession | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setIsLoading(false);
      }
    };

    const checkMemberSession = async () => {
      try {
        const res = await fetch("/api/members/me");
        if (res.ok) {
          const data = await res.json();
          setMember(data.member);
          fetchFavorites();
        }
      } catch (error) {
        // Not logged in, ignore
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          const favoriteIds = new Set<string>(data.favorites.map((f: any) => f.categoryId as string));
          setFavorites(favoriteIds);
        }
      } catch (error) {
        // Ignore
      }
    };

    fetchCategories();
    checkMemberSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/members/logout", { method: "POST" });
      setMember(null);
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleFavorite = async (category: Category, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!member) return;

    const isFavorited = favorites.has(category.id);

    try {
      if (isFavorited) {
        // Remove from favorites
        const res = await fetch(`/api/favorites?categoryId=${category.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(category.id);
          setFavorites(newFavorites);
        }
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: category.id,
            title_th: category.title_th,
            title_en: category.title_en,
            description_th: category.description_th,
            description_en: category.description_en,
            iconColor: category.iconColor,
          }),
        });

        if (res.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.add(category.id);
          setFavorites(newFavorites);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Floating Hearts Background */}
      <FloatingHearts />
      {/* Fixed Auth Buttons - Desktop (Collapsible for Tablet) */}
      {member ? (
        <>
          {/* Collapsible Menu for Tablet (sm to lg) */}
          <div className="fixed top-4 right-[140px] z-50 hidden sm:flex lg:hidden items-center justify-end">
            <div className={`flex items-center gap-2 ${isMobileMenuExpanded ? 'bg-white/80 backdrop-blur-md p-1 pr-2 rounded-full shadow-md border border-pink-100' : ''}`}>

              {/* Toggle Button */}
              <button
                onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isMobileMenuExpanded ? 'text-gray-400 hover:bg-gray-100' : 'bg-white/80 shadow-md border border-pink-100 text-pink-500'}`}
              >
                {isMobileMenuExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>

              <AnimatePresence>
                {isMobileMenuExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <Link
                      href="/progress"
                      className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors flex items-center gap-1"
                    >
                      <TrendingUp size={16} />
                      <span>{t("ความคืบหน้า", "Progress")}</span>
                    </Link>
                    <Link
                      href="/my-packs"
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Package size={16} />
                      <span>{t("ชุดของฉัน", "My Packs")}</span>
                    </Link>
                    <Link
                      href="/favorites"
                      className="px-3 py-1 text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Heart size={16} />
                      <span>{t("บันทึกไว้", "Saved")}</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Settings size={16} />
                      <span>{t("ตั้งค่า", "Settings")}</span>
                    </Link>
                    <div className="flex items-center gap-2 text-gray-700 px-2 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium">{member.displayName}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <LogOut size={16} />
                      <span>{t("ออกจากระบบ", "Logout")}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fixed Menu for Desktop (lg and up) */}
          <div className="fixed top-4 right-[140px] z-50 hidden lg:flex items-center gap-2 bg-white/80 backdrop-blur-md p-1 rounded-full shadow-md border border-pink-100">
            <Link
              href="/progress"
              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors flex items-center gap-1"
            >
              <TrendingUp size={16} />
              <span>{t("ความคืบหน้า", "Progress")}</span>
            </Link>
            <Link
              href="/my-packs"
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1"
            >
              <Package size={16} />
              <span>{t("ชุดของฉัน", "My Packs")}</span>
            </Link>
            <Link
              href="/favorites"
              className="px-3 py-1 text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-colors flex items-center gap-1"
            >
              <Heart size={16} />
              <span>{t("บันทึกไว้", "Saved")}</span>
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1"
            >
              <Settings size={16} />
              <span>{t("ตั้งค่า", "Settings")}</span>
            </Link>
            <div className="flex items-center gap-2 text-gray-700 px-2">
              <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-sm font-medium">{member.displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut size={16} />
              <span>{t("ออกจากระบบ", "Logout")}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="fixed top-4 right-[140px] z-50 hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-md p-1 rounded-full shadow-md border border-pink-100">
          <a
            href="/member-login"
            className="text-sm text-gray-600 hover:text-pink-600 transition-colors px-3 py-1"
          >
            {t("เข้าสู่ระบบ", "Login")}
          </a>
          <a
            href="/register"
            className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-1 rounded-full transition-colors"
          >
            {t("สมัครสมาชิก", "Register")}
          </a>
        </div>
      )}

      {/* Fixed Auth Buttons - Mobile (Below Language Switcher) */}
      {member ? (
        <div className="fixed top-[60px] right-4 z-50 sm:hidden flex items-center justify-end">
          <div className={`flex items-center gap-2 ${isMobileMenuExpanded ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-1 pr-2 rounded-full shadow-md border border-pink-100 dark:border-gray-700' : ''}`}>

            {/* Toggle Button */}
            <button
              onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isMobileMenuExpanded ? 'text-gray-400 hover:bg-gray-100' : 'bg-white/80 dark:bg-gray-800/80 shadow-md border border-pink-100 dark:border-gray-700 text-pink-500'}`}
            >
              {isMobileMenuExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <AnimatePresence>
              {isMobileMenuExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <Link
                    href="/progress"
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  >
                    <TrendingUp size={16} />
                  </Link>
                  <Link
                    href="/my-packs"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Package size={16} />
                  </Link>
                  <Link
                    href="/favorites"
                    className="p-2 text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <Heart size={16} />
                  </Link>
                  <Link
                    href="/settings"
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <Settings size={16} />
                  </Link>
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <a
          href="/member-login"
          className="fixed top-[60px] right-4 z-50 sm:hidden w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-md border border-pink-100 transition-colors"
        >
          <User size={18} />
        </a>
      )}

      <LanguageSwitcher />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-pink-600 dark:text-pink-400 mb-3">
            {t("ใกล้ใจ Glai Jai", "Glai Jai")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("รวมการ์ดคำถามสำหรับการ Deep Talking ของทุกคู่รักในความสัมพันธ์", "Deep conversation starters for you and your special someone.")}
          </p>
        </div>

        {/* Category Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-pink-500" size={40} />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p>No categories found.</p>
            <p className="text-sm mt-2 dark:text-gray-500">Please add some categories in the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                title_th={category.title_th}
                title_en={category.title_en}
                description_th={category.description_th}
                description_en={category.description_en}
                iconClass={category.iconClass}
                iconColor={category.iconColor}
                isFavorite={favorites.has(category.id)}
                onToggleFavorite={member ? (e) => toggleFavorite(category, e) : undefined}
                averageRating={category.averageRating}
                totalReviews={category.totalReviews}
                playCount={category.playCount}
                totalViews={category.totalViews}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
