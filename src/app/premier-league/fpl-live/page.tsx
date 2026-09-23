"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Trophy,
  Shirt,
  Crown,
  FlaskConical,
  BarChart3,
  ShieldAlert,
  ArrowLeftRight,
  Scale,
  CalendarCheck2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  ChevronDown,
  Lightbulb,
  AlertCircle,
  X,
} from "lucide-react";

import ControlsBar from "@/components/fpl/ControlsBar";
import LiveOverview from "@/components/fpl/live/LiveOverview";
import LeaguesTab from "@/components/fpl/live/LeaguesTab";
import SquadTable from "@/components/fpl/SquadTable";
import MatchResults from "@/components/fpl/MatchResults";
import TransfersMarket from "@/components/fpl/TransfersMarket";
import CaptainsAnalysis from "@/components/fpl/CaptainsAnalysis";
import WhatIfSimulator from "@/components/fpl/WhatIfSimulator";
import PLAnthemPlayer from "@/components/fpl/PLAnthemPlayer";
import RankGains from "@/components/fpl/RankGains";
import ThreatsAnalysis from "@/components/fpl/ThreatsAnalysis";
import Comparisons from "@/components/fpl/Comparisons";
import FlagLoader from "@/components/shared/FlagLoader";
import { registerFplTeams } from "@/lib/team-colors";
import { getCountryFlagCode } from "@/utils/countryMapping";
import { PlayerJersey, LiveDot, SkeletonRows, cx, dateLocale } from "@/components/fpl/live/ui";
import type { FPLGameweekStatus } from "@/types/fpl";

interface FPLData {
  manager?: any;
  team_with_stats?: any[];
  team_totals?: any;
  fixtures?: any[];
  predicted_bonuses?: any[];
  bonus_added?: boolean;
  entry_history?: any;
  automatic_subs?: any[];
  active_chip?: string | null;
  captain?: any;
  vice_captain?: any;
  timestamp?: string;
}

interface GwEvent {
  id: number;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  data_checked: boolean;
}

type TabType =
  | "overview"
  | "leagues"
  | "squad"
  | "captains"
  | "whatIf"
  | "gains"
  | "threats"
  | "transfers"
  | "comparisons"
  | "live";

const TAB_IDS: TabType[] = [
  "overview",
  "leagues",
  "squad",
  "captains",
  "whatIf",
  "gains",
  "threats",
  "transfers",
  "comparisons",
  "live",
];

// Team data refresh cadence while a gameweek is being played
const LIVE_REFRESH_MS = 60_000;

