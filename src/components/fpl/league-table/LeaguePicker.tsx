"use client";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx, formatNumber, formatRank, ListRow, SectionLabel } from "@/components/fpl/live/ui";
import Movement from "./Movement";
import type { ManagerLeague } from "./types";

interface LeaguePickerProps {
  leagues: ManagerLeague[];
  selectedId: string;
  onSelect: (leagueId: string) => void;
}

/** The manager's classic leagues — private ones first, with his rank in each. */
export default function LeaguePicker({ leagues, selectedId, onSelect }: LeaguePickerProps) {
  const { t } = useTranslation("fpl");

  const privateLeagues = leagues.filter((l) => l.league_type === "x");
  const publicLeagues = leagues.filter((l) => l.league_type !== "x");
  const groups: Array<{ label: string | null; items: ManagerLeague[] }> =
    privateLeagues.length > 0 && publicLeagues.length > 0
      ? [
          { label: t("fplLive.ui.leagues.privateLeagues", "Private leagues"), items: privateLeagues },
          { label: t("fplLive.ui.leagues.publicLeagues", "General leagues"), items: publicLeagues },
        ]
      : [{ label: null, items: leagues }];

  return (
    <div>
      {groups.map((group) => (
        <div key={group.label ?? "all"}>
          {group.label && <SectionLabel>{group.label}</SectionLabel>}
          <div className="divide-y divide-theme-border">
            {group.items.map((league) => {
              const selected = String(league.id) === selectedId;
              const movement =
                league.entry_last_rank && league.entry_rank
                  ? league.entry_last_rank - league.entry_rank
                  : 0;
              return (
                <ListRow
                  key={league.id}
                  onClick={() => onSelect(String(league.id))}
                  highlighted={selected}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cx(
                        "truncate text-sm text-theme-heading-primary",
                        selected ? "font-semibold" : "font-medium"
                      )}
                    >
                      {league.name}
                    </div>
                    {typeof league.rank_count === "number" && league.rank_count > 0 && (
                      <div className="mt-0.5 text-[11px] text-theme-text-muted">
                        {t("fplLive.ui.leagues.managersCount", "{{total}} managers", {
                          total: formatNumber(league.rank_count),
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold leading-none tabular-nums text-theme-heading-primary">
                      {league.entry_rank ? formatRank(league.entry_rank) : "—"}
                    </span>
                    <Movement value={movement} />
                  </div>
                  <span className="flex w-4 shrink-0 justify-center">
                    {selected && <Check className="h-4 w-4 text-violet-500" />}
                  </span>
                </ListRow>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
