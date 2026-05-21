"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Users,
  Shield,
  Heart,
  Sparkles,
  ChevronDown,
  Check,
} from "lucide-react";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";
import LoadingCard from "@/components/shared/LoadingCard";

type Severity = "injured" | "doubtful" | "suspended";

interface InjuredPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  news: string;
  status: string;
  selected_by_percent: number;
  now_cost: number;
  severity: Severity;
}

interface TeamRecord {
  injured: InjuredPlayer[];
  doubtful: InjuredPlayer[];
  suspended: InjuredPlayer[];
  shortName: string;
  primary: string;
}

type FilterKey = "all" | Severity;

const POSITION_LABEL: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

const POSITION_ACCENT: Record<number, string> = {
  1: "from-amber-400 to-yellow-500",
  2: "from-sky-400 to-blue-500",
  3: "from-emerald-400 to-teal-500",
  4: "from-rose-400 to-red-500",
};

function severityFor(p: any): Severity | null {
  const chance = p.chance_of_playing_this_round;
  const next = p.chance_of_playing_next_round;
  if (p.status === "s") return "suspended";
  if (
    chance === 0 ||
    next === 0 ||
    p.status === "i" ||
    p.status === "u" ||
    p.status === "n"
  )
    return "injured";
  if (
    (chance !== null && chance < 100 && chance > 0) ||
    (next !== null && next < 100 && next > 0) ||
    p.status === "d"
  )
    return "doubtful";
  return null;
}

interface SeverityListProps {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  players: InjuredPlayer[];
}

function SeverityList({ title, Icon, color, players }: SeverityListProps) {
  const { t } = useTranslation("fpl");
  const [showAll, setShowAll] = useState(false);
  if (players.length === 0) return null;
  const visible = showAll ? players : players.slice(0, 4);
  const hidden = players.length - visible.length;
  return (
    <div>
      <h5 className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${color}`}>
        <Icon className="w-2.5 h-2.5" />
        {title} ({players.length})
      </h5>
      <div className="space-y-1">
        {visible.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
        {hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-[10px] font-semibold py-1 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("fplDashboard.teamNews.showMore", "+ Show {{count}} more", { count: hidden })}
          </button>
        )}
        {showAll && players.length > 4 && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-[10px] font-semibold py-1 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("fplDashboard.teamNews.collapse", "Collapse")}
          </button>
        )}
      </div>
    </div>
  );
}

interface TeamCardProps {
  teamId: number;
  rec: TeamRecord;
  injured: InjuredPlayer[];
  doubtful: InjuredPlayer[];
  suspended: InjuredPlayer[];
  total: number;
  defaultExpanded: boolean;
}

function TeamCard({ rec, injured, doubtful, suspended, total, defaultExpanded }: TeamCardProps) {
  const { t } = useTranslation("fpl");
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Keep in sync if global expand-all changes
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all self-start">
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${rec.primary}, ${rec.primary}88)` }}
      />
      {/* Header (clickable to toggle) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 border-b border-slate-200/60 dark:border-slate-700/40 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${rec.primary}22 0%, ${rec.primary}11 100%)` }}
        >
          <PiTShirtFill
            className="w-5 h-5"
            style={{
              color: rec.primary,
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
            } as React.CSSProperties}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
            {rec.shortName}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {total} {total === 1 ? t("fplDashboard.teamNews.player", "player") : t("fplDashboard.teamNews.players", "players")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {injured.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
              {injured.length}
            </span>
          )}
          {doubtful.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">
              {doubtful.length}
            </span>
          )}
          {suspended.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-violet-500 text-white text-[10px] font-bold">
              {suspended.length}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2.5 space-y-2.5">
              <SeverityList
                title={t("fplDashboard.teamNews.injured", "Injured")}
                Icon={Heart}
                color="text-rose-700 dark:text-rose-300"
                players={injured}
              />
              <SeverityList
                title={t("fplDashboard.teamNews.doubtful", "Doubtful")}
                Icon={AlertTriangle}
                color="text-amber-700 dark:text-amber-300"
                players={doubtful}
              />
              <SeverityList
                title={t("fplDashboard.teamNews.suspended", "Suspended")}
                Icon={Shield}
                color="text-violet-700 dark:text-violet-300"
                players={suspended}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerRow({ player }: { player: InjuredPlayer }) {
  const chance =
    player.chance_of_playing_this_round ??
    player.chance_of_playing_next_round ??
    (player.severity === "injured" || player.severity === "suspended" ? 0 : 50);

  const severityStyle: Record<Severity, { dot: string; text: string; bar: string; bg: string }> = {
    injured: {
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-300",
      bar: "bg-rose-500",
      bg: "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40",
    },
    doubtful: {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
      bg: "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40",
    },
    suspended: {
      dot: "bg-violet-500",
      text: "text-violet-700 dark:text-violet-300",
      bar: "bg-violet-500",
      bg: "bg-violet-50/60 dark:bg-violet-950/30 border-violet-200/60 dark:border-violet-800/40",
    },
  };

  const style = severityStyle[player.severity];
  const posAccent = POSITION_ACCENT[player.element_type] || "from-slate-400 to-slate-500";

  return (
    <div
      className={`group rounded-md p-2 border ${style.bg} transition-colors hover:shadow-sm`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-gradient-to-br ${posAccent} text-white`}
        >
          {POSITION_LABEL[player.element_type] || "?"}
        </span>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
          {player.web_name}
        </p>
        <span
          className={`text-[10px] font-bold tabular-nums shrink-0 ${style.text}`}
        >
          {chance}%
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
        />
      </div>
      {/* Play chance bar */}
      <div className="mt-1 h-1 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${chance}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full ${style.bar}`}
        />
      </div>
      {/* News snippet */}
      {player.news && (
        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
          {player.news}
        </p>
      )}
    </div>
  );
}