export default function FPLLivePage() {
  const { t, i18n } = useTranslation("fpl");

  // Core state
  const [managerId, setManagerId] = useState<number | null>(null);
  const [gameweek, setGameweek] = useState(1);
  const [latestGw, setLatestGw] = useState<number | null>(null);
  const [events, setEvents] = useState<GwEvent[]>([]);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [teamDataLoading, setTeamDataLoading] = useState(false);
  const [data, setData] = useState<FPLData>({});
  const [gameweekStatus, setGameweekStatus] =
    useState<FPLGameweekStatus | null>(null);
  const [gameweekStatusLoading, setGameweekStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Master live tracking state
  const [isLiveTracking, setIsLiveTracking] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [teamLoaded, setTeamLoaded] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<TabType, HTMLButtonElement | null>>>({});

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: t("fplLive.tabs.overview"), icon: LayoutDashboard },
    { id: "leagues", label: t("fplLive.tabs.leagues"), icon: Trophy },
    { id: "squad", label: t("fplLive.tabs.squad"), icon: Shirt },
    { id: "captains", label: t("fplLive.tabs.captains", "Captains"), icon: Crown },
    { id: "whatIf", label: t("fplLive.tabs.whatIf", "What-If"), icon: FlaskConical },
    { id: "gains", label: t("fplLive.tabs.gains", "Gains"), icon: BarChart3 },
    { id: "threats", label: t("fplLive.tabs.threats", "Threats"), icon: ShieldAlert },
    { id: "transfers", label: t("fplLive.tabs.transfers"), icon: ArrowLeftRight },
    { id: "comparisons", label: t("fplLive.tabs.comparisons", "Compare"), icon: Scale },
    { id: "live", label: t("fplLive.tabs.matchResults"), icon: CalendarCheck2 },
  ];

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  };

  const loadFullTeamData = useCallback(
    async (useManagerId?: number, useGameweek?: number) => {
      const actualManagerId = useManagerId || managerId;
      const actualGameweek = useGameweek || gameweek;

      if (!actualManagerId) return;

      try {
        const teamResponse = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: actualManagerId,
            gameweek: actualGameweek,
          }),
        });

        if (teamResponse.ok) {
          const teamResult = await teamResponse.json();
          if (teamResult.success) {
            setData(teamResult.data);
            setLastUpdated(new Date().toISOString());
          }
        } else {
          console.error(
            "❌ [FRONTEND] API request failed:",
            teamResponse.status,
            teamResponse.statusText
          );
        }
      } catch (err) {
        console.error("💥 [FRONTEND] Failed to load full team data:", err);
      } finally {
        setTeamDataLoading(false);
      }
    },
    [managerId, gameweek]
  );

  const loadGameweekStatus = useCallback(
    async (useManagerId?: number, useGameweek?: number) => {
      const actualManagerId = useManagerId || managerId;
      const actualGameweek = useGameweek || gameweek;
      if (!actualManagerId) return;

      setGameweekStatusLoading(true);
      try {
        const response = await fetch(
          `/api/fpl/gameweek-status?managerId=${actualManagerId}&gameweek=${actualGameweek}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) setGameweekStatus(result.data);
        } else {
          console.error(
            "❌ [FRONTEND] Gameweek Status API request failed:",
            response.status,
            response.statusText
          );
        }
      } catch (err) {
        console.error("💥 [FRONTEND] Failed to load gameweek status:", err);
      } finally {
        setGameweekStatusLoading(false);
      }
    },
    [managerId, gameweek]
  );

  const loadManagerInfo = useCallback(
    async (inputManagerId?: number, inputGameweek?: number) => {
      const useManagerId = inputManagerId || managerId;
      const useGameweek = inputGameweek || gameweek;

      if (!useManagerId) {
        showError(t("pleaseEnterManagerId"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        localStorage.setItem("fpl-manager-id", useManagerId.toString());
        localStorage.setItem("fpl-gameweek", useGameweek.toString());

        // Skeleton first so the header renders fast
        const skeletonResponse = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: useManagerId,
            gameweek: useGameweek,
            skeleton: true,
          }),
        });

        if (!skeletonResponse.ok) {
          throw Object.assign(
            new Error(`Failed to fetch manager info: ${skeletonResponse.status}`),
            { status: skeletonResponse.status }
          );
        }

        const result = await skeletonResponse.json();
        if (!result.success) {
          throw Object.assign(new Error(result.error || "Manager not found"), {
            status: 404,
          });
        }

        setData(result.data);
        setLastUpdated(new Date().toISOString());
        setManagerId(useManagerId);
        setGameweek(useGameweek);
        setTeamLoaded(true);
        setLoading(false);
        setIsLiveTracking(true);

        // Heavy data in the background
        setTeamDataLoading(true);
        loadFullTeamData(useManagerId, useGameweek);

        loadGameweekStatus(useManagerId, useGameweek);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("💥 [FRONTEND] Error loading manager:", {
          error: err,
          message,
          managerId: useManagerId,
          gameweek: useGameweek,
        });
        // API messages are English-only; show a translated explanation instead
        const status = (err as { status?: number })?.status;
        showError(
          status === 404
            ? t("fplLive.ui.shell.errorNotFound", {
                gw: useGameweek,
                defaultValue: "We couldn't find this team for GW{{gw}}. Check the Manager ID and try again.",
              })
            : t(
                "fplLive.ui.shell.errorLoad",
                "Couldn't load the team right now. Please try again in a moment."
              )
        );
        setLoading(false);
      }
    },
     
    [managerId, gameweek, loadFullTeamData, loadGameweekStatus, t]
  );

  // Boot: resolve the live gameweek, register this season's clubs for the
  // shirts, and open the saved manager straight away.
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      let savedId: number | null = null;
      let savedGw: number | null = null;
      try {
        const id = parseInt(localStorage.getItem("fpl-manager-id") || "", 10);
        if (!isNaN(id) && id > 0) savedId = id;
        const gw = parseInt(localStorage.getItem("fpl-gameweek") || "", 10);
        if (!isNaN(gw) && gw >= 1 && gw <= 38) savedGw = gw;
      } catch {
        // storage blocked — start fresh
      }
      if (savedId) setManagerId(savedId);

      let resolvedGw: number | null = null;
      try {
        const res = await fetch("/api/fpl/bootstrap-static");
        if (res.ok) {
          const json = await res.json();
          registerFplTeams(json?.data?.teams);
          const evs: any[] = Array.isArray(json?.data?.events) ? json.data.events : [];
          if (evs.length) {
            if (!cancelled) {
              setEvents(
                evs.map((e) => ({
                  id: e.id,
                  finished: !!e.finished,
                  is_current: !!e.is_current,
                  is_next: !!e.is_next,
                  data_checked: !!e.data_checked,
                }))
              );
            }
            const resolved =
              evs.find((e) => e?.is_current) ||
              [...evs].reverse().find((e) => e?.finished) ||
              evs.find((e) => e?.is_next) ||
              evs[0];
            resolvedGw = resolved?.id ?? null;
          }
        }
      } catch (err) {
        console.warn("Failed to auto-detect current gameweek:", err);
      }

      if (cancelled) return;
      const gw = resolvedGw ?? savedGw ?? 1;
      setGameweek(gw);
      setLatestGw(resolvedGw);

      // Restore the last open tab
      const hashTab = window.location.hash.replace("#", "") as TabType;
      if (TAB_IDS.includes(hashTab)) setActiveTab(hashTab);

      if (savedId) {
        await loadManagerInfo(savedId, gw);
      }
      if (!cancelled) setBooting(false);
    };

    boot();
    return () => {
      cancelled = true;
    };
    // Boot runs once; loadManagerInfo gets explicit arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gwEvent = events.find((e) => e.id === gameweek);
  const gwIsLive = !!gwEvent && gwEvent.is_current && !gwEvent.finished;
  const maxGw = latestGw ?? 38;

  // Keep points fresh while matches are being played
  useEffect(() => {
    if (!teamLoaded || !managerId || !isLiveTracking || !gwIsLive) return;
    const id = setInterval(() => {
      loadFullTeamData(managerId, gameweek);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, [teamLoaded, managerId, isLiveTracking, gwIsLive, gameweek, loadFullTeamData]);

  const toggleLiveTracking = useCallback(() => {
    if (!isLiveTracking && !managerId) {
      showError(t("pleaseEnterManagerId"));
      return;
    }
    setIsLiveTracking((prev) => !prev);
     
  }, [isLiveTracking, managerId, t]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    try {
      window.history.replaceState(null, "", `#${newTab}`);
    } catch {
      // ignore
    }
    // Bring the new tab's content to the top when switching from far down
    const bar = tabBarRef.current;
    if (bar) {
      const top = bar.getBoundingClientRect().top + window.scrollY;
      const offset = window.innerWidth >= 768 ? 64 : 0;
      if (window.scrollY > top - offset) {
        window.scrollTo({ top: top - offset, behavior: "smooth" });
      }
    }
  };

  // Keep the active tab pill visible in the horizontal scroller
  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [activeTab, teamLoaded]);

  const changeGameweek = (next: number) => {
    if (!managerId || next < 1 || next > maxGw || next === gameweek || loading) return;
    loadManagerInfo(managerId, next);
  };

  const resetManager = () => {
    setTeamLoaded(false);
    setData({});
    setGameweekStatus(null);
  };

  const renderTabContent = () => {
    if (!teamLoaded || !data.manager) return null;

    switch (activeTab) {
      case "overview":
        return (
          <LiveOverview
            manager={data.manager}
            teamTotals={data.team_totals}
            teamWithStats={data.team_with_stats}
            entryHistory={data.entry_history}
            activeChip={data.active_chip}
            bonusAdded={data.bonus_added || false}
            gameweek={gameweek}
            managerId={managerId || undefined}
            lastUpdated={lastUpdated || undefined}
            loading={loading || teamDataLoading}
            gameweekStatus={gameweekStatus}
            gameweekStatusLoading={gameweekStatusLoading}
          />
        );
      case "squad":
        return teamDataLoading ? (
          <div className="rounded-2xl border border-theme-border bg-theme-card">
            <SkeletonRows rows={8} />
          </div>
        ) : (
          <SquadTable
            teamData={data.team_with_stats || []}
            predictedBonuses={data.predicted_bonuses || []}
            bonusAdded={data.bonus_added || false}
            fixtures={data.fixtures}
            teamTotals={data.team_totals}
            activeChip={data.active_chip}
            entryHistory={data.entry_history}
            gameweek={gameweek}
          />
        );
      case "leagues":
        return (
          <LeaguesTab
            managerId={managerId || undefined}
            gameweek={gameweek}
            isLiveTracking={isLiveTracking}
            onToggleLive={toggleLiveTracking}
            onRefresh={() => loadManagerInfo()}
          />
        );
      case "captains":
        return (
          <CaptainsAnalysis
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "live":
        return <MatchResults gameweek={gameweek} isPolling={isLiveTracking} />;
      case "whatIf":
        return (
          <WhatIfSimulator
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "gains":
        return (
          <RankGains
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "threats":
        return (
          <ThreatsAnalysis
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "transfers":
        return (
          <TransfersMarket
            squadPlayerIds={(data.team_with_stats || []).map((p: any) => p.player_id)}
          />
        );
      case "comparisons":
        return (
          <Comparisons
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      default:
        return null;
    }
  };

  const manager = data.manager;
  const flagSource =
    manager?.player_region_iso_code_short || manager?.player_region_name;
  const flagCode = flagSource ? getCountryFlagCode(flagSource) : null;
  const updatedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(dateLocale(i18n.language), { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-theme-background theme-transition">
      <PLAnthemPlayer />
      <FlagLoader />
      <div className="mx-auto max-w-6xl px-3 pb-10 pt-4 sm:px-6 sm:pt-6">
        {/* Error toast */}
        {error && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 leading-snug">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label={t("fplLive.ui.shell.close", "Close")}
              className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Opening the saved team */}
        {booting && !teamLoaded && (
          <div className="space-y-3">
            <div className="h-[92px] animate-pulse rounded-2xl border border-theme-border bg-theme-card" />
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-theme-card-secondary" />
              ))}
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-card">
              <SkeletonRows rows={6} />
            </div>
          </div>
        )}

        {/* Setup */}
        {!booting && !teamLoaded && (
          <div className="mx-auto max-w-xl pt-2 sm:pt-6">
            <div className="mb-6 text-center">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-card px-3 py-1 text-[11px] font-medium text-theme-text-muted">
                <LiveDot />
                FPL Live · GW{gameweek}
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-theme-heading-primary sm:text-3xl">
                {t("title")}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-theme-text-muted">
                {t("subtitle")}
              </p>
            </div>

            <ControlsBar
              managerId={managerId}
              gameweek={gameweek}
              isPolling={false}
              onManagerIdChange={setManagerId}
              onGameweekChange={setGameweek}
              onLoadTeam={(inputManagerId, inputGameweek) =>
                loadManagerInfo(inputManagerId, inputGameweek)
              }
              onStartPolling={() => {}}
              onStopPolling={() => {}}
              loading={loading}
            />

            {/* How to find the manager ID */}
            <details className="group mt-3 overflow-hidden rounded-2xl border border-theme-border bg-theme-card">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme-card-secondary text-theme-text-secondary">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-theme-heading-primary">
                    {t("howToUse")}
                  </span>
                  <span className="block text-xs text-theme-text-muted">
                    {t("fplLive.howToFindManagerIdShort", "Brzo objašnjenje kako pronaći svoj Manager ID")}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-theme-text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-theme-border px-4 pb-4 pt-3">
                <ol className="space-y-2.5 text-sm">
                  {[
                    t("fplLive.openWebBrowser"),
                    <>
                      {t("fplLive.goToFPLWebsite")}{" "}
                      <strong className="break-all font-medium text-theme-heading-primary">
                        fantasy.premierleague.com
                      </strong>
                    </>,
                    t("fplLive.loginToAccount"),
                    t("fplLive.clickPointsTab"),
                    t("fplLive.copyNumbersFromURL"),
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-theme-card-secondary text-[10px] font-semibold tabular-nums text-theme-text-secondary">
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed text-theme-text-secondary">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-xl bg-theme-card-secondary px-3 py-2.5 font-mono text-xs text-theme-text-secondary break-all">
                  fantasy.premierleague.com/entry/
                  <span className="font-semibold text-violet-500">133444</span>/event/1
                </div>
                <p className="mt-2 text-xs text-theme-text-muted">
                  {t("fplLive.yourManagerIdIs2")}{" "}
                  <span className="font-semibold text-theme-heading-primary">133444</span>
                </p>
              </div>
            </details>
          </div>
        )}

        {/* Dashboard */}
        {teamLoaded && manager && (
          <>
            {/* Manager header */}
            <header className="rounded-2xl border border-theme-border bg-theme-card px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme-card-secondary sm:h-12 sm:w-12">
                  {manager.favourite_team ? (
                    <PlayerJersey team={manager.favourite_team} size="md" />
                  ) : (
                    <Shirt className="h-5 w-5 text-theme-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-theme-heading-primary sm:text-lg">
                    {manager.name}
                  </h1>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-theme-text-muted">
                    {flagCode && (
                      <span className={`fi fi-${flagCode} shrink-0 rounded-[2px]`} title={manager.player_region_name} />
                    )}
                    <span className="truncate">
                      {manager.player_first_name} {manager.player_last_name}
                    </span>
                    <span className="hidden shrink-0 tabular-nums sm:inline">· ID {managerId}</span>
                  </p>
                </div>

                {/* Gameweek switcher */}
                <div className="flex shrink-0 items-center rounded-xl border border-theme-border bg-theme-card-secondary p-0.5">
                  <button
                    type="button"
                    onClick={() => changeGameweek(gameweek - 1)}
                    disabled={gameweek <= 1 || loading}
                    aria-label={t("fplLive.ui.shell.prevGw", "Previous gameweek")}
                    className="flex h-8 w-7 items-center justify-center rounded-lg text-theme-text-secondary transition-colors hover:bg-theme-card disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3.25rem] text-center text-sm font-semibold tabular-nums text-theme-heading-primary">
                    GW{gameweek}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeGameweek(gameweek + 1)}
                    disabled={gameweek >= maxGw || loading}
                    aria-label={t("fplLive.ui.shell.nextGw", "Next gameweek")}
                    className="flex h-8 w-7 items-center justify-center rounded-lg text-theme-text-secondary transition-colors hover:bg-theme-card disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-theme-border pt-3 text-[11px] text-theme-text-muted">
                {gwIsLive ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <LiveDot />
                    {t("fplLive.ui.shell.live", "Live")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-theme-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-theme-text-muted" />
                    {gwEvent?.finished
                      ? t("fplLive.ui.shell.finished", "Finished")
                      : t("fplLive.ui.shell.upcoming", "Upcoming")}
                  </span>
                )}
                {updatedTime && (
                  <span className="truncate">
                    · {t("fplLive.ui.shell.updatedAt", "Updated {{time}}", { time: updatedTime })}
                  </span>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => loadManagerInfo()}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary disabled:opacity-50"
                  >
                    <RefreshCw className={cx("h-3.5 w-3.5", (loading || teamDataLoading) && "animate-spin")} />
                    <span className="hidden sm:inline">{t("refresh")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetManager}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    <span>{t("fplLive.ui.shell.changeManager", "Change")}</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div
              ref={tabBarRef}
              className="sticky top-0 z-30 -mx-3 mt-3 bg-theme-background px-3 py-2 sm:-mx-6 sm:px-6 md:top-16"
            >
              <nav
                className="-mx-1 overflow-x-auto px-1 scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)]"
                aria-label="FPL Live"
              >
                <div className="flex w-max gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        ref={(el) => {
                          tabButtonRefs.current[tab.id] = el;
                        }}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={cx(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-theme-foreground text-theme-background shadow-sm"
                            : "text-theme-text-muted hover:bg-theme-card-secondary hover:text-theme-text-secondary"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            <div className="mt-1 space-y-3 sm:space-y-4">{renderTabContent()}</div>
          </>
        )}
      </div>
    </div>
  );
}
