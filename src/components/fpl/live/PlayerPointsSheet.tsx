"use client";

import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { getPlayerTeamColors, getTeamColors } from "@/lib/team-colors";
import {
  Chip,
  LiveDot,
  PlayerJersey,
  RoleBadge,
  Sheet,
  StatTile,
  cx,
  formatPrice,
  POSITION_SHORT,
} from "./ui";
import {
  computeBreakdown,
  fixtureState,
  reconcile,
  teamFixtures,
  useExplainBreakdown,
  type BreakdownLine,
  type LiveFixture,
  type LivePick,
} from "./playerPoints";

interface PlayerPointsSheetProps {
  pick: LivePick | null;
  onClose: () => void;
  /** Provisional bonus still to be added (0 once FPL confirms bonus). */
  predictedBonus: number;
  fixtures?: LiveFixture[];
  gameweek?: number;
}

const STAT_FALLBACK: Record<string, string> = {
  minutes: "Minutes played",
  goals_scored: "Goals",
  assists: "Assists",
  clean_sheets: "Clean sheet",
  goals_conceded: "Goals conceded",
  saves: "Saves",
  penalties_saved: "Penalties saved",
  penalties_missed: "Penalties missed",
  own_goals: "Own goals",
  defensive_contribution: "Defensive contribution",
  yellow_cards: "Yellow card",
  red_cards: "Red card",
  bonus: "Bonus",
  other: "Other",
};

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/** FPL-style points breakdown for one player of the live squad. */
export default function PlayerPointsSheet({
  pick,
  onClose,
  predictedBonus,
  fixtures,
  gameweek,
}: PlayerPointsSheetProps) {
  const { t, i18n } = useTranslation("fpl");
  const player = pick?.player ?? null;
  const stats = pick?.live_stats ?? null;
  const elementType = player?.element_type ?? 3;
  const rawTotal = stats?.total_points ?? 0;

  const exact = useExplainBreakdown(gameweek ?? pick?.gw, player?.id, rawTotal, !!pick);
  const lines: BreakdownLine[] = exact ?? reconcile(computeBreakdown(elementType, stats), rawTotal);

  const multiplier = pick && pick.multiplier > 0 ? pick.multiplier : 1;
  const counts = !!pick && pick.multiplier > 0;
  const baseTotal = rawTotal + predictedBonus;
  const finalTotal = baseTotal * multiplier;

  const kit = player ? getPlayerTeamColors(player) : null;
  const infos = teamFixtures(fixtures, player?.team);
  const state = fixtureState(infos, Array.isArray(fixtures));
  const locale = i18n.language?.startsWith("bs") ? "sr-Latn-BA" : "en-GB";

  const role = pick?.is_captain ? (pick.multiplier === 3 ? "TC" : "C") : pick?.is_vice_captain ? "V" : null;

  const statLabel = (id: string) => t(`fplLive.ui.squad.stat.${id}`, STAT_FALLBACK[id] ?? id);
  const statValue = (line: BreakdownLine) => {
    if (line.id === "other") return "";
    if (line.id === "minutes") return `${line.value}′`;
    return String(line.value);
  };

  return (
    <Sheet
      open={!!pick && !!player}
      onClose={onClose}
      title={
        player ? (
          <span className="flex items-center gap-2.5">
            <PlayerJersey player={player} size="md" />
            <span className="truncate">{player.web_name}</span>
            {role && <RoleBadge role={role} />}
          </span>
        ) : null
      }
      subtitle={
        player ? `${kit?.name ?? ""} · ${POSITION_SHORT[elementType] ?? ""}` : undefined
      }
    >
      {pick && player && (
        <div className="space-y-4">
          {/* Headline numbers */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label={t("fplLive.ui.squad.points", "Points")}
              value={counts ? finalTotal : baseTotal}
              hint={
                counts && multiplier > 1
                  ? `${baseTotal} × ${multiplier}`
                  : !counts
                  ? t("fplLive.ui.squad.onBench", "On the bench")
                  : undefined
              }
            />
            <StatTile
              label={t("fplLive.ui.squad.minutes", "Minutes")}
              value={`${stats?.minutes ?? 0}′`}
            />
            <StatTile label="BPS" value={stats?.bps ?? 0} />
          </div>

          {/* Fixture(s) */}
          {state && (
            <div className="rounded-xl border border-theme-border">
              {state === "none" ? (
                <p className="px-3 py-2.5 text-xs text-theme-text-muted">
                  {t("fplLive.ui.squad.noFixture", "No fixture this gameweek")}
                </p>
              ) : (
                <div className="divide-y divide-theme-border">
                  {infos.map(({ fixture }) => {
                    const home = getTeamColors(fixture.team_h);
                    const away = getTeamColors(fixture.team_a);
                    const done = fixture.finished || fixture.finished_provisional;
                    return (
                      <div key={fixture.id} className="flex items-center gap-2 px-3 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-sm font-medium text-theme-heading-primary">
                          <span className="truncate">{home.shortName}</span>
                          <PlayerJersey team={fixture.team_h} size="xs" />
                        </div>
                        <span className="min-w-[3.25rem] rounded-md bg-theme-card-secondary px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-theme-heading-primary">
                          {fixture.started
                            ? `${fixture.team_h_score ?? 0}–${fixture.team_a_score ?? 0}`
                            : fixture.kickoff_time
                            ? new Date(fixture.kickoff_time).toLocaleTimeString(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "–"}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-theme-heading-primary">
                          <PlayerJersey team={fixture.team_a} size="xs" />
                          <span className="truncate">{away.shortName}</span>
                        </div>
                        <span className="w-16 shrink-0 text-right">
                          {done ? (
                            <Chip>{t("fplLive.ui.squad.state.finished", "Finished")}</Chip>
                          ) : fixture.started ? (
                            <Chip tone="positive">
                              <LiveDot className="scale-75" />
                              {fixture.minutes}′
                            </Chip>
                          ) : (
                            <Chip>
                              {fixture.kickoff_time
                                ? new Date(fixture.kickoff_time).toLocaleDateString(locale, {
                                    weekday: "short",
                                  })
                                : t("fplLive.ui.squad.state.upcoming", "Not started")}
                            </Chip>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Breakdown */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
              {t("fplLive.ui.squad.breakdown", "Points breakdown")}
            </div>
            <div className="overflow-hidden rounded-xl border border-theme-border">
              {lines.length === 0 && predictedBonus === 0 ? (
                <p className="px-3 py-3 text-xs text-theme-text-muted">
                  {t("fplLive.ui.squad.noPointsYet", "No points yet")}
                </p>
              ) : (
                <div className="divide-y divide-theme-border text-sm">
                  {lines.map((line) => (
                    <div key={line.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="flex-1 text-theme-text-secondary">{statLabel(line.id)}</span>
                      <span className="w-10 text-right tabular-nums text-theme-text-muted">
                        {statValue(line)}
                      </span>
                      <span
                        className={cx(
                          "w-10 text-right font-semibold tabular-nums",
                          line.points < 0 ? "text-rose-500" : "text-theme-heading-primary"
                        )}
                      >
                        {signed(line.points)}
                      </span>
                    </div>
                  ))}
                  {predictedBonus > 0 && (
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="flex-1 text-theme-text-secondary">
                        {t("fplLive.ui.squad.predictedBonus", "Predicted bonus")}{" "}
                        <span className="text-[11px] text-theme-text-muted">
                          ({t("fplLive.ui.squad.provisional", "provisional")})
                        </span>
                      </span>
                      <span className="w-10" />
                      <span className="w-10 text-right font-semibold tabular-nums text-violet-600 dark:text-violet-300">
                        {signed(predictedBonus)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-theme-card-secondary px-3 py-2">
                    <span className="flex-1 font-medium text-theme-heading-primary">
                      {t("fplLive.ui.squad.total", "Total")}
                    </span>
                    <span className="w-10 text-right font-semibold tabular-nums text-theme-heading-primary">
                      {baseTotal}
                    </span>
                  </div>
                  {counts && multiplier > 1 && (
                    <div className="flex items-center gap-3 bg-theme-card-secondary px-3 py-2">
                      <span className="flex-1 font-medium text-theme-heading-primary">
                        {t("fplLive.ui.squad.captainMultiplier", "Captain ×{{x}}", { x: multiplier })}
                      </span>
                      <span className="w-10 text-right text-base font-bold tabular-nums text-theme-heading-primary">
                        {finalTotal}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Player context */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile label={t("fplLive.ui.squad.price", "Price")} value={formatPrice(player.now_cost)} />
            <StatTile
              label={t("fplLive.ui.squad.ownership", "Selected by")}
              value={`${parseFloat(player.selected_by_percent || "0").toFixed(1)}%`}
            />
            <StatTile
              label={t("fplLive.ui.squad.form", "Form")}
              value={parseFloat(player.form || "0").toFixed(1)}
            />
          </div>

          {player.news && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{player.news}</span>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
