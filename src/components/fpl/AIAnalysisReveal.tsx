"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface AIAnalysisRevealProps {
  text: string;
  speedMs?: number;
}

// Streams the analysis text character by character with a typewriter feel,
// then highlights **bold** segments with a violet→fuchsia gradient.
export default function AIAnalysisReveal({ text, speedMs = 8 }: AIAnalysisRevealProps) {
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);
  const clean = useMemo(() => text || "", [text]);

  useEffect(() => {
    setRevealed(0);
    setDone(false);
    if (!clean) return;
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      // accelerate as text gets longer
      const step = clean.length > 1200 ? 4 : clean.length > 600 ? 2 : 1;
      i = Math.min(i + step, clean.length);
      setRevealed(i);
      if (i < clean.length) {
        setTimeout(tick, speedMs);
      } else {
        setDone(true);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [clean, speedMs]);

  const visible = clean.slice(0, revealed);
  const html = visible.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 dark:from-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">$1</strong>'
  );

  return (
    <div className="relative">
      <div
        className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!done && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="inline-block align-middle ml-0.5 w-[7px] h-[14px] bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-sm"
        />
      )}
    </div>
  );
}
