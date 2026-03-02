"use client";

import { useTheme } from "@/contexts/ThemeContext";
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
  loading?: boolean;
}

function SkeletonCard({ theme }: { theme: string }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: "0.75rem" }}
    >
      <div className="aspect-[3/4] sm:aspect-[3/4]">
        <div
          className={`absolute inset-0 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-100"
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

        {/* Faint bottom content area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <div
            className={`w-8 h-[1px] mb-3 rounded-full ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-200/80"
            }`}
          />
          <div
            className={`h-3.5 rounded-full mb-2 w-3/4 ${
              theme === "dark" ? "bg-gray-700/40" : "bg-gray-200/60"
            }`}
          />
          <div
            className={`h-2.5 rounded-full mb-3 w-1/2 ${
              theme === "dark" ? "bg-gray-700/30" : "bg-gray-200/40"
            }`}
          />
          <div
            className={`h-5 rounded-full w-16 ${
              theme === "dark" ? "bg-gray-700/30" : "bg-gray-200/40"
            }`}
          />
        </div>

        {/* Faint season badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <div
            className={`h-5 w-14 rounded-full ${
              theme === "dark" ? "bg-gray-700/30" : "bg-gray-200/50"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function ChampionCard({
  name,
  teamName,
  season,
  achievement,
  image,
  theme,
}: {
  name: string;
  teamName?: string;
  season: string;
  achievement?: string;
  image?: string;
  theme: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${
        theme === "dark"
          ? "shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-amber-900/20"
          : "shadow-md hover:shadow-xl hover:shadow-amber-200/40"
      }`}
      style={{ borderRadius: "0.75rem" }}
    >
      {/* Gold border frame */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          borderRadius: "0.75rem",
          border:
            theme === "dark"
              ? "1px solid rgba(212, 175, 55, 0.25)"
              : "1px solid rgba(180, 140, 20, 0.2)",
        }}
      />

      {/* Subtle corner accents */}
      <div
        className="absolute top-0 left-0 w-6 h-6 z-10 pointer-events-none"
        style={{
          borderTop: "2px solid rgba(212, 175, 55, 0.5)",
          borderLeft: "2px solid rgba(212, 175, 55, 0.5)",
          borderTopLeftRadius: "0.75rem",
        }}
      />
      <div
        className="absolute top-0 right-0 w-6 h-6 z-10 pointer-events-none"
        style={{
          borderTop: "2px solid rgba(212, 175, 55, 0.5)",
          borderRight: "2px solid rgba(212, 175, 55, 0.5)",
          borderTopRightRadius: "0.75rem",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-6 h-6 z-10 pointer-events-none"
        style={{
          borderBottom: "2px solid rgba(212, 175, 55, 0.5)",
          borderLeft: "2px solid rgba(212, 175, 55, 0.5)",
          borderBottomLeftRadius: "0.75rem",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-6 h-6 z-10 pointer-events-none"
        style={{
          borderBottom: "2px solid rgba(212, 175, 55, 0.5)",
          borderRight: "2px solid rgba(212, 175, 55, 0.5)",
          borderBottomRightRadius: "0.75rem",
        }}
      />

      <div className="relative aspect-[3/4] sm:aspect-[3/4] overflow-hidden">
        <Image
          src={image!}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Dark gradient overlay from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/5" />

        {/* Gold shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-yellow-400/0 to-amber-600/0 group-hover:from-amber-500/[0.04] group-hover:via-yellow-400/[0.02] group-hover:to-amber-600/[0.04] transition-all duration-700" />

        {/* Season badge */}
        <div
          className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide backdrop-blur-md"
          style={{
            backgroundColor: "rgba(30, 20, 8, 0.7)",
            color: "#d4af37",
            border: "1px solid rgba(212, 175, 55, 0.3)",
          }}
        >
          {season}
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transition-transform duration-500 group-hover:-translate-y-0.5">
          {/* Small gold line accent above name */}
          <div
            className="w-6 sm:w-8 h-[1px] mb-2 sm:mb-2.5 opacity-60"
            style={{
              background:
                "linear-gradient(90deg, #d4af37 0%, rgba(212,175,55,0.2) 100%)",
            }}
          />

          <h3 className="text-white text-sm sm:text-base lg:text-lg font-bold leading-tight mb-0.5 drop-shadow-sm">
            {name}
          </h3>

          {teamName && (
            <p className="text-amber-200/50 text-[11px] sm:text-xs lg:text-sm mb-1.5 sm:mb-2 truncate">
              {teamName}
            </p>
          )}

          {achievement && (
            <span
              className="inline-block text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md"
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                color: "#d4af37",
                border: "1px solid rgba(212, 175, 55, 0.25)",
              }}
            >
              {achievement}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChampionsWall({
  champions,
  title,
  subtitle,
  emptyMessage,
  loading,
}: ChampionsWallProps) {
  const { theme } = useTheme();

  return (
    <section className="mb-20 relative">
      {/* Background treatment - subtle gold warmth */}
      <div
        className="absolute -inset-x-4 sm:-inset-x-8 -inset-y-8 sm:-inset-y-12 -z-10 rounded-2xl sm:rounded-3xl"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(ellipse at 50% 0%, rgba(120, 80, 20, 0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        {/* Decorative gold line */}
        <div
          className="mx-auto w-10 sm:w-12 h-[1px] mb-4 sm:mb-5"
          style={{
            background:
              "linear-gradient(90deg, transparent, #d4af37, transparent)",
          }}
        />

        <h2
          className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1.5 sm:mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
        <p
          className={`text-xs sm:text-sm md:text-base ${
            theme === "dark" ? "text-amber-200/30" : "text-amber-800/40"
          }`}
        >
          {subtitle}
        </p>

        {/* Bottom decorative line */}
        <div
          className="mx-auto w-10 sm:w-12 h-[1px] mt-4 sm:mt-5"
          style={{
            background:
              "linear-gradient(90deg, transparent, #d4af37, transparent)",
          }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} theme={theme} />
          ))}
        </div>
      ) : champions.length === 0 ? (
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
                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-1.5A3.375 3.375 0 007.875 13.875v4.875m8.625 0H7.875M12 3.375a2.625 2.625 0 100 5.25 2.625 2.625 0 000-5.25z"
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {champions.map((item, i) => (
            <ChampionCard
              key={i}
              name={item.name}
              teamName={item.teamName}
              season={item.season}
              achievement={item.achievement}
              image={item.image}
              theme={theme}
            />
          ))}
        </div>
      )}
    </section>
  );
}
