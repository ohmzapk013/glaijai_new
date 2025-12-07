"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingHeart {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    rotation: number;
}

export default function FloatingHearts() {
    const [hearts, setHearts] = useState<FloatingHeart[]>([]);

    useEffect(() => {
        // Generate 30 random hearts
        const generatedHearts: FloatingHeart[] = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100, // 0-100vw
            y: Math.random() * 100, // 0-100vh
            size: 10 + Math.random() * 20, // 10-30px
            duration: 15 + Math.random() * 10, // 15-25s
            delay: Math.random() * 5, // 0-5s
            rotation: Math.random() * 360, // 0-360deg
        }));
        setHearts(generatedHearts);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {hearts.map((heart) => (
                <motion.div
                    key={heart.id}
                    className="absolute"
                    initial={{
                        x: `${heart.x}vw`,
                        y: `${heart.y}vh`,
                        scale: 0.8,
                        opacity: 0,
                        rotate: heart.rotation,
                    }}
                    animate={{
                        x: [`${heart.x}vw`, `${heart.x + (Math.random() - 0.5) * 20}vw`, `${heart.x}vw`],
                        y: [`${heart.y}vh`, `${heart.y + (Math.random() - 0.5) * 20}vh`, `${heart.y}vh`],
                        scale: [0.8, 1, 0.8],
                        opacity: [0, 0.7, 0],
                        rotate: [heart.rotation, heart.rotation + 360, heart.rotation],
                    }}
                    transition={{
                        duration: heart.duration,
                        delay: heart.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <svg
                        width={heart.size}
                        height={heart.size}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="heart-icon"
                    >
                        <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="rgba(236, 72, 153, 0.6)"
                            className="animate-pulse"
                        />
                    </svg>
                </motion.div>
            ))}
        </div>
    );
}
