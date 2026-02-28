"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function AwardsGallery({
  photos,
  accentColor,
  title,
  subtitle,
  emptyMessage,
}: AwardsGalleryProps) {
  const { theme } = useTheme();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  // Keyboard navigation
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
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Camera className="w-6 h-6" style={{ color: accentColor }} />
          <h2
            className={`text-2xl md:text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
        </div>
        <p
          className={`text-sm md:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {subtitle}
        </p>
      </div>

      {/* Gallery Grid or Empty State */}
      {photos.length === 0 ? (
        <div
          className={`text-center p-12 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/40 border-gray-700"
              : "bg-white/60 border-gray-200"
          }`}
        >
          <Camera
            className={`w-12 h-12 mx-auto mb-4 ${
              theme === "dark" ? "text-gray-600" : "text-gray-300"
            }`}
          />
          <p
            className={`text-lg ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={`group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                theme === "dark"
                  ? "border-gray-700"
                  : "border-gray-200"
              }`}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm font-medium">
                    {photo.caption}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
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

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Caption */}
          {photos[lightboxIndex].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-3 rounded-lg">
              <p className="text-white text-sm md:text-base text-center">
                {photos[lightboxIndex].caption}
              </p>
            </div>
          )}

          {/* Counter */}
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
            <p className="text-white text-sm">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
