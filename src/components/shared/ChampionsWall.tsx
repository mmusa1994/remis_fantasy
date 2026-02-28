"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Trophy } from "lucide-react";
import Image from "next/image";

export interface Champion {
  season: string;
  name: string;
  teamName?: string;
  image: string;
  achievement?: string;
}

interface ChampionsWallProps {
  champions: Champion[];
  accentColor: string;
  leagueName: string;
  title: string;
  subtitle: string;
  emptyMessage: string;
}

export default function ChampionsWall({
  champions,
  accentColor,
  title,
  subtitle,
  emptyMessage,
}: ChampionsWallProps) {
  const { theme } = useTheme();

  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy
            className="w-7 h-7"
            style={{ color: accentColor }}
          />
          <h2
            className={`text-2xl md:text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
          <Trophy
            className="w-7 h-7"
            style={{ color: accentColor }}
          />
        </div>
        <p
          className={`text-sm md:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {subtitle}
        </p>
      </div>

      {/* Champions Grid or Empty State */}
      {champions.length === 0 ? (
        <div
          className={`text-center p-12 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/40 border-gray-700"
              : "bg-white/60 border-gray-200"
          }`}
        >
          <Trophy
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {champions.map((champion, index) => (
            <div
              key={index}
              className={`group relative rounded-lg border-l-4 overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                theme === "dark"
                  ? "bg-gray-800/60 border border-gray-700 hover:bg-gray-800/80 hover:shadow-lg"
                  : "bg-white/80 border border-gray-200 hover:bg-white hover:shadow-md"
              }`}
              style={{ borderLeftColor: accentColor }}
            >
              {/* Champion Photo */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={champion.image}
                  alt={champion.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Season Badge */}
                <div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {champion.season}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className={`text-lg font-bold mb-1 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {champion.name}
                </h3>
                {champion.teamName && (
                  <p
                    className={`text-sm mb-1 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {champion.teamName}
                  </p>
                )}
                {champion.achievement && (
                  <p
                    className="text-sm font-semibold"
                    style={{ color: accentColor }}
                  >
                    {champion.achievement}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
