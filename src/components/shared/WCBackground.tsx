"use client";

import Image from "next/image";

type WCVariant = "hero" | "table" | "matches" | "default";

// Per-variant fallback images. Admin can override via the `src` prop —
// usually wired from a per-tournament theme_background_image field so
// each World Cup tournament can pick its own backdrop.
const SRC: Record<WCVariant, string> = {
  hero: "/wc2026/bg-full-wc-2026.jpg",
  table: "/wc2026/wc-bg1.jpg",
  matches: "/wc2026/wc-bg-2.webp",
  default: "/wc2026/wc-bg-3.webp",
};

type Props = {
  variant?: WCVariant;
  /** Absolute or root-relative path. Overrides the variant default. */
  src?: string | null;
  className?: string;
  opacity?: number;
  fixed?: boolean;
  /**
   * Overlay strength 0-1. Higher = more readable text but less BG visibility.
   * Default 0.7 — keeps foreground legible without losing the artwork.
   */
  overlay?: number;
};

export default function WCBackground({
  variant = "default",
  src,
  className = "",
  opacity = 0.4,
  fixed = false,
  overlay = 0.5,
}: Props) {
  const resolved = src && src.trim().length > 0 ? src : SRC[variant];
  return (
    <div
      aria-hidden
      className={`pointer-events-none inset-0 overflow-hidden ${
        fixed ? "fixed" : "absolute"
      } ${className}`}
      style={{ zIndex: 0 }}
    >
      <Image
        src={resolved}
        alt=""
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center"
        style={{ opacity }}
      />
      {/* Light/dark overlay — keep text contrast without fully hiding image */}
      <div
        className="absolute inset-0 bg-white dark:bg-black"
        style={{ opacity: overlay }}
      />
      {/* Gentle vignette to fade edges into the page chrome */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-theme-background/60" />
    </div>
  );
}
