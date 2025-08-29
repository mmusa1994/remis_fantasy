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
  MdStar
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

// Team name mapping to IDs (based on team-colors.ts)
const getTeamIdFromName = (teamName: string): number => {
  const teamMapping: { [key: string]: number } = {
    'Arsenal': 1,
    'Aston Villa': 2,
    'Burnley': 3,
    'Bournemouth': 4,
    'Brentford': 5,
    'Brighton': 6,
    'Chelsea': 7,
    'Crystal Palace': 8,
    'Everton': 9,
    'Fulham': 10,
    'Leeds': 11,
    'Liverpool': 12,
    'Man City': 13,
    'Manchester City': 13,
    'Man Utd': 14,
    'Manchester United': 14,
    'Newcastle': 15,
    'Nottingham Forest': 16,
    'Sunderland': 17,
    'Spurs': 18,
    'Tottenham': 18,
    'West Ham': 19,
    'Wolves': 20,
    'Nice': 21, // Placeholder for non-PL teams
  };
  return teamMapping[teamName] || 0;
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
  const [minOwnership, setMinOwnership] = useState(0);
  const [activeTab, setActiveTab] = useState<"risers" | "fallers">("risers");
  const [timeRemaining, setTimeRemaining] = useState("");

  // Mock data - Replace with actual API call (matches your example)
  const mockData: PriceChangePrediction = {
    risers: [
      {
        id: 1,
        name: "Pedro Porro",
        position: "DEF",
        team: "Spurs",
        price: 5.5,
        prediction: 103.92,
        progress: 102.25,
        target_reached: true,
        is_riser: true,
        ownership: 15.2,
        form: 4.5
      },
      {
        id: 2,
        name: "Cash",
        position: "DEF",
        team: "Aston Villa",
        price: 4.5,
        prediction: 100.25,
        progress: 100.08,
        target_reached: true,
        is_riser: true,
        ownership: 12.8,
        form: 3.8
      },
      {
        id: 3,
        name: "Livramento",
        position: "DEF",
        team: "Newcastle",
        price: 5.0,
        prediction: 99.02,
        progress: 96.54,
        target_reached: false,
        is_riser: true,
        ownership: 8.4,
        form: 4.2
      },
      {
        id: 4,
        name: "Lewis",
        position: "DEF",
        team: "Man City",
        price: 5.0,
        prediction: 95.58,
        progress: 95.41,
        target_reached: false,
        is_riser: true,
        ownership: 7.2,
        form: 3.5
      },
      {
        id: 5,
        name: "Raya",
        position: "GK",
        team: "Arsenal",
        price: 5.5,
        prediction: 94.82,
        progress: 94.77,
        target_reached: false,
        is_riser: true,
        ownership: 22.1,
        form: 4.8
      }
    ],
    fallers: [
      {
        id: 10,
        name: "Pinnock",
        position: "DEF",
        team: "Brentford",
        price: 4.5,
        prediction: -160.71,
        progress: -160.37,
        target_reached: true,
        is_riser: false,
        ownership: 4.2,
        form: 1.2
      },
      {
        id: 11,
        name: "Broja",
        position: "FW",
        team: "Burnley",
        price: 5.5,
        prediction: -141.44,
        progress: -140.68,
        target_reached: true,
        is_riser: false,
        ownership: 3.8,
        form: 0.8
      },
      {
        id: 12,
        name: "Humphreys",
        position: "DEF",
        team: "Burnley",
        price: 4.0,
        prediction: -120.29,
        progress: -120.94,
        target_reached: false,
        is_riser: false,
        ownership: 2.1,
        form: 1.0
      },
      {
        id: 13,
        name: "Aït-Nouri",
        position: "DEF",
        team: "Wolves",
        price: 6.1,
        prediction: -112.87,
        progress: -110.9,
        target_reached: true,
        is_riser: false,
        ownership: 8.3,
        form: 2.1
      },
      {
        id: 14,
        name: "Kostoulas",
        position: "FW",
        team: "Brighton",
        price: 5.0,
        prediction: -107.7,
        progress: -106.23,
        target_reached: true,
        is_riser: false,
        ownership: 1.8,
        form: 0.5
      },
      {
        id: 15,
        name: "Guessand",
        position: "MID",
        team: "Nice",
        price: 6.5,
        prediction: -106.72,
        progress: -106.07,
        target_reached: true,
        is_riser: false,
        ownership: 2.4,
        form: 1.3
      },
      {
        id: 16,
        name: "Milambo",
        position: "MID",
        team: "Brentford",
        price: 5.5,
        prediction: -105.26,
        progress: -104.66,
        target_reached: true,
        is_riser: false,
        ownership: 3.1,
        form: 1.8
      },
      {
        id: 17,
        name: "Gnonto",
        position: "MID",
        team: "Leeds",
        price: 5.5,
        prediction: -105.77,
        progress: -104.63,
        target_reached: true,
        is_riser: false,
        ownership: 4.7,
        form: 2.2
      },
      {
        id: 18,
        name: "Bernardo",
        position: "MID",
        team: "Man City",
        price: 6.5,
        prediction: -104.89,
        progress: -104.26,
        target_reached: true,
        is_riser: false,
        ownership: 15.6,
        form: 3.1
      },
      {
        id: 19,
        name: "Robertson",
        position: "DEF",
        team: "Liverpool",
        price: 6.0,
        prediction: -104.13,
        progress: -104.13,
        target_reached: true,
        is_riser: false,
        ownership: 18.9,
        form: 2.5
      },
      {
        id: 20,
        name: "Yates",
        position: "MID",
        team: "Nottingham Forest",
        price: 5.0,
        prediction: -103.98,
        progress: -103.98,
        target_reached: true,
        is_riser: false,
        ownership: 6.2,
        form: 2.8
      },
      {
        id: 21,
        name: "Cairney",
        position: "MID",
        team: "Fulham",
        price: 5.0,
        prediction: -105.69,
        progress: -103.78,
        target_reached: true,
        is_riser: false,
        ownership: 7.4,
        form: 3.2
      },
      {
        id: 22,
        name: "Lamptey",
        position: "DEF",
        team: "Brighton",
        price: 4.5,
        prediction: -103.21,
        progress: -103.21,
        target_reached: true,
        is_riser: false,
        ownership: 5.1,
        form: 2.0
      },
      {
        id: 23,
        name: "Boateng",
        position: "MID",
        team: "Crystal Palace",
        price: 5.0,
        prediction: -103.11,
        progress: -103.11,
        target_reached: true,
        is_riser: false,
        ownership: 2.9,
        form: 1.4
      },
      {
        id: 24,
        name: "D.Leon",
        position: "DEF",
        team: "Newcastle",
        price: 4.5,
        prediction: -102.99,
        progress: -102.99,
        target_reached: true,
        is_riser: false,
        ownership: 1.7,
        form: 1.1
      },
      {
        id: 25,
        name: "Martinelli",
        position: "MID",
        team: "Arsenal",
        price: 7.0,
        prediction: -100.31,
        progress: -100.31,
        target_reached: true,
        is_riser: false,
        ownership: 23.4,
        form: 4.1
      },
      {
        id: 26,
        name: "Madueke",
        position: "MID",
        team: "Chelsea",
        price: 7.0,
        prediction: -100.18,
        progress: -100.18,
        target_reached: true,
        is_riser: false,
        ownership: 14.8,
        form: 3.7
      },
      {
        id: 27,
        name: "Foden",
        position: "MID",
        team: "Man City",
        price: 8.0,
        prediction: -98.76,
        progress: -98.76,
        target_reached: false,
        is_riser: false,
        ownership: 31.2,
        form: 5.2
      }
    ],
    last_updated: new Date().toISOString(),
    next_update: new Date(Date.now() + 17 * 60 * 60 * 1000 + 11 * 60 * 1000).toISOString(),
    total_predictions: 142
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (data?.next_update) {
      const updateTimer = setInterval(() => {
        const now = new Date().getTime();
        const nextUpdate = new Date(data.next_update).getTime();
        const difference = nextUpdate - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
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
        return theme === "dark" ? "text-yellow-400 bg-yellow-400/20" : "text-yellow-600 bg-yellow-100";
      case "DEF":
        return theme === "dark" ? "text-green-400 bg-green-400/20" : "text-green-600 bg-green-100";
      case "MID":
        return theme === "dark" ? "text-blue-400 bg-blue-400/20" : "text-blue-600 bg-blue-100";
      case "FW":
        return theme === "dark" ? "text-red-400 bg-red-400/20" : "text-red-600 bg-red-100";
      default:
        return theme === "dark" ? "text-gray-400 bg-gray-400/20" : "text-gray-600 bg-gray-100";
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
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === "all" || player.team === selectedTeam;
      const matchesOwnership = !showOnlyOwned || player.ownership >= minOwnership;
      
      return matchesSearch && matchesTeam && matchesOwnership;
    });
  };

  const PlayerCard = ({ player }: { player: Player }) => {
    const teamId = getTeamIdFromName(player.team);
    const teamColors = getTeamColors(teamId);
    
    return (
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
        theme === "dark" 
          ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}>
        <div className="flex items-center gap-3">
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
              <h3 className="font-semibold text-theme-foreground truncate">{player.name}</h3>
              {player.ownership > 20 && (
                <MdStar className="w-4 h-4 text-yellow-500" title="High Ownership" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                {player.position}
              </span>
              <span className="text-theme-text-secondary font-medium">£{player.price}</span>
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
            <div className={`text-lg font-bold ${getProgressColor(player.progress, player.is_riser)}`}>
              {player.progress > 0 ? "+" : ""}{player.progress.toFixed(2)}%
            </div>
            <div className="text-xs text-theme-text-secondary mt-1">
              Prediction: {player.prediction > 0 ? "+" : ""}{player.prediction.toFixed(2)}%
            </div>
            {player.target_reached && (
              <span className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
                player.is_riser 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {t("prices.targetReached")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <LoadingCard
            title={t("prices.loading")}
            description={t("prices.loadingDescription")}
            className="max-w-md mx-auto"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{t("common.error")}</p>
            <p className="text-theme-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayers = activeTab === "risers" ? data?.risers || [] : data?.fallers || [];
  const displayPlayers = filteredPlayers(currentPlayers);

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
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"
          }`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <MdArrowUpward className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-theme-foreground">{data?.risers.length}</p>
                <p className="text-sm text-theme-text-secondary">{t("prices.predictedRises")}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <MdArrowDownward className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-theme-foreground">{data?.fallers.length}</p>
                <p className="text-sm text-theme-text-secondary">{t("prices.predictedFalls")}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <MdPerson className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-theme-foreground">{data?.total_predictions}</p>
                <p className="text-sm text-theme-text-secondary">{t("prices.totalPredictions")}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <MdGroup className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-theme-foreground">
                  {data?.risers.filter(p => p.target_reached).length || 0}
                </p>
                <p className="text-sm text-theme-text-secondary">{t("prices.targetReached")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${
          theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="Arsenal">Arsenal</option>
              <option value="Aston Villa">Aston Villa</option>
              <option value="Brighton">Brighton</option>
              <option value="Brentford">Brentford</option>
              <option value="Burnley">Burnley</option>
              <option value="Chelsea">Chelsea</option>
              <option value="Crystal Palace">Crystal Palace</option>
              <option value="Fulham">Fulham</option>
              <option value="Leeds">Leeds</option>
              <option value="Liverpool">Liverpool</option>
              <option value="Man City">Man City</option>
              <option value="Newcastle">Newcastle</option>
              <option value="Nottingham Forest">Nottingham Forest</option>
              <option value="Spurs">Spurs</option>
              <option value="Wolves">Wolves</option>
            </select>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyOwned}
                  onChange={(e) => setShowOnlyOwned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-theme-text-secondary">{t("prices.highOwnership")}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex rounded-lg mb-6 ${
          theme === "dark" ? "bg-gray-800/50" : "bg-white border border-gray-200"
        }`}>
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

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

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
        <div className={`mt-8 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"
        }`}>
          <p className="text-sm text-theme-text-secondary text-center">
            {t("prices.infoFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}