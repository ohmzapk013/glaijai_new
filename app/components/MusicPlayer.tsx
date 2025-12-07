"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isExpanded, setIsExpanded] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Placeholder audio - replace with actual file
    const audioSrc = "https://kury28rznoicmca5.public.blob.vercel-storage.com/glaijaibg-q82iS3sJvffDXhy7mqeJdNJxXTbwZ6";

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((e) => console.error("Playback failed", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
            if (audioRef.current) audioRef.current.muted = false;
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <audio ref={audioRef} src={audioSrc} loop />

            <motion.div
                layout
                className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-pink-200 flex items-center gap-2"
                initial={{ width: "auto" }}
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                >
                    <Music size={20} />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-3 overflow-hidden pr-2"
                        >
                            <button onClick={togglePlay} className="text-pink-600 hover:text-pink-700">
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>

                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800">
                                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 accent-pink-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
