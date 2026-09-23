"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import {
  Chip,
  cx,
  EmptyState,
  LiveDot,
  PlayerCell,
  PlayerJersey,
  POSITION_SHORT,
  SkeletonRows, dateLocale } from "@/components/fpl/live/ui";
import {
  AnalyticsToolbar,
  Footnote,
  InlineError,
  ShowMoreButton,
} from "@/components/fpl/live/AnalyticsParts";

interface BpsPlayer {
  element: number;
  web_name: string;
  team: number;
  position: number;
  minutes: number;
  bps: number;
  predicted_bonus: number;
  current_bonus: number;
}

interface BpsFixture {
  fixture_id: number;
  kickoff_time: string;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  minutes: number;
  team_h: string;
  team_a: string;
  team_h_id: number;
  team_a_id: number;
  team_h_score: number | null;
  team_a_score: number | null;
  bps_leaderboard: BpsPlayer[];
}

const COLLAPSED_ROWS = 5;
const EXPANDED_ROWS = 15;

const isDone = (f: BpsFixture) => f.finished || f.finished_provisional;
const isLive = (f: BpsFixture) => f.started && !isDone(f);

export default function BpsLivePanel() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [fixtures, setFixtures] = useState<BpsFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const detectGameweek = useCallback(async () => {
    try {
      const res = await fetch("/api/fpl/bootstrap-static");
      const data = await res.json();
      if (data?.success && data.data?.events) {
        const events = data.data.events as Array<{
          id: number;
          is_current: boolean;
          is_next: boolean;
        }>;
        const current = events.find((e) => e.is_current) || events.find((e) => e.is_next);
        if (current) {
          setGameweek(current.id);
          return current.id;
        }
      }
    } catch {
      // fallthrough
    }
    return null;
  }, []);

  const fetchLeaderboard = useCallback(async (gw: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fpl/bps-leaderboard?gw=${gw}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setFixtures(json.data.fixtures || []);
      setLastUpdated(json.data.last_updated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const detected = await detectGameweek();
      if (detected) await fetchLeaderboard(detected);
      else setLoading(false);
    })();
  }, [detectGameweek, fetchLeaderboard]);

  // Live matches first, then finished (latest first), then upcoming.
  const ordered = useMemo(() => {
    const byKickoff = (a: BpsFixture, b: BpsFixture) =>
      new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime();
    const live = fixtures.filter(isLive).sort(byKickoff);
    const done = fixtures.filter(isDone).sort((a, b) => byKickoff(b, a));
    const upcoming = fixtures.filter((f) => !f.started && !isDone(f)).sort(byKickoff);
    return [...live, ...done, ...upcoming];
  }, [fixtures]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <AnalyticsToolbar
        gameweek={gameweek}
        updatedAt={lastUpdated}
        loading={loading}
        onRefresh={gameweek ? () => fetchLeaderboard(gameweek) : undefined}
      />

      {error && <InlineError message={t("fplLive.ui.leagues.loadError", "Couldn't load data. Try refreshing.")} />}

      {loading && fixtures.length === 0 && <SkeletonRows rows={5} className="border-t border-theme-border" />}

      {!loading && fixtures.length === 0 && !error && (
        <EmptyState
          className="border-t border-theme-border"
          icon={<Zap />}
          title={t("bps.noFixtures", "No fixtures available for this gameweek yet.")}
        />
      )}

      {ordered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 border-t border-theme-border p-3 sm:p-4 lg:grid-cols-2">
          {ordered.map((fixture) => (
            <FixtureCard
              key={fixture.fixture_id}
              fixture={fixture}
              expanded={expanded.has(fixture.fixture_id)}
              onToggle={() => toggle(fixture.fixture_id)}
            />
          ))}
        </div>
      )}

      <Footnote>
        <span className="inline-flex items-center gap-1.5">
          <BonusBadge predicted={3} confirmed={0} />
          {t("fplLive.ui.leagues.bonusPredictedLegend", "provisional bonus")}
        </span>
        <span className="mx-2" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BonusBadge predicted={0} confirmed={3} />
          {t("fplLive.ui.leagues.bonusConfirmedLegend", "confirmed bonus")}
        </span>
      </Footnote>
    </div>
  );
}

function FixtureCard({
  fixture,
  expanded,
  onToggle,
}: {
  fixture: BpsFixture;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t, i18n } = useTranslation("fpl");
  const live = isLive(fixture);
  const done = isDone(fixture);
  const hasScore = fixture.team_h_score !== null && fixture.team_a_score !== null;
  const rows = fixture.started ? fixture.bps_leaderboard : [];
  const visible = rows.slice(0, expanded ? EXPANDED_ROWS : COLLAPSED_ROWS);
  const hidden = Math.min(rows.length, EXPANDED_ROWS) - COLLAPSED_ROWS;

  const shortFor = (teamId: number) =>
    teamId === fixture.team_h_id ? fixture.team_h : teamId === fixture.team_a_id ? fixture.team_a : teamId;

  const kickoff = new Date(fixture.kickoff_time);

  return (
    <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <PlayerJersey team={fixture.team_h} size="sm" />
          <span className="truncate text-sm font-semibold text-theme-heading-primary">{fixture.team_h}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-semibold leading-none tabular-nums text-theme-heading-primary">
            {hasScore
              ? `${fixture.team_h_score} – ${fixture.team_a_score}`
              : kickoff.toLocaleTimeString(dateLocale(i18n.language), { hour: "2-digit", minute: "2-digit" })}
          </span>
          {live ? (
            <Chip tone="positive">
              <LiveDot />
              {fixture.minutes}&apos;
            </Chip>
          ) : done ? (
            <Chip>{t("fplLive.ui.leagues.fullTime", "FT")}</Chip>
          ) : (
            <Chip>
              {kickoff.toLocaleDateString(dateLocale(i18n.language), { weekday: "short", day: "numeric" })}
            </Chip>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold text-theme-heading-primary">{fixture.team_a}</span>
          <PlayerJersey team={fixture.team_a} size="sm" />
        </div>
      </div>

      {visible.length > 0 && (
        <div className="divide-y divide-theme-border border-t border-theme-border">
          {visible.map((player, idx) => (
            <div key={player.element} className="flex items-center gap-2.5 px-3 py-2">
              <span className="w-4 shrink-0 text-center text-[11px] tabular-nums text-theme-text-muted">
                {idx + 1}
              </span>
              <PlayerCell
                size="sm"
                team={shortFor(player.team)}
                isGoalkeeper={player.position === 1}
                name={player.web_name}
                meta={
                  <>
                    <span>{POSITION_SHORT[player.position] ?? ""}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{player.minutes}&apos;</span>
                  </>
                }
              />
              <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-theme-heading-primary">
                {player.bps}
              </span>
              <BonusBadge predicted={player.predicted_bonus} confirmed={player.current_bonus} />
            </div>
          ))}
        </div>
      )}

      {hidden > 0 && <ShowMoreButton expanded={expanded} onClick={onToggle} count={hidden} />}
    </div>
  );
}

/** Solid = bonus already awarded, outline = where BPS stands right now. */
function BonusBadge({ predicted, confirmed }: { predicted: number; confirmed: number }) {
  const value = confirmed > 0 ? confirmed : predicted;
  return (
    <span className="flex w-6 shrink-0 justify-center">
      {value > 0 && (
        <span
          className={cx(
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
            confirmed > 0
              ? "bg-violet-500 text-white"
              : "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/30 dark:text-violet-300"
          )}
        >
          {value}
        </span>
      )}
    </span>
  );
}
