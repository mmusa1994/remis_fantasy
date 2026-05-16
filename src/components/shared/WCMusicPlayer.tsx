"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music2 } from "lucide-react";

const STORAGE_KEY = "wc26.music";

type StoredState = {
  playing: boolean;
  volume: number;
};

function readState(): StoredState {
  if (typeof window === "undefined") return { playing: false, volume: 0.35 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { playing: false, volume: 0.35 };
    const p = JSON.parse(raw) as Partial<StoredState>;
    return {
      playing: !!p.playing,
      volume: typeof p.volume === "number" ? p.volume : 0.35,
    };
  } catch {
    return { playing: false, volume: 0.35 };
  }
}

export default function WCMusicPlayer({
  src = "/wc2026/The Official FIFA World Cup 26 Theme.mp3",
}: {
  src?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = readState();
    setVolume(s.volume);
    setPlaying(s.playing);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ playing, volume }),
      );
    } catch {
      /* ignore */
    }
  }, [playing, volume, mounted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // Autoplay blocked — surface unmute state silently.
          setPlaying(false);
        });
      }
    } else {
      el.pause();
    }
  }, [playing]);

  const toggle = () => setPlaying((p) => !p);

  if (!mounted) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pauziraj WC26 himnu" : "Pusti WC26 himnu"}
        title={playing ? "Pauziraj WC26 himnu" : "Pusti WC26 himnu"}
        className={`fixed z-[60] top-3 right-3 sm:top-auto sm:bottom-6 sm:right-6 inline-flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md border transition-all duration-300 ${
          playing
            ? "bg-amber-500/95 text-black border-amber-300 hover:bg-amber-400"
            : "bg-black/60 text-amber-200 border-amber-500/40 hover:bg-black/80"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {playing && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              playing ? "bg-red-500" : "bg-amber-500/70"
            }`}
          />
        </span>
        {playing ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
          WC26
        </span>
        <Music2 className="w-3.5 h-3.5 sm:hidden" />
      </button>
    </>
  );
}
