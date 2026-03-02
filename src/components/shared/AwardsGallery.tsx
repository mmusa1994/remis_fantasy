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
  loading?: boolean;
}

function SkeletonTile({
  theme,
  large,
}: {
  theme: string;
  large?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${
        large ? "col-span-2 row-span-2 rounded-2xl" : "rounded-xl"
      } ${
        theme === "dark"
          ? "bg-gray-800/60"
          : "bg-gray-100"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 animate-[shimmer_2s_infinite]"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

export default function AwardsGallery({
  photos,
  accentColor,
  title,
  subtitle,
  emptyMessage,
  loading,
}: AwardsGalleryProps) {
  const { theme } = useTheme();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    if (photos.length > 0) setLightboxIndex(index);
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-dense auto-rows-[160px] sm:auto-rows-[180px] md:auto-rows-[240px] gap-2 md:gap-3">
          <SkeletonTile theme={theme} large />
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonTile key={i} theme={theme} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="py-16 sm:py-20 text-center">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
              theme === "dark" ? "bg-gray-800/60" : "bg-gray-100"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-gray-600" : "text-gray-300"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-dense auto-rows-[160px] sm:auto-rows-[180px] md:auto-rows-[240px] gap-2 md:gap-3">
          {photos.map((photo, i) => (
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
      )}

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
