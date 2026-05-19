"use client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaShirt } from "react-icons/fa6";
import { getTeamColors } from "@/lib/team-colors";
import AutoSubArrow from "./AutoSubArrow";
import type { LeagueElementSummary, ProcessedTeam } from "./types";

interface LeagueTableExpandedProps {
  team: ProcessedTeam;
  elements: LeagueElementSummary[];
}

const POSITION_LABEL: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export default function LeagueTableExpanded({
  team,
  elements,
}: LeagueTableExpandedProps) {
  const { t } = useTranslation("fpl");

  const elementMap = useMemo(() => {
    const map = new Map<number, LeagueElementSummary>();
    for (const el of elements) map.set(el.id, el);
    return map;
  }, [elements]);

  const startingXI = team.player_details.filter((p) => p.position <= 11);
  const bench = team.player_details.filter((p) => p.position > 11);

  const subsRendered = team.auto_subs_applied.map((sub) => {
    const out = elementMap.get(sub.outId);
    const inn = elementMap.get(sub.inId);
    const inDetail = team.player_details.find((p) => p.element === sub.inId);
    const outDetail = team.player_details.find((p) => p.element === sub.outId);
    return (
      <AutoSubArrow
        key={`${sub.outId}-${sub.inId}`}
        outName={out?.web_name ?? "Unknown"}
        inName={inn?.web_name ?? "Unknown"}
        outMinutes={outDetail?.minutes}
        inPoints={inDetail ? inDetail.effective_points : undefined}
        reason={sub.reason}
      />
    );
  });

  const captainPromotion = team.captain_promoted
    ? (() => {
        const from = elementMap.get(team.captain_promoted!.fromId);
        const to = elementMap.get(team.captain_promoted!.toId);
        return (
          <div className="px-3 py-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-xs">
            <span className="font-semibold text-yellow-900 dark:text-yellow-200">
              {t(
                "leagueTables.captainPromoted",
                `Captain promoted: ${from?.web_name ?? "?"} → ${
                  to?.web_name ?? "?"
                }`,
                { from: from?.web_name ?? "?", to: to?.web_name ?? "?" }
              )}
            </span>
          </div>
        );
      })()
    : null;

  return (
    <div className="px-3 md:px-4 py-3 md:py-4 bg-theme-card-secondary/60 border-t border-theme-border space-y-3">
      {(subsRendered.length > 0 || captainPromotion) && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-theme-text-secondary uppercase">
            {t("leagueTables.adjustments", "Adjustments")}
          </h5>
          <div className="flex flex-wrap gap-2">{subsRendered}</div>
          {captainPromotion}
        </div>
      )}

      <div>
        <h5 className="text-xs font-bold text-theme-text-secondary uppercase mb-2">
          {t("leagueTables.startingXI", "Starting XI")}
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {startingXI.map((player) => {
            const el = elementMap.get(player.element);
            const teamColors = getTeamColors(el?.team || 1);
            const subbedOut = player.was_auto_subbed_out;
            const wasPromoted = player.was_captain_promoted;
            return (
              <div
                key={player.element}
                className={`p-2 rounded border text-xs ${
                  player.is_captain || wasPromoted
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : player.is_vice_captain
                      ? "border-gray-400 bg-gray-50 dark:bg-gray-900/20"
                      : "border-theme-border bg-theme-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <FaShirt
                      className="w-3 h-3 shrink-0"
                      style={{ color: teamColors.primary }}
                    />
                    <span
                      className={`font-bold truncate ${
                        subbedOut
                          ? "line-through text-theme-text-secondary"
                          : "text-theme-foreground"
                      }`}
                    >
                      {el?.web_name ?? "?"}
                    </span>
                    {player.is_captain && (
                      <span className="text-[10px] bg-yellow-500 text-white px-1 rounded">
                        C
                      </span>
                    )}
                    {wasPromoted && (
                      <span className="text-[10px] bg-purple-500 text-white px-1 rounded">
                        ↑C
                      </span>
                    )}
                    {player.is_vice_captain && !wasPromoted && (
                      <span className="text-[10px] bg-gray-500 text-white px-1 rounded">
                        V
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-theme-foreground">
                      {player.effective_points * player.multiplier_final}
                    </div>
                    <div className="text-[10px] text-theme-text-secondary">
                      {POSITION_LABEL[el?.element_type ?? 3] ?? ""} · {player.minutes}m
                    </div>
                  </div>
                </div>
                {player.bonus_predicted > 0 && (
                  <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
                    +{player.bonus_predicted}{" "}
                    {t("leagueTables.predictedBonus", "predicted bonus")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-bold text-theme-text-secondary uppercase mb-2">
          {t("leagueTables.bench", "Bench")}
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {bench.map((player) => {
            const el = elementMap.get(player.element);
            const teamColors = getTeamColors(el?.team || 1);
            const subbedIn = player.was_auto_subbed_in;
            return (
              <div
                key={player.element}
                className={`p-2 rounded border text-xs ${
                  subbedIn
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-theme-border bg-theme-card"
                }`}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <FaShirt
                    className="w-3 h-3 shrink-0"
                    style={{ color: teamColors.primary }}
                  />
                  <span
                    className={`font-bold truncate ${
                      subbedIn ? "text-green-700 dark:text-green-400" : ""
                    }`}
                  >
                    {el?.web_name ?? "?"}
                  </span>
                  {subbedIn && (
                    <span className="text-[10px] bg-green-500 text-white px-1 rounded">
                      IN
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-theme-text-secondary">
                    {POSITION_LABEL[el?.element_type ?? 3] ?? ""} · {player.minutes}m
                  </span>
                  <span className="text-[10px] font-bold text-theme-foreground">
                    {player.effective_points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