export default function TeamNews() {
  const { t } = useTranslation("fpl");
  const [loading, setLoading] = useState(false);
  const [teamNews, setTeamNews] = useState<Record<number, TeamRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [teamsMeta, setTeamsMeta] = useState<Array<{ id: number; short_name: string; name: string }>>([]);
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const [allCardsExpanded, setAllCardsExpanded] = useState(true);

  const fetchTeamNewsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/bootstrap-static");
      if (!response.ok) throw new Error("Failed to fetch FPL data");

      const data = await response.json();
      if (data.success && data.data) {
        const players = data.data.elements || [];
        const teams = data.data.teams || [];
        setTeamsMeta(teams.map((t: any) => ({ id: t.id, short_name: t.short_name, name: t.name })));
        const news = organizeTeamNews(players, teams);
        setTeamNews(news);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching team news:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamNewsData();
  }, [fetchTeamNewsData]);

  const organizeTeamNews = (players: any[], teams: any[]): Record<number, TeamRecord> => {
    const news: Record<number, TeamRecord> = {};
    teams.forEach((tm: any) => {
      const c = getTeamColors(tm.id);
      news[tm.id] = {
        injured: [],
        doubtful: [],
        suspended: [],
        shortName: tm.short_name || c.shortName,
        primary: c.primary,
      };
    });

    players.forEach((player: any) => {
      const severity = severityFor(player);
      if (!severity) return;
      // Only include players who have actually played this season (minutes > 0).
      // Skips long-term injured/never-played who would dominate the cards.
      const minutes = Number(player.minutes) || 0;
      if (minutes <= 0) return;
      if (!news[player.team]) {
        const c = getTeamColors(player.team);
        news[player.team] = {
          injured: [],
          doubtful: [],
          suspended: [],
          shortName: c.shortName,
          primary: c.primary,
        };
      }
      const playerData: InjuredPlayer = {
        id: player.id,
        web_name: player.web_name,
        team: player.team,
        element_type: player.element_type,
        chance_of_playing_this_round: player.chance_of_playing_this_round,
        chance_of_playing_next_round: player.chance_of_playing_next_round,
        news: player.news || "",
        status: player.status,
        selected_by_percent: parseFloat(player.selected_by_percent) || 0,
        now_cost: player.now_cost || 0,
        severity,
      };
      news[player.team][severity].push(playerData);
    });

    return news;
  };

  // Aggregate counts
  const totals = useMemo(() => {
    let injured = 0;
    let doubtful = 0;
    let suspended = 0;
    let teamsAffected = 0;
    Object.values(teamNews).forEach((rec) => {
      const total = rec.injured.length + rec.doubtful.length + rec.suspended.length;
      if (total > 0) teamsAffected++;
      injured += rec.injured.length;
      doubtful += rec.doubtful.length;
      suspended += rec.suspended.length;
    });
    return { injured, doubtful, suspended, teamsAffected };
  }, [teamNews]);

  // Top concerns: high-owned players who are injured/doubtful
  const topConcerns = useMemo(() => {
    const all: InjuredPlayer[] = [];
    Object.values(teamNews).forEach((rec) => {
      all.push(...rec.injured, ...rec.doubtful, ...rec.suspended);
    });
    return [...all]
      .sort((a, b) => b.selected_by_percent - a.selected_by_percent)
      .slice(0, 6);
  }, [teamNews]);

  // Filtered cards
  const filteredEntries = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return Object.entries(teamNews)
      .map(([teamId, rec]) => {
        const filterPlayers = (list: InjuredPlayer[]) =>
          list.filter((p) => !lower || p.web_name.toLowerCase().includes(lower));
        const injured = filter === "doubtful" || filter === "suspended" ? [] : filterPlayers(rec.injured);
        const doubtful = filter === "injured" || filter === "suspended" ? [] : filterPlayers(rec.doubtful);
        const suspended = filter === "injured" || filter === "doubtful" ? [] : filterPlayers(rec.suspended);
        return {
          teamId: Number(teamId),
          rec,
          injured,
          doubtful,
          suspended,
          total: injured.length + doubtful.length + suspended.length,
        };
      })
      .filter((entry) => {
        // Selected teams filter takes priority
        if (selectedTeams.size > 0 && !selectedTeams.has(entry.teamId)) return false;
        if (lower) {
          const tm = teamsMeta.find((t) => t.id === entry.teamId);
          const nameMatch =
            tm && (tm.short_name.toLowerCase().includes(lower) || tm.name.toLowerCase().includes(lower));
          if (nameMatch) return true;
        }
        // If team is explicitly selected, show it even if no current-filter players
        if (selectedTeams.has(entry.teamId)) return true;
        return entry.total > 0;
      })
      .sort((a, b) => b.total - a.total);
  }, [teamNews, filter, search, teamsMeta, selectedTeams]);

  // Alphabetically sorted teams for the dropdown
  const sortedTeams = useMemo(
    () => [...teamsMeta].sort((a, b) => a.name.localeCompare(b.name)),
    [teamsMeta]
  );

  // Counts per team
  const teamCounts = useMemo(() => {
    const m = new Map<number, number>();
    Object.entries(teamNews).forEach(([id, rec]) => {
      m.set(Number(id), rec.injured.length + rec.doubtful.length + rec.suspended.length);
    });
    return m;
  }, [teamNews]);

  if (loading) {
    return <LoadingCard title={t("diamond.loading")} />;
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <div>
            <h3 className="font-semibold text-rose-800 dark:text-rose-300">
              {t("common.error", "Error")}
            </h3>
            <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const FILTERS: Array<{ key: FilterKey; label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { key: "all", label: t("fplDashboard.smartReplace.all", "All"), Icon: Users, color: "indigo" },
    { key: "injured", label: t("fplDashboard.teamNews.injured", "Injured"), Icon: Heart, color: "rose" },
    { key: "doubtful", label: t("fplDashboard.teamNews.doubtful", "Doubtful"), Icon: AlertTriangle, color: "amber" },
    { key: "suspended", label: t("fplDashboard.teamNews.suspended", "Suspended"), Icon: Shield, color: "violet" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl p-5 sm:p-6 bg-gradient-to-br from-rose-500/90 via-purple-600/90 to-indigo-600/90 shadow-lg border border-purple-300/30">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-400 via-amber-400 to-violet-400" />
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/15 backdrop-blur-sm shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t("diamond.teamNews", "Team News")}
            </h2>
            <p className="text-white/80 text-sm mt-0.5">
              {t("diamond.subtitle", "Real-time injury and availability updates")}
            </p>
          </div>
          <button
            onClick={fetchTeamNewsData}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("fplDashboard.teamNews.refresh", "Refresh")}</span>
          </button>
        </div>

        {/* Stat tiles */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: t("fplDashboard.teamNews.injured", "Injured"), value: totals.injured, color: "from-rose-500 to-rose-600", Icon: Heart },
            { label: t("fplDashboard.teamNews.doubtful", "Doubtful"), value: totals.doubtful, color: "from-amber-500 to-orange-500", Icon: AlertTriangle },
            { label: t("fplDashboard.teamNews.suspended", "Suspended"), value: totals.suspended, color: "from-violet-500 to-purple-600", Icon: Shield },
            { label: t("fplDashboard.teamNews.teamsAffected", "Teams Affected"), value: totals.teamsAffected, color: "from-indigo-500 to-blue-600", Icon: Users },
          ].map((stat) => {
            const Icon = stat.Icon;
            return (
              <div key={stat.label} className="rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/15">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white tabular-nums leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/70 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top concerns banner */}
      {topConcerns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-amber-950/30 dark:via-slate-900 dark:to-rose-950/30 border border-amber-200/60 dark:border-amber-800/40"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500" />
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("fplDashboard.teamNews.topConcerns", "Top concerns (high-ownership)")}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {topConcerns.map((p) => {
              const colors = getTeamColors(p.team);
              const sev = p.severity;
              const badgeColor =
                sev === "injured"
                  ? "bg-rose-500"
                  : sev === "suspended"
                  ? "bg-violet-500"
                  : "bg-amber-500";
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 relative"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}1a 0%, ${colors.primary}0d 100%)` }}
                  >
                    <PiTShirtFill className="w-4 h-4" style={{ color: colors.primary } as React.CSSProperties} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${badgeColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {p.web_name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {p.selected_by_percent.toFixed(1)}% TSB
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Club picker dropdown */}
      <div className="relative" style={{ zIndex: 30 }}>
        <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          {t("fplDashboard.teamNews.filterByClub", "Filter by club")}
        </p>
        <button
          type="button"
          onClick={() => setClubDropdownOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
            clubDropdownOpen || selectedTeams.size > 0
              ? "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border-indigo-300 dark:border-indigo-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0 shadow-sm">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                {selectedTeams.size === 0
                  ? t("fplDashboard.teamNews.allClubs", "All clubs (20)")
                  : `${selectedTeams.size} ${selectedTeams.size === 1 ? t("fplDashboard.teamNews.selectedClub", "selected club") : t("fplDashboard.teamNews.selectedClubs", "selected clubs")}`}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t("fplDashboard.teamNews.clickToOpenClubList", "Click to open club list")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {selectedTeams.size > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTeams(new Set());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    setSelectedTeams(new Set());
                  }
                }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              >
                {t("fplDashboard.teamNews.clear", "Clear")}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
                clubDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Selected club chips - visible when collapsed */}
        {selectedTeams.size > 0 && !clubDropdownOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(selectedTeams).map((id) => {
              const tm = teamsMeta.find((t) => t.id === id);
              if (!tm) return null;
              const colors = getTeamColors(id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ background: `${colors.primary}22` }}
                  >
                    <PiTShirtFill className="w-3 h-3" style={{ color: colors.primary } as React.CSSProperties} />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{tm.short_name}</span>
                  <button
                    onClick={() => {
                      setSelectedTeams((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {clubDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute mt-1.5 w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
              style={{ zIndex: 50 }}
            >
              {/* Quick actions */}
              <div className="flex items-center gap-1.5 px-2 py-2 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40">
                <button
                  onClick={() => setSelectedTeams(new Set(teamsMeta.map((t) => t.id)))}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
                >
                  {t("fplDashboard.teamNews.selectAll", "Select All")}
                </button>
                <button
                  onClick={() => {
                    // Only teams that actually have news
                    setSelectedTeams(
                      new Set(
                        Array.from(teamCounts.entries())
                          .filter(([, c]) => c > 0)
                          .map(([id]) => id)
                      )
                    );
                  }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/60 dark:border-amber-800/40 transition-colors"
                >
                  {t("fplDashboard.teamNews.onlyWithInjuries", "Only with injuries")}
                </button>
                <button
                  onClick={() => setSelectedTeams(new Set())}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
                >
                  {t("fplDashboard.teamNews.clear", "Clear")}
                </button>
              </div>

              {/* Team grid */}
              <div className="max-h-72 overflow-y-auto p-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {sortedTeams.map((tm) => {
                    const colors = getTeamColors(tm.id);
                    const isSelected = selectedTeams.has(tm.id);
                    const count = teamCounts.get(tm.id) || 0;
                    return (
                      <button
                        key={tm.id}
                        onClick={() => {
                          setSelectedTeams((prev) => {
                            const next = new Set(prev);
                            if (next.has(tm.id)) next.delete(tm.id);
                            else next.add(tm.id);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all border ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700"
                            : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 relative"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}22 0%, ${colors.primary}11 100%)`,
                          }}
                        >
                          <PiTShirtFill
                            className="w-4 h-4"
                            style={{
                              color: colors.primary,
                              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                            } as React.CSSProperties}
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-500 text-white shadow-sm">
                              <Check className="w-2 h-2" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-none truncate">
                            {tm.short_name}
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {tm.name}
                          </p>
                        </div>
                        {count > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[9px] font-bold bg-rose-500 text-white">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const Icon = f.Icon;
            const isActive = filter === f.key;
            const count =
              f.key === "all"
                ? totals.injured + totals.doubtful + totals.suspended
                : totals[f.key as Severity];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${
                        f.color === "rose"
                          ? "from-rose-500 to-rose-600"
                          : f.color === "amber"
                          ? "from-amber-500 to-orange-500"
                          : f.color === "violet"
                          ? "from-violet-500 to-purple-600"
                          : "from-indigo-500 to-indigo-600"
                      } text-white border-transparent shadow-sm`
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                <Icon className="w-3 h-3" />
                {f.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("fplDashboard.teamNews.searchPlayerOrClub", "Search player or club...")}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 dark:focus:border-indigo-700 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Expand / Collapse all toolbar */}
      {filteredEntries.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-200">{filteredEntries.length}</span>{" "}
            {filteredEntries.length === 1 ? t("fplDashboard.teamNews.club", "club") : t("fplDashboard.teamNews.clubs", "clubs")}
          </p>
          <button
            onClick={() => setAllCardsExpanded((v) => !v)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex items-center gap-1.5"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${allCardsExpanded ? "rotate-180" : ""}`} />
            {allCardsExpanded ? t("fplDashboard.teamNews.collapseAll", "Collapse All") : t("fplDashboard.teamNews.expandAll", "Expand All")}
          </button>
        </div>
      )}

      {/* Team cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
        {filteredEntries.map(({ teamId, rec, injured, doubtful, suspended, total }) => (
          <TeamCard
            key={teamId}
            teamId={teamId}
            rec={rec}
            injured={injured}
            doubtful={doubtful}
            suspended={suspended}
            total={total}
            defaultExpanded={allCardsExpanded}
          />
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
          {t("fplDashboard.teamNews.noResults", "No results for selected filters.")}
        </div>
      )}

      {/* Footer */}
      {lastUpdated && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
          {t("fplDashboard.teamNews.updatedAt", "Updated at {{time}}", { time: lastUpdated.toLocaleTimeString() })}
        </p>
      )}
    </div>
  );
}
