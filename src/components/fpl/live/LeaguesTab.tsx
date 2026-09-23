"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { LeagueTable } from "@/components/fpl/league-table";
import BpsLivePanel from "@/components/fpl/analytics/BpsLivePanel";
import EffectiveOwnershipPanel from "@/components/fpl/analytics/EffectiveOwnershipPanel";
import ChipUsagePanel from "@/components/fpl/analytics/ChipUsagePanel";
import XptsPredictionsPanel from "@/components/fpl/analytics/XptsPredictionsPanel";
import { Panel, Segmented, SkeletonRows } from "./ui";

type AnalyticsKey = "bps" | "eo" | "chips" | "xpts";

interface LeaguesTabProps {
  managerId?: number;
  gameweek: number;
  isLiveTracking: boolean;
  onToggleLive: () => void;
  /** Reloads the manager (used as the retry action when data is missing). */
  onRefresh: () => void;
  /** Page-level leagues request still running. */
  loading?: boolean;
}

/** "Leagues" tab: live mini-league table plus the extra live analytics. */
export default function LeaguesTab({
  managerId,
  gameweek,
  isLiveTracking,
  onToggleLive,
  onRefresh,
  loading = false,
}: LeaguesTabProps) {
  const { t } = useTranslation("fpl");
  const [analytics, setAnalytics] = useState<AnalyticsKey | "none">("none");

  return (
    <div className="space-y-3 sm:space-y-4">
      {loading ? (
        <Panel flush>
          <SkeletonRows rows={5} />
        </Panel>
      ) : managerId ? (
        <LeagueTable
          managerId={managerId}
          gameweek={gameweek}
          isPolling={isLiveTracking}
          onToggleLive={onToggleLive}
        />
      ) : (
        <Panel>
          <button
            type="button"
            onClick={onRefresh}
            className="w-full py-6 text-center text-sm text-theme-text-muted hover:text-theme-text-secondary"
          >
            {t("fplLive.ui.leagues.loadManagerFirst", "Load a manager to see league tables")}
          </button>
        </Panel>
      )}

      <Panel
        flush
        icon={<Sparkles />}
        title={t("fplLive.ui.leagues.moreAnalytics", "More live analytics")}
        subtitle={t(
          "fplLive.ui.leagues.moreAnalyticsText",
          "Bonus race, top-manager ownership, chips and expected points"
        )}
      >
        <div className="px-4 pb-4 sm:px-5">
          <Segmented<AnalyticsKey | "none">
            value={analytics}
            // Tapping the open view again collapses it.
            onChange={(next) => setAnalytics((current) => (current === next ? "none" : next))}
            options={[
              { value: "bps", label: t("fplLive.ui.leagues.tabBps", "BPS live") },
              { value: "eo", label: t("fplLive.ui.leagues.tabEo", "Ownership") },
              { value: "chips", label: t("fplLive.ui.leagues.tabChips", "Chips") },
              { value: "xpts", label: "xPts" },
            ]}
          />
        </div>
        {analytics !== "none" && (
          <div className="border-t border-theme-border">
            {analytics === "bps" && <BpsLivePanel />}
            {analytics === "eo" && <EffectiveOwnershipPanel />}
            {analytics === "chips" && <ChipUsagePanel />}
            {analytics === "xpts" && <XptsPredictionsPanel />}
          </div>
        )}
      </Panel>
    </div>
  );
}
