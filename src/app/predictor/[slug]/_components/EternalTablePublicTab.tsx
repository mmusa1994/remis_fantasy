"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, Target } from "lucide-react";

type Column = {
  id: string;
  label: string;
  logo_url: string | null;
};

type Entry = {
  id: string;
  player_name: string;
  values: Record<string, number | null>;
  total: number;
};

type TableData = {
  columns: Column[];
  entries: Entry[];
};

type TableType = "points" | "exact";

export default function EternalTablePublicTab({
  slug,
  theme,
}: {
  slug: string;
  theme: "dark" | "light";
  ac: Record<string, string>;
}) {
  const [pointsData, setPointsData] = useState<TableData>({
    columns: [],
    entries: [],
  });
  const [exactData, setExactData] = useState<TableData>({
    columns: [],
    entries: [],
  });
  const [activeType, setActiveType] = useState<TableType>("points");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dark = theme === "dark";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [pointsRes, exactRes] = await Promise.all([
          fetch(
            `/api/predictor/tournaments/${slug}/eternal-table?type=points`
          ),
          fetch(
            `/api/predictor/tournaments/${slug}/eternal-table?type=exact`
          ),
        ]);
        if (cancelled) return;

        const pData = pointsRes.ok
          ? await pointsRes.json()
          : { columns: [], entries: [] };
        const eData = exactRes.ok
          ? await exactRes.json()
          : { columns: [], entries: [] };

        if (cancelled) return;
        setPointsData({
          columns: pData.columns || [],
          entries: pData.entries || [],
        });
        setExactData({
          columns: eData.columns || [],
          entries: eData.entries || [],
        });

        const hasPoints =
          (pData.columns?.length || 0) > 0 ||
          (pData.entries?.length || 0) > 0;
        const hasExact =
          (eData.columns?.length || 0) > 0 ||
          (eData.entries?.length || 0) > 0;
        if (!hasPoints && hasExact) setActiveType("exact");
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Greška");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${
          dark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        <Trophy className="w-5 h-5 mr-2 animate-pulse" />
        Učitavanje...
      </div>
    );
  }

  const hasPoints =
    pointsData.columns.length > 0 || pointsData.entries.length > 0;
  const hasExact =
    exactData.columns.length > 0 || exactData.entries.length > 0;

  if (error || (!hasPoints && !hasExact)) {
    return null;
  }

  const showTabs = hasPoints && hasExact;
  const data = activeType === "points" ? pointsData : exactData;
  const { columns, entries } = data;

  const isExact = activeType === "exact";
  const title = isExact
    ? "Vječna tabela tačnih pogodaka"
    : "Vječna tabela osvojenih poena";
  const subtitle = isExact
    ? "Historijski tačno pogođeni rezultati po takmičenjima"
    : "Historijski rezultati po takmičenjima";
  const accent = isExact ? "emerald" : "amber";

  const rankColor = (idx: number, isDark: boolean) => {
    if (idx === 0) return "text-amber-500";
    if (idx === 1) return isDark ? "text-slate-300" : "text-slate-500";
    if (idx === 2) return isDark ? "text-orange-300" : "text-orange-600";
    return isDark ? "text-gray-600" : "text-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      {showTabs && (
        <div
          className={`flex rounded-xl border overflow-hidden ${
            dark
              ? "border-white/10 bg-gray-950/90 backdrop-blur-xl shadow-lg shadow-black/30"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <button
            onClick={() => setActiveType("points")}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeType === "points"
                ? dark
                  ? "bg-amber-500/15 text-amber-300 border-b-2 border-amber-500"
                  : "bg-amber-50 text-amber-700 border-b-2 border-amber-500"
                : dark
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tabela poena
          </button>
          <button
            onClick={() => setActiveType("exact")}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeType === "exact"
                ? dark
                  ? "bg-emerald-500/15 text-emerald-300 border-b-2 border-emerald-500"
                  : "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                : dark
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Target className="w-4 h-4" />
            Tabela tačnih rezultata
          </button>
        </div>
      )}

      {/* Table card */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          dark
            ? "border-white/10 bg-gray-950/90 backdrop-blur-xl shadow-xl shadow-black/40"
            : "border-gray-200 bg-white shadow-sm"
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-7 py-4 sm:py-5 border-b flex items-center gap-3 sm:gap-4 ${
            dark ? "border-white/8" : "border-gray-200/80"
          }`}
        >
          <div
            className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl flex-shrink-0 ${
              isExact
                ? dark
                  ? "bg-emerald-500/12 ring-1 ring-emerald-500/20"
                  : "bg-emerald-50 ring-1 ring-emerald-200/70"
                : dark
                  ? "bg-amber-500/12 ring-1 ring-amber-500/20"
                  : "bg-amber-50 ring-1 ring-amber-200/70"
            }`}
          >
            {isExact ? (
              <Target
                className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500"
                strokeWidth={2.25}
              />
            ) : (
              <Trophy
                className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500"
                strokeWidth={2.25}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className={`text-sm sm:text-lg font-bold tracking-tight leading-tight ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h2>
            <p
              className={`text-[10px] sm:text-xs mt-0.5 ${
                dark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Mobile — stacked cards (hidden ≥ md) */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
          {entries.map((e, i) => {
            const isTop = i === 0;
            return (
              <div
                key={e.id}
                className={`relative px-4 py-4 ${
                  isTop
                    ? dark
                      ? isExact
                        ? "bg-emerald-500/[0.03]"
                        : "bg-amber-500/[0.03]"
                      : isExact
                        ? "bg-emerald-50/40"
                        : "bg-amber-50/40"
                    : ""
                }`}
              >
                {isTop && (
                  <span
                    aria-hidden
                    className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${
                      isExact ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                      i === 0
                        ? isExact
                          ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
                          : "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30"
                        : i === 1
                          ? dark
                            ? "bg-slate-500/15 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                          : i === 2
                            ? dark
                              ? "bg-orange-500/12 text-orange-300"
                              : "bg-orange-50 text-orange-700"
                            : dark
                              ? "bg-white/[0.04] text-gray-500"
                              : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`flex-1 font-bold tracking-tight ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {e.player_name}
                  </span>
                  <span
                    className={`inline-flex min-w-[44px] justify-center rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
                      isTop
                        ? isExact
                          ? dark
                            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                            : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : dark
                            ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                            : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                        : isExact
                          ? dark
                            ? "bg-white/[0.04] text-emerald-300/90"
                            : "bg-emerald-50/70 text-emerald-700"
                          : dark
                            ? "bg-white/[0.04] text-amber-300/90"
                            : "bg-amber-50/70 text-amber-700"
                    }`}
                  >
                    {e.total}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {columns.map((c) => {
                    const v = e.values?.[c.id];
                    const empty = v == null;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                          dark ? "bg-white/[0.025]" : "bg-gray-50/80"
                        } ${empty ? "opacity-50" : ""}`}
                      >
                        {c.logo_url ? (
                          <Image
                            src={c.logo_url}
                            alt={c.label}
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain flex-shrink-0"
                            unoptimized
                          />
                        ) : null}
                        <span
                          className={`flex-1 text-[10px] font-semibold uppercase tracking-wide truncate ${
                            dark ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {c.label}
                        </span>
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            empty
                              ? dark
                                ? "text-gray-700"
                                : "text-gray-400"
                              : dark
                                ? "text-gray-200"
                                : "text-gray-800"
                          }`}
                        >
                          {empty ? "—" : v}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop — full table (hidden < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                className={`border-b ${
                  dark
                    ? "border-white/8 bg-white/[0.015]"
                    : "border-gray-200/80 bg-gray-50/60"
                }`}
              >
                <th
                  className={`pl-5 pr-2 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.12em] w-14 ${
                    dark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  #
                </th>
                <th
                  className={`px-3 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    dark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Igrač
                </th>
                {columns.map((c) => (
                  <th
                    key={c.id}
                    className={`px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      dark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {c.logo_url ? (
                        <Image
                          src={c.logo_url}
                          alt={c.label}
                          width={32}
                          height={32}
                          className="h-7 w-7 lg:h-8 lg:w-8 object-contain"
                          unoptimized
                        />
                      ) : null}
                      <span className="whitespace-nowrap">{c.label}</span>
                    </div>
                  </th>
                ))}
                <th
                  className={`pl-3 pr-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] ${
                    isExact
                      ? dark
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : dark
                        ? "text-amber-400"
                        : "text-amber-600"
                  }`}
                >
                  Ukupno
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const isTop = i === 0;
                return (
                  <tr
                    key={e.id}
                    className={`group relative border-b last:border-b-0 transition-colors ${
                      dark ? "border-white/5" : "border-gray-100"
                    } ${
                      dark
                        ? "hover:bg-white/[0.018]"
                        : "hover:bg-gray-50/70"
                    }`}
                  >
                    <td className="relative pl-5 pr-2 py-4 w-14 text-center align-middle">
                      {isTop ? (
                        <span
                          aria-hidden
                          className={`absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full ${
                            isExact ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                      ) : null}
                      <span
                        className={`inline-block tabular-nums text-sm font-bold tracking-tight ${rankColor(
                          i,
                          dark
                        )}`}
                      >
                        {i + 1}
                      </span>
                    </td>

                    <td
                      className={`px-3 py-4 align-middle font-semibold tracking-tight ${
                        dark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {e.player_name}
                    </td>

                    {columns.map((c) => {
                      const v = e.values?.[c.id];
                      return (
                        <td
                          key={c.id}
                          className={`px-3 py-4 text-center align-middle tabular-nums ${
                            v == null
                              ? dark
                                ? "text-gray-700"
                                : "text-gray-300"
                              : dark
                                ? "text-gray-300"
                                : "text-gray-700"
                          }`}
                        >
                          {v == null ? "—" : v}
                        </td>
                      );
                    })}

                    <td className="pl-3 pr-5 py-4 text-center align-middle">
                      <span
                        className={`inline-flex min-w-[42px] justify-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                          isTop
                            ? isExact
                              ? dark
                                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                                : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                              : dark
                                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                                : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                            : isExact
                              ? dark
                                ? "text-emerald-300/90"
                                : "text-emerald-700"
                              : dark
                                ? "text-amber-300/90"
                                : "text-amber-700"
                        }`}
                      >
                        {e.total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
