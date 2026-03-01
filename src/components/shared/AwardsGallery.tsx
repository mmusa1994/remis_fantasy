"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
}

interface AwardsGalleryProps {
  photos: GalleryPhoto[];
  accentColor: string;
  title: string;
  subtitle: string;
  emptyMessage: string;
}

const PLACEHOLDER_PHOTOS = [
  {
    caption: "Season Finale Awards 2024",
    gradient: "from-indigo-900 via-blue-800 to-sky-900",
  },
  {
    caption: "Championship Celebration",
    gradient: "from-rose-900 via-pink-800 to-fuchsia-900",
  },
  {
    caption: "Best Player Award",
    gradient: "from-amber-900 via-orange-800 to-yellow-900",
  },
  {
    caption: "Team of the Season",
    gradient: "from-emerald-900 via-teal-800 to-cyan-900",
  },
  {
    caption: "Golden Boot Winner",
    gradient: "from-violet-900 via-purple-800 to-indigo-900",
  },
  {
    caption: "Most Improved Player",
    gradient: "from-sky-900 via-blue-800 to-indigo-900",
  },
  {
    caption: "Fair Play Award",
    gradient: "from-teal-900 via-emerald-800 to-green-900",
  },
  {
    caption: "Season Highlights",
    gradient: "from-fuchsia-900 via-pink-800 to-rose-900",
  },
  {
    caption: "Draft Night Memories",
    gradient: "from-slate-800 via-gray-700 to-zinc-900",
  },
];

export default function AwardsGallery({
  photos,
  accentColor,
  title,
  subtitle,
}: AwardsGalleryProps) {
  const { theme } = useTheme();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const showPlaceholders = photos.length === 0;

  const openLightbox = (index: number) => {
    if (!showPlaceholders) setLightboxIndex(index);
  };
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  return (
    <section>
      <div className="text-center mb-10">
        <h2
          className={`text-2xl md:text-3xl font-bold tracking-tight mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
        <p
          className={`text-sm md:text-base ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-dense auto-rows-[160px] sm:auto-rows-[180px] md:auto-rows-[240px] gap-2 md:gap-3">
        {showPlaceholders
          ? PLACEHOLDER_PHOTOS.map((item, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden transition-all duration-500 hover:-translate-y-0.5 ${
                  i === 0
                    ? "col-span-2 row-span-2 rounded-2xl"
                    : "rounded-xl"
                } ${
                  theme === "dark"
                    ? "ring-1 ring-white/[0.06] hover:ring-white/[0.12]"
                    : "ring-1 ring-black/[0.04] hover:ring-black/[0.08]"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent" />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />

                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <div className="backdrop-blur-md bg-black/40 rounded-lg px-3 py-2">
                    <p className="text-white text-xs md:text-sm font-medium">
                      {item.caption}
                    </p>
                  </div>
                </div>
              </div>
            ))
          : photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className={`group relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-0.5 ${
                  i === 0
                    ? "col-span-2 row-span-2 rounded-2xl"
                    : "rounded-xl"
                } ${
                  theme === "dark"
                    ? "ring-1 ring-white/[0.06] hover:ring-white/[0.12]"
                    : "ring-1 ring-black/[0.04] hover:ring-black/[0.08]"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  sizes={
                    i === 0
                      ? "(max-width: 768px) 100vw, 66vw"
                      : "(max-width: 640px) 50vw, 33vw"
                  }
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />

                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <div className="backdrop-blur-md bg-black/40 rounded-lg px-3 py-2">
                      <p className="text-white text-xs md:text-sm font-medium">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {photos[lightboxIndex].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/50 px-6 py-3 rounded-xl border border-white/10">
              <p className="text-white text-sm md:text-base text-center">
                {photos[lightboxIndex].caption}
              </p>
            </div>
          )}

          <div className="absolute top-5 left-5 backdrop-blur-md bg-white/10 px-3 py-1.5 rounded-full">
            <p className="text-white text-xs font-medium tracking-wide">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
