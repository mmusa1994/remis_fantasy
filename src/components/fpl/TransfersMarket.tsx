"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  Lock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getPlayerTeamColors } from "@/lib/team-colors";
import {
  Chip,
  EmptyState,
  GhostButton,
  ListRow,
  Panel,
  PlayerCell,
  PosTag,
  Segmented,
  SkeletonRows,
  StatTile,
  cx,
  formatCompact,
  formatPrice,
} from "./live/ui";

interface TransferPlayer {
  id: number;
  web_name: string;
  team: number;
  team_code?: number;
  position: number;
  element_type?: number;
  now_cost: number;
  cost_change_event?: number;
  selected_by_percent?: number;
  transfers_in_event: number;
  transfers_out_event: number;
  price_change_percent?: number | null;
  price_change_projected?: number | null;
  price_change_locked_until?: string | null;
}

interface TransferData {
  transfers_in?: TransferPlayer[];
  transfers_out?: TransferPlayer[];
  next_event?: {
    id: number;
    deadline_time: string;
    transfers_made: number;
  } | null;
}

interface TransfersMarketProps {
  /** Player ids in the manager's squad — flagged in both lists. */
  squadPlayerIds?: number[];
}

type Direction = "in" | "out";

const COLLAPSED_ROWS = 10;

const localeFor = (lang?: string) => (lang?.startsWith("bs") ? "sr-Latn-BA" : "en-GB");

