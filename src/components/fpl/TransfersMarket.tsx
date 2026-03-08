"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TbTrendingUp, TbTrendingDown, TbTransfer } from "react-icons/tb";
import { MdRefresh, MdInfo } from "react-icons/md";

import { getTeamColors } from "@/lib/team-colors";

interface TransferData {
  transfers_in?: Array<{
    id: number;
    web_name: string;
    first_name: string;
    second_name: string;
    team: number;
    position: number;
    now_cost: number;
    transfers_in_event: number;
    transfers_in: number;
  }>;
  transfers_out?: Array<{
    id: number;
    web_name: string;
    first_name: string;
    second_name: string;
    team: number;
    position: number;
    now_cost: number;
    transfers_out_event: number;
    transfers_out: number;
  }>;
}

export default function TransfersMarket() {
  const { t } = useTranslation("fpl");
  const [transfersData, setTransfersData] = useState<TransferData>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/transfers");

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTransfersData(result.data);
          setLastUpdated(result.timestamp);
        } else {
          throw new Error(result.error || "Failed to fetch transfers data");
        }
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("💥 [FRONTEND] Error loading transfers:", err);
      setError(message);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const getPositionName = (position: number) => {
    switch (position) {
      case 1: return "GKP";
      case 2: return "DEF";  
      case 3: return "MID";
      case 4: return "FWD";
      default: return "UNK";
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "bg-yellow-500";
      case 2: return "bg-green-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatCost = (cost: number) => {
    return (cost / 10).toFixed(1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  if (isInitialLoad || (loading && !transfersData.transfers_in && !transfersData.transfers_out)) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 space-y-2 theme-transition">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <MdInfo className="text-red-600 dark:text-red-400 text-xl" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("fplLive.transfers.error")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-card border border-theme-border rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <TbTransfer className="text-xl sm:text-2xl text-theme-foreground flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-theme-foreground">
                {t("fplLive.transfers.title")}
              </h2>
              <p className="text-theme-text-secondary text-xs sm:text-sm">
                {t("fplLive.transfers.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={fetchTransfers}
            disabled={loading}
            className="flex items-center gap-1.5 sm:gap-2 bg-theme-card-secondary hover:bg-theme-border disabled:opacity-50 text-theme-foreground font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-all duration-200 text-sm sm:text-base"
          >
            <MdRefresh className={`text-base sm:text-lg ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs sm:text-sm">{t("fplLive.refresh")}</span>
          </button>
        </div>
        {lastUpdated && (
          <div className="mt-3 sm:mt-4 text-xs text-theme-text-secondary">
            {t("fplLive.lastUpdated")}: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfers In */}
        <div className="bg-theme-card rounded-lg border border-theme-border theme-transition">
          <div className="bg-theme-card border-b border-theme-border p-3 sm:p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <TbTrendingUp className="text-green-600 dark:text-green-400 text-lg" />
              <div>
                <h3 className="text-base font-semibold text-theme-foreground">
                  {t("fplLive.transfers.mostTransferredIn")}
                </h3>
                <p className="text-theme-text-secondary text-xs">
                  {t("fplLive.transfers.popularAdditions")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {transfersData.transfers_in && transfersData.transfers_in.length > 0 ? (
              <div className="space-y-3">
                {transfersData.transfers_in.slice(0, 10).map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-theme-card-secondary rounded-lg hover:bg-theme-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-theme-text-secondary">
                          #{index + 1}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${getPositionColor(player.position)}`}>
                          {getPositionName(player.position)}
                        </span>
                      </div>
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: getTeamColors(player.team).primary }}></div>
                      <div>
                        <p className="font-semibold text-theme-foreground">
                          {player.web_name}
                          <span className="text-xs text-theme-text-secondary ml-1">
                            ({getTeamColors(player.team).shortName})
                          </span>
                        </p>
                        <p className="text-sm text-theme-text-secondary">
                          £{formatCost(player.now_cost)}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        +{formatNumber(player.transfers_in_event || 0)}
                      </p>
                      <p className="text-xs text-theme-text-secondary">
                        {t("fplLive.transfers.thisGW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-theme-text-secondary">
                {t("fplLive.transfers.noData")}
              </div>
            )}
          </div>
        </div>

        {/* Transfers Out */}
        <div className="bg-theme-card rounded-lg border border-theme-border theme-transition">
          <div className="bg-theme-card border-b border-theme-border p-3 sm:p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <TbTrendingDown className="text-red-600 dark:text-red-400 text-lg" />
              <div>
                <h3 className="text-base font-semibold text-theme-foreground">
                  {t("fplLive.transfers.mostTransferredOut")}
                </h3>
                <p className="text-theme-text-secondary text-xs">
                  {t("fplLive.transfers.popularRemovals")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {transfersData.transfers_out && transfersData.transfers_out.length > 0 ? (
              <div className="space-y-3">
                {transfersData.transfers_out.slice(0, 10).map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-theme-card-secondary rounded-lg hover:bg-theme-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-theme-text-secondary">
                          #{index + 1}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${getPositionColor(player.position)}`}>
                          {getPositionName(player.position)}
                        </span>
                      </div>
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: getTeamColors(player.team).primary }}></div>
                      <div>
                        <p className="font-semibold text-theme-foreground">
                          {player.web_name}
                          <span className="text-xs text-theme-text-secondary ml-1">
                            ({getTeamColors(player.team).shortName})
                          </span>
                        </p>
                        <p className="text-sm text-theme-text-secondary">
                          £{formatCost(player.now_cost)}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        -{formatNumber(player.transfers_out_event || 0)}
                      </p>
                      <p className="text-xs text-theme-text-secondary">
                        {t("fplLive.transfers.thisGW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-theme-text-secondary">
                {t("fplLive.transfers.noData")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}