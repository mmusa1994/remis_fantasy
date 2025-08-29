"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import LoadingCard from "@/components/shared/LoadingCard";
import { getTeamColors } from "@/lib/team-colors";
import {
  MdArrowUpward,
  MdArrowDownward,
  MdSearch,
  MdFilterList,
  MdPerson,
  MdGroup,
  MdAccessTime,
  MdStar,
} from "react-icons/md";
import { TbShirt } from "react-icons/tb";

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  price: number;
  prediction: number;
  progress: number;
  target_reached: boolean;
  is_riser: boolean;
  ownership: number;
  form: number;
}

interface PriceChangePrediction {
  risers: Player[];
  fallers: Player[];
  last_updated: string;
  next_update: string;
  total_predictions: number;
}

// Team name mapping to IDs (handles both full names and short names)
const getTeamIdFromName = (teamName: string): number => {
  const teamMapping: { [key: string]: number } = {
    // Full team names
    Arsenal: 1,
    "Aston Villa": 2,
    Burnley: 3,
    Bournemouth: 4,
    Brentford: 5,
    Brighton: 6,
    Chelsea: 7,
    "Crystal Palace": 8,
    Everton: 9,
    Fulham: 10,
    Leeds: 11,
    Liverpool: 12,
    "Man City": 13,
    "Manchester City": 13,
    "Man Utd": 14,
    "Manchester United": 14,
    Newcastle: 15,
    "Nottingham Forest": 16,
    Sunderland: 17,
    Spurs: 18,
    Tottenham: 18,
    "West Ham": 19,
    Wolves: 20,
    
    // Short team names from FPL API
    ARS: 1,
    AVL: 2,
    BUR: 3,
    BOU: 4,
    BRE: 5,
    BHA: 6,
    CHE: 7,
    CRY: 8,
    EVE: 9,
    FUL: 10,
    LEE: 11,
    LIV: 12,
    MCI: 13,
    MUN: 14,
    NEW: 15,
    NFO: 16,
    SOU: 17,
    TOT: 18,
    WHU: 19,
    WOL: 20,
    
    // Additional mappings for full official names
    "Brighton & Hove Albion": 6,
    "West Ham United": 19,
    "Wolverhampton Wanderers": 20,
  };
  return teamMapping[teamName] || 0;
};

// Team ID to name mapping (reverse lookup)
const getTeamNameFromId = (teamId: number): string => {
  const teamIdMapping: { [key: number]: string } = {
    1: "Arsenal",
    2: "Aston Villa",
    3: "Burnley",
    4: "Bournemouth",
    5: "Brentford",
    6: "Brighton",
    7: "Chelsea",
    8: "Crystal Palace",
    9: "Everton",
    10: "Fulham",
    11: "Leeds",
    12: "Liverpool",
    13: "Man City",
    14: "Man Utd",
    15: "Newcastle",
    16: "Nottingham Forest",
    17: "Sunderland",
    18: "Spurs",
    19: "West Ham",
    20: "Wolves",
  };
  return teamIdMapping[teamId] || "Unknown";
};

