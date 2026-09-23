"use client";

import { useTranslation } from "react-i18next";
import {
  Chip,
  cx,
  formatNumber,
  formatPrice,
  ListRow,
  PlayerCell,
  POSITION_SHORT,
  RoleBadge,
  SectionLabel,
  StatTile,
} from "@/components/fpl/live/ui";
import AutoSubArrow from "./AutoSubArrow";
import { CHIP_FULL_NAME, CHIP_LABELS } from "./LeagueChipPill";
import type {
  LeagueElementSummary,
  ProcessedTeam,
  ProcessedTeamPlayerDetail,
} from "./types";

interface LeagueTableExpandedProps {
  team: ProcessedTeam;
  elementMap: Map<number, LeagueElementSummary>;
  bonusAdded?: boolean;
}

/** A manager's live squad — rendered inside the detail sheet. */
export default function LeagueTableExpanded({
  team,
  elementMap,
  bonusAdded = false,
}: LeagueTableExpandedProps) {
  const { t } = useTranslation("fpl");

  const ordered = [...team.player_details].sort((a, b) => a.position - b.position);
  const startingXI = ordered.filter((p) => p.position <= 11);
  const bench = ordered.filter((p) => p.position > 11);
  const hit = team.event_transfers_cost;
  const detailFor = (id: number) => team.player_details.find((p) => p.element === id);

  const promotion = team.captain_promoted;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label={t("fplLive.ui.leagues.gw", "GW")}
          value={team.live_points_net}
          hint={
            hit > 0
              ? `${team.live_points_gross} − ${hit}`
              : t("fplLive.ui.leagues.noHits", "No hits")
          }
        />
        <StatTile
          label={t("fplLive.ui.leagues.total", "Total")}
          value={formatNumber(team.live_total)}
          hint={`#${team.rank} ${t("fplLive.ui.leagues.inLeague", "in league")}`}
        />
        <StatTile
          label={t("fplLive.ui.leagues.yetToPlay", "Yet to play")}
          value={team.players_to_play}
          hint={t("fplLive.ui.leagues.ofEleven", "of 11 starters")}
        />
        <StatTile
          label={t("fplLive.ui.leagues.transfers", "Transfers")}
          value={team.event_transfers}
          hint={hit > 0 ? `−${hit} ${t("fplLive.ui.leagues.pts", "pts")}` : t("fplLive.ui.leagues.free", "Free")}
        />
        <StatTile
          label={t("fplLive.ui.leagues.value", "Value")}
          value={formatPrice(team.team_value)}
          hint={`${t("fplLive.ui.leagues.bank", "Bank")} ${formatPrice(team.bank)}`}
        />
        <StatTile
          label={t("fplLive.ui.leagues.chip", "Chip")}
          value={team.active_chip ? CHIP_LABELS[team.active_chip] : "—"}
          hint={team.active_chip ? CHIP_FULL_NAME[team.active_chip] : t("fplLive.ui.leagues.noChip", "None played")}
        />
      </div>

      {(team.auto_subs_applied.length > 0 || promotion) && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
            {t("fplLive.ui.leagues.adjustments", "Automatic changes")}
          </h4>
          <div className="space-y-1.5">
            {team.auto_subs_applied.map((sub) => {
              const out = elementMap.get(sub.outId);
              const inn = elementMap.get(sub.inId);
              const inDetail = detailFor(sub.inId);
              return (
                <AutoSubArrow
                  key={`${sub.outId}-${sub.inId}`}
                  outName={out?.web_name ?? "?"}
                  inName={inn?.web_name ?? "?"}
                  outMinutes={detailFor(sub.outId)?.minutes}
                  inPoints={inDetail ? inDetail.effective_points : undefined}
                  reason={sub.reason}
                  outPlayer={out}
                  inPlayer={inn}
                />
              );
            })}
            {promotion && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-theme-text-secondary">
                <RoleBadge role="C" />
                <span className="min-w-0 truncate">
                  {t("fplLive.ui.leagues.captainPromoted", "Armband passes {{from}} → {{to}}", {
                    from: elementMap.get(promotion.fromId)?.web_name ?? "?",
                    to: elementMap.get(promotion.toId)?.web_name ?? "?",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="-mx-4 sm:-mx-5">
        <SectionLabel>{t("fplLive.ui.leagues.startingXI", "Starting XI")}</SectionLabel>
        <div className="divide-y divide-theme-border border-y border-theme-border">
          {startingXI.map((detail) => (
            <PlayerLine
              key={detail.element}
              detail={detail}
              element={elementMap.get(detail.element)}
              bonusAdded={bonusAdded}
            />
          ))}
        </div>

        <SectionLabel className="pt-4">{t("fplLive.ui.leagues.bench", "Bench")}</SectionLabel>
        <div className="divide-y divide-theme-border border-y border-theme-border">
          {bench.map((detail) => (
            <PlayerLine
              key={detail.element}
              detail={detail}
              element={elementMap.get(detail.element)}
              bonusAdded={bonusAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerLine({
  detail,
  element,
  bonusAdded,
}: {
  detail: ProcessedTeamPlayerDetail;
  element?: LeagueElementSummary;
  bonusAdded: boolean;
}) {
  const { t } = useTranslation("fpl");
  const counts = detail.multiplier_final > 0;
  const points = counts ? detail.effective_points * detail.multiplier_final : detail.effective_points;
  const subbedOut = detail.was_auto_subbed_out;
  const subbedIn = detail.was_auto_subbed_in;

  const role = detail.was_captain_promoted
    ? "C"
    : detail.is_captain
      ? detail.multiplier_final === 3 || detail.multiplier === 3
        ? "TC"
        : "C"
      : detail.is_vice_captain
        ? "V"
        : null;

  const yetToPlay = detail.minutes === 0 && !detail.fixture_finished && detail.opponent;

  return (
    <ListRow>
      <PlayerCell
        size="sm"
        player={element}
        name={
          <span className={cx(subbedOut && "text-theme-text-muted line-through")}>
            {element?.web_name ?? "?"}
          </span>
        }
        badges={
          <>
            {role && <RoleBadge role={role} />}
            {subbedIn && <Chip tone="positive">{t("fplLive.ui.leagues.subbedIn", "In")}</Chip>}
          </>
        }
        meta={
          <>
            <span>{POSITION_SHORT[element?.element_type ?? 0] ?? ""}</span>
            <span aria-hidden>·</span>
            {yetToPlay ? (
              <span className="truncate">
                {t("fplLive.ui.leagues.vs", "vs")} {detail.opponent} (
                {detail.is_home
                  ? t("fplLive.ui.leagues.homeShort", "H")
                  : t("fplLive.ui.leagues.awayShort", "A")}
                )
              </span>
            ) : (
              <span className="tabular-nums">{detail.minutes}&apos;</span>
            )}
            {!bonusAdded && detail.bonus_predicted > 0 && (
              <span className="text-violet-600 dark:text-violet-300">
                +{detail.bonus_predicted} {t("fplLive.ui.leagues.bonusShort", "bonus")}
              </span>
            )}
          </>
        }
      />
      <span
        className={cx(
          "w-8 shrink-0 text-right text-sm font-semibold tabular-nums",
          counts ? "text-theme-heading-primary" : "text-theme-text-muted"
        )}
      >
        {points}
      </span>
    </ListRow>
  );
}
