"use client";

import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/80 backdrop-blur-md p-1 rounded-full shadow-md border border-pink-100">
            <button
                onClick={() => setLanguage("th")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${language === "th" ? "bg-pink-500 text-white" : "text-gray-600 hover:text-pink-500"
                    }`}
            >
                TH
            </button>
            <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${language === "en" ? "bg-pink-500 text-white" : "text-gray-600 hover:text-pink-500"
                    }`}
            >
                EN
            </button>
        </div>
    );
}
