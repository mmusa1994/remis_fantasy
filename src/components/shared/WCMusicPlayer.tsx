"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";

const ANTHEM_SRC = "/wc2026/The Official FIFA World Cup 26 Theme.mp3";

export default function WCMusicPlayer({
  src = ANTHEM_SRC,
}: {
  src?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // The anthem NEVER plays automatically. We only set a comfortable default
  // volume on mount so that, when the user taps play, sound comes on at a
  // pleasant level. Entering the page is always silent until the user acts.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    return () => {
      audio.pause();
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        /* noop */
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  if (dismissed) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" playsInline />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 240, delay: 0.6 }}
        className="fixed top-3 right-3 sm:top-auto sm:bottom-6 sm:right-4 z-40 select-none"
      >
        <div
          className={`relative overflow-hidden rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            collapsed
              ? "border-amber-300/60"
              : "border-amber-300/50 dark:border-amber-700/40"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(7, 27, 78, 0.92) 0%, rgba(180, 30, 47, 0.86) 55%, rgba(255, 209, 0, 0.20) 100%)",
          }}
        >
          {/* FIFA WC accent line: navy → red → gold */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#071B4E] via-[#C8102E] to-[#FFD100]" />

          {/* Animated equalizer when playing */}
          {isPlaying && !isMuted && !collapsed && (
            <div className="absolute inset-y-0 right-0 w-20 flex items-end gap-0.5 pr-2 pb-2 pointer-events-none opacity-40">
              {[0.6, 0.9, 0.7, 1, 0.75, 0.85].map((scale, i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-gradient-to-t from-[#FFD100] to-[#C8102E] rounded-sm"
                  animate={{ height: ["20%", `${scale * 100}%`, "20%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.7 + i * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Pulsing ring when playing */}
          {isPlaying && !isMuted && (
            <motion.span
              className="absolute inset-0 rounded-xl pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,209,0,0.40)",
                  "0 0 0 10px rgba(255,209,0,0)",
                  "0 0 0 0 rgba(255,209,0,0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeOut" }}
            />
          )}

          <AnimatePresence initial={false} mode="wait">
            {collapsed ? (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={() => setCollapsed(false)}
                className="relative z-10 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 group"
                title="WC26 Anthem"
              >
                <Image
                  src="/images/logos/wc-logo.png"
                  alt="World Cup 26"
                  width={28}
                  height={28}
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-lg"
                />
                {isPlaying && !isMuted && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFD100] shadow-lg shadow-[#FFD100]/60"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  />
                )}
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2"
              >
                {/* WC crest */}
                <button
                  onClick={() => setCollapsed(true)}
                  className="relative shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Minimize"
                >
                  <Image
                    src="/images/logos/wc-logo.png"
                    alt="World Cup 26"
                    width={28}
                    height={28}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                </button>

                {/* Title */}
                <div className="min-w-0 hidden xs:block sm:block">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#FFD100]/90 leading-none">
                    Anthem
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight truncate max-w-[120px] sm:max-w-[140px]">
                    World Cup 26
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#C8102E] to-[#071B4E] hover:from-[#e01a3a] hover:to-[#0a2470] text-white flex items-center justify-center shadow-md transition-all"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20 text-white"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="relative w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="relative w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                    title="Close"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
