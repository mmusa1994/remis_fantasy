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
}

const PLACEHOLDER_CHAMPIONS = [
  {
    season: "2024/25",
    name: "Marko Horvat",
    teamName: "FC Fantasy Kings",
    achievement: "1st Place",
    gradient: "from-amber-950 via-yellow-900/80 to-stone-900",
  },
  {
    season: "2023/24",
    name: "Ivan Perić",
    teamName: "Dream Team XI",
    achievement: "Champion",
    gradient: "from-stone-900 via-amber-950/70 to-zinc-900",
  },
  {
    season: "2022/23",
    name: "Luka Mandić",
    teamName: "Goal Machine FC",
    achievement: "Winner",
    gradient: "from-yellow-950 via-stone-800 to-amber-950",
  },
  {
    season: "2021/22",
    name: "Ante Babić",
    teamName: "Elite Squad",
    achievement: "1st Place",
    gradient: "from-zinc-900 via-amber-950/60 to-stone-900",
  },
  {
    season: "2020/21",
    name: "Mateo Jurić",
    teamName: "Victory Lane",
    achievement: "Champion",
    gradient: "from-amber-950/80 via-stone-900 to-yellow-950",
  },
  {
    season: "2019/20",
    name: "Filip Kovač",
    teamName: "Crown FC",
    achievement: "Winner",
    gradient: "from-stone-900 via-yellow-950/60 to-zinc-900",
  },
];

function ChampionCard({
  name,
  teamName,
  season,
  achievement,
  image,
  placeholder,
  theme,
}: {
  name: string;
  teamName?: string;
  season: string;
  achievement?: string;
  image?: string;
  placeholder?: { gradient: string };
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
        {/* Image or placeholder gradient */}
        {placeholder ? (
          <>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${placeholder.gradient}`}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/[0.03] to-transparent" />
          </>
        ) : (
          <Image
            src={image!}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

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
}: ChampionsWallProps) {
  const { theme } = useTheme();
  const showPlaceholders = champions.length === 0;

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

      {/* Cards grid - 2 cols on mobile, 3 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {showPlaceholders
          ? PLACEHOLDER_CHAMPIONS.map((item, i) => (
              <ChampionCard
                key={i}
                name={item.name}
                teamName={item.teamName}
                season={item.season}
                achievement={item.achievement}
                placeholder={{ gradient: item.gradient }}
                theme={theme}
              />
            ))
          : champions.map((item, i) => (
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
    </section>
  );
}