export default function TransfersMarket({ squadPlayerIds }: TransfersMarketProps) {
  const { t, i18n } = useTranslation("fpl");
  const locale = localeFor(i18n.language);

  const [data, setData] = useState<TransferData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [view, setView] = useState<Direction>("in");
  const [expanded, setExpanded] = useState<Record<Direction, boolean>>({
    in: false,
    out: false,
  });

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fpl/transfers");
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch transfers data");
      setData(result.data || {});
      setLastUpdated(result.timestamp || new Date().toISOString());
    } catch (err) {
      console.error("💥 [FRONTEND] Error loading transfers:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const squad = useMemo(() => new Set(squadPlayerIds || []), [squadPlayerIds]);

  // Owned players being sold en masse are the ones whose price is at risk.
  const ownedSelling = useMemo(
    () =>
      (data.transfers_out || [])
        .slice(0, COLLAPSED_ROWS)
        .filter((p) => squad.has(p.id))
        .map((p) => p.web_name),
    [data.transfers_out, squad]
  );

  const hasData = !!(data.transfers_in?.length || data.transfers_out?.length);
  const nextGw = data.next_event?.id;

  const refreshButton = (
    <GhostButton
      onClick={fetchTransfers}
      disabled={loading}
      title={t("fplLive.refresh", "Refresh")}
    >
      <RefreshCw className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{t("fplLive.refresh", "Refresh")}</span>
    </GhostButton>
  );

  if (loading && !hasData) {
    return (
      <Panel
        title={t("fplLive.ui.transfers.title", "Transfer market")}
        subtitle={t("fplLive.ui.transfers.subtitle", "Most transferred players since the last deadline")}
        icon={<ArrowLeftRight />}
        flush
      >
        <SkeletonRows rows={8} />
      </Panel>
    );
  }

  if (error && !hasData) {
    return (
      <Panel icon={<ArrowLeftRight />} title={t("fplLive.ui.transfers.title", "Transfer market")}>
        <EmptyState
          icon={<ArrowLeftRight />}
          title={t("fplLive.ui.transfers.error", "Couldn't load transfers")}
          text={t("fplLive.ui.pages.retryHint", "Check your connection and try again.")}
          action={
            <GhostButton onClick={fetchTransfers}>
              <RefreshCw />
              {t("fplLive.ui.transfers.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  const deadline = data.next_event?.deadline_time
    ? new Date(data.next_event.deadline_time)
    : null;

  const renderList = (direction: Direction) => {
    const players = (direction === "in" ? data.transfers_in : data.transfers_out) || [];
    const isExpanded = expanded[direction];
    const visible = isExpanded ? players : players.slice(0, COLLAPSED_ROWS);
    const Icon = direction === "in" ? TrendingUp : TrendingDown;

    return (
      <Panel
        key={direction}
        className={cx(view === direction ? "block" : "hidden", "lg:block")}
        icon={<Icon />}
        title={
          direction === "in"
            ? t("fplLive.ui.transfers.mostIn", "Most transferred in")
            : t("fplLive.ui.transfers.mostOut", "Most transferred out")
        }
        subtitle={
          nextGw
            ? t("fplLive.ui.transfers.forGw", "For GW{{gw}}", { gw: nextGw })
            : undefined
        }
        flush
      >
        {players.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight />}
            title={t("fplLive.ui.transfers.noData", "No transfer data yet")}
          />
        ) : (
          <>
            <div className="divide-y divide-theme-border border-t border-theme-border">
              {visible.map((player, index) => (
                <TransferRow
                  key={player.id}
                  rank={index + 1}
                  player={player}
                  direction={direction}
                  owned={squad.has(player.id)}
                />
              ))}
            </div>
            {players.length > COLLAPSED_ROWS && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [direction]: !prev[direction] }))
                }
                className="w-full border-t border-theme-border py-2.5 text-xs font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary"
              >
                {isExpanded
                  ? t("fplLive.ui.transfers.showLess", "Show less")
                  : t("fplLive.ui.transfers.showAll", "Show all {{count}}", {
                      count: players.length,
                    })}
              </button>
            )}
          </>
        )}
      </Panel>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title={t("fplLive.ui.transfers.title", "Transfer market")}
        subtitle={
          nextGw
            ? t(
                "fplLive.ui.transfers.subtitleForGw",
                "Transfers made for GW{{gw}} since the last deadline",
                { gw: nextGw }
              )
            : t("fplLive.ui.transfers.subtitle", "Most transferred players since the last deadline")
        }
        icon={<ArrowLeftRight />}
        action={refreshButton}
      >
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label={
              nextGw
                ? t("fplLive.ui.transfers.transfersMade", "Transfers for GW{{gw}}", { gw: nextGw })
                : t("fplLive.ui.transfers.transfersMadeShort", "Transfers made")
            }
            value={formatCompact(data.next_event?.transfers_made ?? null)}
          />
          <StatTile
            label={
              nextGw
                ? t("fplLive.ui.transfers.deadline", "GW{{gw}} deadline", { gw: nextGw })
                : t("fplLive.ui.transfers.deadlineShort", "Deadline")
            }
            value={
              deadline
                ? deadline.toLocaleDateString(locale, { day: "numeric", month: "short" })
                : "—"
            }
            hint={
              deadline
                ? deadline.toLocaleString(locale, {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : undefined
            }
          />
        </div>

        {ownedSelling.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5">
            <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
            <p className="text-xs leading-snug text-theme-text-secondary">
              {t(
                "fplLive.ui.transfers.ownedSelling",
                "Your players among the most sold: {{names}}. Their price could drop.",
                { names: ownedSelling.join(", ") }
              )}
            </p>
          </div>
        )}

        {lastUpdated && (
          <p className="mt-3 text-[11px] text-theme-text-muted">
            {t("fplLive.ui.transfers.updatedAt", "Updated {{time}}", {
              time: new Date(lastUpdated).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </p>
        )}
      </Panel>

      <Segmented<Direction>
        className="lg:hidden"
        value={view}
        onChange={setView}
        options={[
          {
            value: "in",
            label: t("fplLive.ui.transfers.in", "In"),
            count: data.transfers_in?.length,
          },
          {
            value: "out",
            label: t("fplLive.ui.transfers.out", "Out"),
            count: data.transfers_out?.length,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {renderList("in")}
        {renderList("out")}
      </div>

      <p className="px-1 text-[11px] leading-snug text-theme-text-muted">
        {t(
          "fplLive.ui.transfers.priceLegend",
          "The small bar shows FPL's progress towards the player's next price change — at 100% the price moves."
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TransferRow({
  rank,
  player,
  direction,
  owned,
}: {
  rank: number;
  player: TransferPlayer;
  direction: Direction;
  owned: boolean;
}) {
  const { t } = useTranslation("fpl");
  const elementType = player.element_type ?? player.position;
  const kit = getPlayerTeamColors({ team: player.team, team_code: player.team_code });
  const count = direction === "in" ? player.transfers_in_event : player.transfers_out_event;
  const priceMove = player.cost_change_event || 0;

  return (
    <ListRow highlighted={owned}>
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-theme-text-muted">
        {rank}
      </span>
      <PlayerCell
        name={player.web_name}
        player={{ team: player.team, team_code: player.team_code, element_type: elementType }}
        badges={
          owned ? (
            <Chip tone="accent" className="shrink-0">
              {t("fplLive.ui.transfers.inSquad", "In your team")}
            </Chip>
          ) : null
        }
        meta={
          <>
            <span className="shrink-0 font-medium text-theme-text-secondary">{kit.shortName}</span>
            <PosTag type={elementType} className="shrink-0" />
            <span className="shrink-0 tabular-nums">{formatPrice(player.now_cost)}</span>
            {priceMove !== 0 && (
              <span
                className={cx(
                  "shrink-0 font-semibold tabular-nums",
                  priceMove > 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {priceMove > 0 ? "▲" : "▼"}
                {Math.abs(priceMove / 10).toFixed(1)}
              </span>
            )}
          </>
        }
      />
      <div className="flex w-[4.5rem] shrink-0 flex-col items-end gap-1">
        <span
          className={cx(
            "text-sm font-semibold tabular-nums",
            direction === "in" ? "text-emerald-500" : "text-rose-500"
          )}
        >
          {direction === "in" ? "+" : "−"}
          {formatCompact(count || 0)}
        </span>
        <PriceProgress
          percent={player.price_change_percent}
          projected={player.price_change_projected}
          locked={!!player.price_change_locked_until}
        />
      </div>
    </ListRow>
  );
}

/** FPL's progress towards the next price change, as a tiny bar. */
function PriceProgress({
  percent,
  projected,
  locked,
}: {
  percent?: number | null;
  projected?: number | null;
  locked: boolean;
}) {
  const { t } = useTranslation("fpl");

  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] text-theme-text-muted"
        title={t("fplLive.ui.transfers.priceLocked", "Price change locked")}
      >
        <Lock className="h-3 w-3" />
      </span>
    );
  }
  if (typeof percent !== "number") return null;

  const rising = percent >= 0;
  const due = typeof projected === "number" && Math.abs(projected) >= 100 && Math.sign(projected) === Math.sign(percent);

  if (due) {
    return (
      <Chip tone={rising ? "positive" : "negative"}>
        {rising
          ? t("fplLive.ui.transfers.risesTonight", "Rise tonight")
          : t("fplLive.ui.transfers.fallsTonight", "Fall tonight")}
      </Chip>
    );
  }

  const width = Math.min(100, Math.abs(percent));
  return (
    <span
      className="flex items-center gap-1.5"
      title={t("fplLive.ui.transfers.priceProgress", "Progress to next price change")}
    >
      <span className="h-1 w-8 overflow-hidden rounded-full bg-theme-card-secondary">
        <span
          className={cx("block h-full rounded-full", rising ? "bg-emerald-500" : "bg-rose-500")}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-[10px] font-medium tabular-nums text-theme-text-muted">
        {Math.round(Math.abs(percent))}%
      </span>
    </span>
  );
}