export default function PricesPage() {
  const { t } = useTranslation("fpl");
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PriceChangePrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [activeTab, setActiveTab] = useState<"risers" | "fallers">("risers");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const fetchLiveFPLData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real LiveFPL price change data via our proxy API
        const response = await fetch("/api/livefpl/price-predictions");
        
        if (!response.ok) {
          throw new Error("Failed to fetch LiveFPL data");
        }

        const apiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Failed to fetch LiveFPL data");
        }

        const liveFPLData = apiResponse.data;
        
        // Transform API data to our format
        const risers: Player[] = [];
        const fallers: Player[] = [];

        // Process risers
        if (liveFPLData.risers && Array.isArray(liveFPLData.risers)) {
          liveFPLData.risers.forEach((player: any) => {
            const playerData: Player = {
              id: player.id,
              name: player.web_name,
              position: player.element_type === 1 ? "GK" : player.element_type === 2 ? "DEF" : player.element_type === 3 ? "MID" : "FW",
              team: player.team_name,
              price: player.now_cost / 10,
              prediction: player.target_prediction,
              progress: player.target_progress,
              target_reached: player.target_reached,
              is_riser: true,
              ownership: player.selected_by_percent,
              form: parseFloat(player.form || "0"),
            };
            risers.push(playerData);
          });
        }

        // Process fallers
        if (liveFPLData.fallers && Array.isArray(liveFPLData.fallers)) {
          liveFPLData.fallers.forEach((player: any) => {
            const playerData: Player = {
              id: player.id,
              name: player.web_name,
              position: player.element_type === 1 ? "GK" : player.element_type === 2 ? "DEF" : player.element_type === 3 ? "MID" : "FW",
              team: player.team_name,
              price: player.now_cost / 10,
              prediction: player.target_prediction,
              progress: player.target_progress,
              target_reached: player.target_reached,
              is_riser: false,
              ownership: player.selected_by_percent,
              form: parseFloat(player.form || "0"),
            };
            fallers.push(playerData);
          });
        }

        const nextUpdate = new Date();
        nextUpdate.setUTCHours(1, 30, 0, 0); // 1:30 GMT
        if (nextUpdate.getTime() < Date.now()) {
          nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
        }

        const priceDataResult: PriceChangePrediction = {
          risers: risers,
          fallers: fallers,
          last_updated: liveFPLData.last_updated || new Date().toISOString(),
          next_update: liveFPLData.next_update || nextUpdate.toISOString(),
          total_predictions: liveFPLData.total_players || (risers.length + fallers.length),
        };

        setData(priceDataResult);
      } catch (err) {
        console.error("Failed to fetch LiveFPL data:", err);
        // Fallback to FPL API if LiveFPL fails
        try {
          const response = await fetch("/api/fpl/bootstrap-static");
          const apiData = await response.json();

          if (!apiData.success) {
            throw new Error("Both LiveFPL and FPL API failed");
          }

          // Simple fallback with basic algorithm
          const players = apiData.data.elements;
          const risers: Player[] = [];
          const fallers: Player[] = [];

          players.forEach((player: any) => {
            if (player.status !== "a") return;

            const transfersIn = player.transfers_in_event || 0;
            const transfersOut = player.transfers_out_event || 0;
            const netTransfers = transfersIn - transfersOut;
            const ownership = parseFloat(player.selected_by_percent) || 0;

            // Simple prediction based on net transfers
            const transferRate = ownership > 0 ? netTransfers / (ownership * 1000) : 0;
            const prediction = 100 + (transferRate * 50);
            const progress = prediction + ((Math.random() - 0.5) * 10);

            if (Math.abs(netTransfers) > 100) { // Only show players with significant transfer activity
              const playerData: Player = {
                id: player.id,
                name: player.web_name,
                position: player.element_type === 1 ? "GK" : player.element_type === 2 ? "DEF" : player.element_type === 3 ? "MID" : "FW",
                team: getTeamNameFromId(player.team),
                price: player.now_cost / 10,
                prediction: Math.round(prediction * 100) / 100,
                progress: Math.round(progress * 100) / 100,
                target_reached: Math.abs(progress - 100) >= 20,
                is_riser: netTransfers > 0,
                ownership: ownership,
                form: parseFloat(player.form) || 0,
              };

              if (netTransfers > 0) {
                risers.push(playerData);
              } else {
                fallers.push(playerData);
              }
            }
          });

          risers.sort((a, b) => b.prediction - a.prediction);
          fallers.sort((a, b) => a.prediction - b.prediction);

          const priceData: PriceChangePrediction = {
            risers: risers,
            fallers: fallers,
            last_updated: new Date().toISOString(),
            next_update: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            total_predictions: risers.length + fallers.length,
          };

          setData(priceData);
        } catch {
          setError("Unable to load price change data from any source");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLiveFPLData();
  }, []);

  useEffect(() => {
    if (data?.next_update) {
      const updateTimer = setInterval(() => {
        const now = new Date().getTime();
        const nextUpdate = new Date(data.next_update).getTime();
        const difference = nextUpdate - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining("Updating...");
        }
      }, 1000);

      return () => clearInterval(updateTimer);
    }
  }, [data]);

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK":
        return theme === "dark"
          ? "text-yellow-400 bg-yellow-400/20"
          : "text-yellow-600 bg-yellow-100";
      case "DEF":
        return theme === "dark"
          ? "text-green-400 bg-green-400/20"
          : "text-green-600 bg-green-100";
      case "MID":
        return theme === "dark"
          ? "text-blue-400 bg-blue-400/20"
          : "text-blue-600 bg-blue-100";
      case "FW":
        return theme === "dark"
          ? "text-red-400 bg-red-400/20"
          : "text-red-600 bg-red-100";
      default:
        return theme === "dark"
          ? "text-gray-400 bg-gray-400/20"
          : "text-gray-600 bg-gray-100";
    }
  };

  const getProgressColor = (progress: number, isRiser: boolean) => {
    if (isRiser) {
      if (progress >= 100) return "text-green-500";
      if (progress >= 90) return "text-yellow-500";
      return "text-blue-500";
    } else {
      if (progress <= -100) return "text-red-500";
      if (progress <= -90) return "text-orange-500";
      return "text-gray-500";
    }
  };

  const filteredPlayers = (players: Player[]) => {
    return players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam =
        selectedTeam === "all" || player.team === selectedTeam;
      const matchesOwnership =
        !showOnlyOwned || player.ownership >= 5; // 5% minimum for high ownership

      return matchesSearch && matchesTeam && matchesOwnership;
    });
  };

  // Pagination helpers
  const getPaginatedPlayers = (players: Player[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return players.slice(startIndex, endIndex);
  };

  const getTotalPages = (players: Player[]) => {
    return Math.ceil(players.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PlayerCard = ({ player }: { player: Player }) => {
    const teamId = getTeamIdFromName(player.team);
    const teamColors = getTeamColors(teamId);

    return (
      <div
        className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-700 hover:border-gray-600"
            : "bg-white border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* Mobile Layout: Stack vertically */}
        <div className="block sm:hidden">
          <div className="flex items-center gap-3 mb-3">
            {/* Club Shirt with Team Colors */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                backgroundColor: teamColors.primary,
                border: `2px solid ${teamColors.secondary}`,
              }}
            >
              <TbShirt
                className="w-5 h-5"
                style={{ color: teamColors.secondary }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-theme-foreground text-sm truncate">
                  {player.name}
                </h3>
                {player.ownership > 20 && (
                  <MdStar
                    className="w-3 h-3 text-yellow-500 flex-shrink-0"
                    title="High Ownership"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(
                    player.position
                  )}`}
                >
                  {player.position}
                </span>
                <span className="text-theme-text-secondary font-medium text-sm">
                  £{player.price}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div
                className={`text-base font-bold ${getProgressColor(
                  player.progress,
                  player.is_riser
                )}`}
              >
                {player.progress > 0 ? "+" : ""}
                {player.progress.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Second row for mobile: team info and prediction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
              <span className="truncate">{player.team}</span>
              <span>•</span>
              <span>{player.ownership.toFixed(1)}% owned</span>
              <span>•</span>
              <span>{player.form.toFixed(1)} form</span>
            </div>

            <div className="text-xs text-theme-text-secondary text-right">
              Pred: {player.prediction > 0 ? "+" : ""}
              {player.prediction.toFixed(2)}%
            </div>
          </div>

          {/* Third row for mobile: target reached badge */}
          {player.target_reached && (
            <div className="mt-2 flex justify-center">
              <span
                className={`inline-block text-xs px-2 py-1 rounded ${
                  player.is_riser
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {t("prices.targetReached")}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Club Shirt with Team Colors */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: teamColors.primary,
              border: `2px solid ${teamColors.secondary}`,
            }}
          >
            <TbShirt
              className="w-6 h-6"
              style={{ color: teamColors.secondary }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-theme-foreground truncate">
                {player.name}
              </h3>
              {player.ownership > 20 && (
                <MdStar
                  className="w-4 h-4 text-yellow-500"
                  title="High Ownership"
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(
                  player.position
                )}`}
              >
                {player.position}
              </span>
              <span className="text-theme-text-secondary font-medium">
                £{player.price}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-theme-text-secondary">
              <span>{player.team}</span>
              <span>•</span>
              <span>{player.ownership.toFixed(1)}% owned</span>
              <span>•</span>
              <span>{player.form.toFixed(1)} form</span>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-lg font-bold ${getProgressColor(
                player.progress,
                player.is_riser
              )}`}
            >
              {player.progress > 0 ? "+" : ""}
              {player.progress.toFixed(2)}%
            </div>
            <div className="text-xs text-theme-text-secondary mt-1">
              Prediction: {player.prediction > 0 ? "+" : ""}
              {player.prediction.toFixed(2)}%
            </div>
            {player.target_reached && (
              <span
                className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
                  player.is_riser
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {t("prices.targetReached")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };


  // Reset to page 1 when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedTeam, showOnlyOwned]);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <LoadingCard title={t("prices.loading")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{t("common.error")}</p>
            <p className="text-theme-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayers =
    activeTab === "risers" ? data?.risers || [] : data?.fallers || [];
  const displayPlayers = filteredPlayers(currentPlayers);
  const paginatedPlayers = getPaginatedPlayers(displayPlayers);
  const totalPages = getTotalPages(displayPlayers);

  return (
    <div className="min-h-screen bg-theme-background theme-transition">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-theme-foreground mb-4">
            {t("prices.title")}
          </h1>
          <p className="text-lg text-theme-text-secondary mb-6 max-w-2xl mx-auto">
            {t("prices.subtitle")}
          </p>

          {/* Countdown */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              theme === "dark"
                ? "bg-blue-900/30 text-blue-400"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            <MdAccessTime className="w-5 h-5" />
            <span className="font-medium">
              {t("prices.nextUpdate")}: {timeRemaining}
            </span>
          </div>

          <p className="text-sm text-theme-text-secondary mt-2">
            {t("prices.updateInfo")}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div
            className={`p-3 sm:p-4 rounded-lg ${
              theme === "dark"
                ? "bg-gray-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <MdArrowUpward className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-theme-foreground">
                  {data?.risers.length}
                </p>
                <p className="text-xs sm:text-sm text-theme-text-secondary truncate">
                  {t("prices.predictedRises")}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg ${
              theme === "dark"
                ? "bg-gray-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <MdArrowDownward className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-theme-foreground">
                  {data?.fallers.length}
                </p>
                <p className="text-xs sm:text-sm text-theme-text-secondary truncate">
                  {t("prices.predictedFalls")}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg ${
              theme === "dark"
                ? "bg-gray-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <MdPerson className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-theme-foreground">
                  {data?.total_predictions}
                </p>
                <p className="text-xs sm:text-sm text-theme-text-secondary truncate">
                  {t("prices.totalPredictions")}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg ${
              theme === "dark"
                ? "bg-gray-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <MdGroup className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-theme-foreground">
                  {data?.risers.filter((p) => p.target_reached).length || 0}
                </p>
                <p className="text-xs sm:text-sm text-theme-text-secondary truncate">
                  {t("prices.targetReached")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`p-3 sm:p-4 rounded-lg mb-6 ${
            theme === "dark"
              ? "bg-gray-800/50"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder={t("prices.searchPlayer")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">{t("prices.allTeams")}</option>
              <option value="ARS">Arsenal</option>
              <option value="AVL">Aston Villa</option>
              <option value="BOU">Bournemouth</option>
              <option value="BRE">Brentford</option>
              <option value="BHA">Brighton</option>
              <option value="BUR">Burnley</option>
              <option value="CHE">Chelsea</option>
              <option value="CRY">Crystal Palace</option>
              <option value="EVE">Everton</option>
              <option value="FUL">Fulham</option>
              <option value="LIV">Liverpool</option>
              <option value="MCI">Man City</option>
              <option value="MUN">Man Utd</option>
              <option value="NEW">Newcastle</option>
              <option value="NFO">Nottingham Forest</option>
              <option value="TOT">Spurs</option>
              <option value="WHU">West Ham</option>
              <option value="WOL">Wolves</option>
            </select>

            <div className="flex items-center justify-center sm:justify-start">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyOwned}
                  onChange={(e) => setShowOnlyOwned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm text-theme-text-secondary">
                  {t("prices.highOwnership")}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex rounded-lg mb-6 ${
            theme === "dark"
              ? "bg-gray-800/50"
              : "bg-white border border-gray-200"
          }`}
        >
          <button
            onClick={() => setActiveTab("risers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === "risers"
                ? theme === "dark"
                  ? "bg-green-900/30 text-green-400"
                  : "bg-green-100 text-green-800"
                : "text-theme-text-secondary hover:text-theme-foreground"
            }`}
          >
            <MdArrowUpward className="w-5 h-5" />
            {t("prices.predictedRises")}
          </button>
          <button
            onClick={() => setActiveTab("fallers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === "fallers"
                ? theme === "dark"
                  ? "bg-red-900/30 text-red-400"
                  : "bg-red-100 text-red-800"
                : "text-theme-text-secondary hover:text-theme-foreground"
            }`}
          >
            <MdArrowDownward className="w-5 h-5" />
            {t("prices.predictedFalls")}
          </button>
        </div>

        {/* Players Info */}
        {displayPlayers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-theme-text-secondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, displayPlayers.length)} of {displayPlayers.length} players
            </p>
            <p className="text-sm text-theme-text-secondary">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginatedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : theme === "dark"
                  ? "text-white bg-gray-700 hover:bg-gray-600"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNumber
                        ? theme === "dark"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : theme === "dark"
                        ? "text-white bg-gray-700 hover:bg-gray-600"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : theme === "dark"
                  ? "text-white bg-gray-700 hover:bg-gray-600"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {displayPlayers.length === 0 && (
          <div className="text-center py-12">
            <MdFilterList className="w-16 h-16 text-theme-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-theme-foreground mb-2">
              {t("prices.noPlayersFound")}
            </h3>
            <p className="text-theme-text-secondary">
              {t("prices.tryAdjustingFilters")}
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div
          className={`mt-8 p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"
          }`}
        >
          <p className="text-sm text-theme-text-secondary text-center">
            {t("prices.infoFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
