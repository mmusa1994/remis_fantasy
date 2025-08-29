"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TbTrendingUp, TbTrendingDown, TbTransfer } from "react-icons/tb";
import { MdRefresh, MdInfo } from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";
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
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && !transfersData.transfers_in) {
    return <LoadingCard title={t("fplLive.transfers.loading")} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
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
      <div className="bg-gradient-to-r from-orange-500/90 to-red-600/90 rounded-xl shadow-lg p-6 border border-orange-300/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TbTransfer className="text-2xl text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {t("fplLive.transfers.title")}
              </h2>
              <p className="text-orange-100 text-sm">
                {t("fplLive.transfers.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={fetchTransfers}
            disabled={loading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white font-medium py-2 px-4 rounded-lg backdrop-blur transition-all duration-200"
          >
            <MdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm">{t("fplLive.refresh")}</span>
          </button>
        </div>
        {lastUpdated && (
          <div className="mt-4 text-sm text-orange-100">
            {t("fplLive.lastUpdated")}: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfers In */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-t-xl">
            <div className="flex items-center gap-3">
              <TbTrendingUp className="text-2xl text-white" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t("fplLive.transfers.mostTransferredIn")}
                </h3>
                <p className="text-green-100 text-sm">
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
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPositionColor(player.position)}`}>
                          {getPositionName(player.position)}
                        </span>
                      </div>
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: getTeamColors(player.team).primary }}></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.web_name}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({getTeamColors(player.team).shortName})
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          £{formatCost(player.now_cost)}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        +{formatNumber(player.transfers_in_event || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("fplLive.transfers.thisGW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t("fplLive.transfers.noData")}
              </div>
            )}
          </div>
        </div>

        {/* Transfers Out */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-t-xl">
            <div className="flex items-center gap-3">
              <TbTrendingDown className="text-2xl text-white" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t("fplLive.transfers.mostTransferredOut")}
                </h3>
                <p className="text-red-100 text-sm">
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
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPositionColor(player.position)}`}>
                          {getPositionName(player.position)}
                        </span>
                      </div>
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: getTeamColors(player.team).primary }}></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.web_name}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({getTeamColors(player.team).shortName})
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          £{formatCost(player.now_cost)}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        -{formatNumber(player.transfers_out_event || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("fplLive.transfers.thisGW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t("fplLive.transfers.noData")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}