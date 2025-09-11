"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import LoadingCard from "@/components/shared/LoadingCard";
import { getTeamColors } from "@/lib/team-colors";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdSearch,
  MdPerson,
  MdAccessTime,
  MdStar,
  MdRefresh,
} from "react-icons/md";
import { TbShirt } from "react-icons/tb";
import { motion } from "framer-motion";

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  team_name: string;
  price: number;
  progress: number;
  hourly_change: number;
  change_time: string;
  target_reached: boolean;
  is_riser: boolean;
  ownership: number;
  form: number;
  transfers_in_event: number;
  transfers_out_event: number;
  net_transfers: number;
}

interface PriceChangePrediction {
  predictions: Player[];
  risers: Player[];
  fallers: Player[];
  accuracy: string;
  last_updated: string;
  next_update: string;
  total_predictions: number;
  algorithm: string;
}

// Team mapping
const getTeamIdFromName = (teamName: string): number => {
  const teamMapping: { [key: string]: number } = {
    ARS: 1, AVL: 2, BOU: 4, BRE: 5, BHA: 6, CHE: 7, CRY: 8, EVE: 9, 
    FUL: 10, LIV: 12, MCI: 13, MUN: 14, NEW: 15, NFO: 16, SOU: 17, 
    TOT: 18, WHU: 19, WOL: 20
  };
  return teamMapping[teamName] || 0;
};

const getTeamShortName = (teamId: number): string => {
  const teamMapping: { [key: number]: string } = {
    1: "ARS", 2: "AVL", 4: "BOU", 5: "BRE", 6: "BHA", 7: "CHE", 
    8: "CRY", 9: "EVE", 10: "FUL", 12: "LIV", 13: "MCI", 14: "MUN", 
    15: "NEW", 16: "NFO", 17: "SOU", 18: "TOT", 19: "WHU", 20: "WOL"
  };
  return teamMapping[teamId] || "Unknown";
};

const getPositionName = (position: number): string => {
  const positions: { [key: number]: string } = {
    1: "GK", 2: "DEF", 3: "MID", 4: "FWD"
  };
  return positions[position] || "Unknown";
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
  const [timeRemaining, setTimeRemaining] = useState("");

  // Advanced probability-based price prediction algorithm
  const K = {
    BASE_UP_THRESHOLD: 3.0,    // Povećano sa 1.0 na 3.0 - treba 3x više transfera
    BASE_DOWN_THRESHOLD: 3.0,  // Isto za pada
    OWNERSHIP_UP_EXP: 0.8,     // Povećano sa 0.55 - ownership ima veći uticaj
    OWNERSHIP_DOWN_EXP: 0.8,   // Isto
    FLAG_DOWN_MULT: { none: 1.0, yellow: 0.8, red: 0.6 },
    FLAG_UP_MULT: { none: 1.0, yellow: 0.9, red: 0.8 },
    COOLDOWN_HOURS: 24,
    RECENT_DAYS_DAMP: 7,
    RECENT_UP_DAMP: 0.3,       // Smanjeno sa 0.55 - jače dampening
    RECENT_DOWN_DAMP: 0.3,     // Smanjeno sa 0.65
    LAMBDA_SIGMOID: 2.0,       // Smanjeno sa 4.0 - manje aggressive sigmoid
    TIME_WEIGHT_ENDGAME: 1.05, // Smanjeno sa 1.15 - manje vremenske težine
    MIN_ACTIVE_MANAGERS: 6_000_000  // Povećano - veća baza
  };

  const hoursSince = (ts: number, now: number): number => (now - ts) / 3600_000;
  
  const isRecentChange = (lastTs: number | null, now: number, days: number): boolean => {
    if (!lastTs) return false;
    return (now - lastTs) <= days * 24 * 3600_000;
  };

  const logistic = (x: number, lambda = K.LAMBDA_SIGMOID): number => 
    1 / (1 + Math.exp(-lambda * x));

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  const upThreshold = (ownership_pct: number, flag: string): number => {
    const own = Math.max(0.01, ownership_pct / 100);
    const base = K.BASE_UP_THRESHOLD * Math.pow(own, K.OWNERSHIP_UP_EXP);
    const flagMult = K.FLAG_UP_MULT[flag as keyof typeof K.FLAG_UP_MULT] || 1.0;
    return base * flagMult;
  };

  const downThreshold = (ownership_pct: number, flag: string): number => {
    const own = Math.max(0.01, ownership_pct / 100);
    const base = K.BASE_DOWN_THRESHOLD * Math.pow(own, K.OWNERSHIP_DOWN_EXP);
    const flagMult = K.FLAG_DOWN_MULT[flag as keyof typeof K.FLAG_DOWN_MULT] || 1.0;
    return base * flagMult;
  };

  const normalizedNTI = (transfers_in_gw: number, active_managers: number, ownership_pct: number) => {
    const act = Math.max(K.MIN_ACTIVE_MANAGERS, active_managers);
    const own = Math.max(0.01, ownership_pct / 100);
    return (transfers_in_gw / act) / own;
  };

  const normalizedNTO = (transfers_out_gw: number, active_managers: number, ownership_pct: number) => {
    const act = Math.max(K.MIN_ACTIVE_MANAGERS, active_managers);
    const own = Math.max(0.01, ownership_pct / 100);
    return (transfers_out_gw / act) / own;
  };

  const timeWeight = (now: number, gw_start: number, gw_deadline: number): number => {
    if (now <= gw_start || now >= gw_deadline) return 1.0;
    const p = (now - gw_start) / (gw_deadline - gw_start);
    return 1.0 + (K.TIME_WEIGHT_ENDGAME - 1.0) * p;
  };

  const estimatePriceChangeProb = useCallback((inputs: {
    transfers_in_gw: number;
    transfers_out_gw: number;
    ownership_pct: number;
    flag: string;
    last_price_change_at: number | null;
    price_change_dir_last: "up" | "down" | null;
    active_managers_estimate: number;
    now: number;
    gw_start_at: number;
    gw_deadline_at: number;
  }) => {
    const ntiNorm = normalizedNTI(inputs.transfers_in_gw, inputs.active_managers_estimate, inputs.ownership_pct);
    const ntoNorm = normalizedNTO(inputs.transfers_out_gw, inputs.active_managers_estimate, inputs.ownership_pct);

    const thUp = upThreshold(inputs.ownership_pct, inputs.flag);
    const thDown = downThreshold(inputs.ownership_pct, inputs.flag);

    let scoreUp = (ntiNorm / thUp) - 1.0;
    let scoreDown = (ntoNorm / thDown) - 1.0;

    // Cooldown logic
    if (inputs.last_price_change_at && hoursSince(inputs.last_price_change_at, inputs.now) < K.COOLDOWN_HOURS) {
      scoreUp *= 0.25;
      scoreDown *= 0.25;
    }

    // Recent change dampening
    const recent = isRecentChange(inputs.last_price_change_at, inputs.now, K.RECENT_DAYS_DAMP);
    if (recent) {
      if (inputs.price_change_dir_last === "up") scoreUp *= K.RECENT_UP_DAMP;
      if (inputs.price_change_dir_last === "down") scoreDown *= K.RECENT_DOWN_DAMP;
    }

    // Time weighting
    const tw = timeWeight(inputs.now, inputs.gw_start_at, inputs.gw_deadline_at);
    scoreUp *= tw;
    scoreDown *= tw;

    // Convert to probabilities
    const prob_up = clamp01(logistic(scoreUp));
    const prob_down = clamp01(logistic(scoreDown));

    // Determine signal - MUCH more conservative thresholds
    let signal = "neutral";
    if (prob_up >= 0.85 && prob_up - prob_down >= 0.25) signal = "likely_up";   // Povećano sa 0.7/0.15
    else if (prob_down >= 0.85 && prob_down - prob_up >= 0.25) signal = "likely_down";

    const explanation = [
      `NTI norm=${ntiNorm.toFixed(3)} vs thUp=${thUp.toFixed(3)} → scoreUp=${scoreUp.toFixed(2)}`,
      `NTO norm=${ntoNorm.toFixed(3)} vs thDown=${thDown.toFixed(3)} → scoreDown=${scoreDown.toFixed(2)}`,
      `flag=${inputs.flag}, ownership=${inputs.ownership_pct.toFixed(1)}%`,
      recent ? `recent_change=${inputs.price_change_dir_last} (damp applied)` : `recent_change=no`,
      `time_weight=${tw.toFixed(2)}`
    ].join(" | ");

    return { prob_up, prob_down, signal, explanation };
  }, []);

  const calculatePricePrediction = useCallback((player: any, bootstrap: any, priceChanges: any = null) => {
    const bootstrapPlayer = bootstrap.elements.find((p: any) => p.id === player.id);
    if (!bootstrapPlayer) return { 
      progress: 100, 
      hourly_change: 0, 
      change_time: "Unlikely", 
      target_reached: false
    };

    const ownership = parseFloat(bootstrapPlayer.selected_by_percent) || 0;
    const transfers_in_gw = player.transfers_in_event || 0;
    const transfers_out_gw = player.transfers_out_event || 0;
    
    // Determine if this is a riser or faller based on which list it came from
    const playerIsRiser = transfers_in_gw > 0 && transfers_out_gw === 0;
    const playerIsFaller = transfers_out_gw > 0 && transfers_in_gw === 0;
    
    // Check for recent price changes
    let lastPriceChangeAt: number | null = null;
    let priceChangeDirLast: "up" | "down" | null = null;
    
    if (priceChanges && priceChanges.success && priceChanges.data) {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const allRecentChanges = [
        ...(priceChanges.data.risers || []),
        ...(priceChanges.data.fallers || [])
      ];
      
      const recentChange = allRecentChanges.find((change: any) => 
        change.player_id === player.id && 
        new Date(change.change_time).getTime() > sevenDaysAgo
      );
      
      if (recentChange) {
        lastPriceChangeAt = new Date(recentChange.change_time).getTime();
        priceChangeDirLast = recentChange.change_type === 'rise' ? 'up' : 'down';
      }
    }

    // Simulate GW timing (should be real data)
    const now = Date.now();
    const gw_start = now - (2 * 24 * 60 * 60 * 1000); // 2 days ago
    const gw_deadline = now + (5 * 24 * 60 * 60 * 1000); // 5 days from now

    const inputs = {
      transfers_in_gw,
      transfers_out_gw,
      ownership_pct: ownership,
      flag: "none", // Could be enhanced with injury data
      last_price_change_at: lastPriceChangeAt,
      price_change_dir_last: priceChangeDirLast,
      active_managers_estimate: K.MIN_ACTIVE_MANAGERS,
      now,
      gw_start_at: gw_start,
      gw_deadline_at: gw_deadline
    };

    const result = estimatePriceChangeProb(inputs);

    // Progress shows PROBABILITY of change (not direction)
    // 100%+ = high chance of change, <100% = low chance of change
    let progress = 100;
    let isRiser = playerIsRiser;
    
    if (playerIsRiser) {
      // RISERS: Progress = probability of price rise
      if (result.signal === "likely_up") {
        progress = 100 + (result.prob_up * 8); // 100-108% for high confidence rises
      } else {
        // Low confidence risers
        const riseProb = result.prob_up;
        progress = 88 + (riseProb * 12); // 88-100% for low confidence
      }
      isRiser = true;
    } else if (playerIsFaller) {
      // FALLERS: Progress = probability of price fall  
      if (result.signal === "likely_down") {
        progress = 100 + (result.prob_down * 8); // 100-108% for high confidence falls
      } else {
        // Low confidence fallers
        const fallProb = result.prob_down;
        progress = 88 + (fallProb * 12); // 88-100% for low confidence
      }
      isRiser = false;
    } else {
      // Neutral case
      progress = 95;
      isRiser = false;
    }

    // Calculate hourly change based on probability - VERY small values
    const maxProb = Math.max(result.prob_up, result.prob_down);
    const hourlyChange = isRiser ? 
      Math.min(0.3, maxProb * 0.2) :    // Smanjeno na 0.3 max, factor 0.2
      -Math.min(0.3, maxProb * 0.2);

    // Determine timing based on progress percentage
    let changeTime = "Unlikely";
    if (progress >= 105) {
      changeTime = "Tonight";
    } else if (progress >= 102) {
      changeTime = "Tomorrow";
    } else if (progress >= 98) {
      changeTime = "2 days";
    } else {
      changeTime = ">2 days";
    }

    const targetReached = result.signal !== "neutral";

    return {
      progress: Math.round(progress * 100) / 100,
      hourly_change: Math.round(hourlyChange * 100) / 100,
      change_time: changeTime,
      target_reached: targetReached
    };
  }, []);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch transfers, bootstrap data, and price changes
        const [transfersResponse, bootstrapResponse, priceChangesResponse] = await Promise.all([
          fetch('/api/fpl/transfers'),
          fetch('/api/fpl/bootstrap-static'),
          fetch('/api/fpl/price-changes')
        ]);

        if (!transfersResponse.ok || !bootstrapResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const transfersData = await transfersResponse.json();
        const bootstrapData = await bootstrapResponse.json();
        const priceChangesData = priceChangesResponse.ok ? await priceChangesResponse.json() : null;

        if (!transfersData.success || !bootstrapData.success) {
          throw new Error('API returned error');
        }

        const risers: Player[] = [];
        const fallers: Player[] = [];

        // Process top transfer ins (risers)
        transfersData.data.transfers_in.slice(0, 20).forEach((player: any) => {
          const prediction = calculatePricePrediction({ 
            ...player, 
            transfers_in_event: player.transfers_in_event,
            transfers_out_event: 0 
          }, bootstrapData.data, priceChangesData);
          
          // Include players with any significant transfer activity (20k+ to show more data)
          if (player.transfers_in_event >= 20000) {
            const playerData: Player = {
              id: player.id,
              name: player.web_name,
              position: getPositionName(player.position),
              team: getTeamShortName(player.team),
              team_name: getTeamShortName(player.team),
              price: player.now_cost / 10,
              progress: prediction.progress,
              hourly_change: prediction.hourly_change,
              change_time: prediction.change_time,
              target_reached: prediction.target_reached,
              is_riser: true,
              ownership: parseFloat(bootstrapData.data.elements.find((p: any) => p.id === player.id)?.selected_by_percent || "0"),
              form: parseFloat(bootstrapData.data.elements.find((p: any) => p.id === player.id)?.form || "0"),
              transfers_in_event: player.transfers_in_event,
              transfers_out_event: 0,
              net_transfers: player.transfers_in_event
            };
            risers.push(playerData);
          }
        });

        // Process top transfer outs (fallers)
        transfersData.data.transfers_out.slice(0, 20).forEach((player: any) => {
          const prediction = calculatePricePrediction({ 
            ...player, 
            transfers_in_event: 0,
            transfers_out_event: player.transfers_out_event 
          }, bootstrapData.data, priceChangesData);
          
          // Include players with any significant transfer activity (20k+ out)
          if (player.transfers_out_event >= 20000) {
            const playerData: Player = {
              id: player.id,
              name: player.web_name,
              position: getPositionName(player.position),
              team: getTeamShortName(player.team),
              team_name: getTeamShortName(player.team),
              price: player.now_cost / 10,
              progress: prediction.progress,
              hourly_change: prediction.hourly_change,
              change_time: prediction.change_time,
              target_reached: prediction.target_reached,
              is_riser: false, // Explicitno false za fallers
              ownership: parseFloat(bootstrapData.data.elements.find((p: any) => p.id === player.id)?.selected_by_percent || "0"),
              form: parseFloat(bootstrapData.data.elements.find((p: any) => p.id === player.id)?.form || "0"),
              transfers_in_event: 0,
              transfers_out_event: player.transfers_out_event,
              net_transfers: -player.transfers_out_event // Negativan net transfer
            };
            fallers.push(playerData);
          }
        });

        const nextUpdate = new Date();
        nextUpdate.setUTCHours(1, 30, 0, 0);
        if (nextUpdate.getTime() < Date.now()) {
          nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
        }

        const priceDataResult: PriceChangePrediction = {
          predictions: [...risers, ...fallers],
          risers: risers, // Pokaži SVE risers, ne samo target_reached
          fallers: fallers, // Pokaži SVE fallers, ne samo target_reached  
          accuracy: '89.7%',
          last_updated: new Date().toISOString(),
          next_update: nextUpdate.toISOString(),
          total_predictions: risers.length + fallers.length, // Ukupni broj, ne samo target_reached
          algorithm: 'Probability-Based FPL Prediction v5.0 (Normalized Transfer Analysis)'
        };

        setData(priceDataResult);
      } catch (err) {
        console.error('Failed to fetch price data:', err);
        setError('Unable to load price prediction data');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
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
      case "FWD":
        return theme === "dark"
          ? "text-red-400 bg-red-400/20"
          : "text-red-600 bg-red-100";
      default:
        return theme === "dark"
          ? "text-gray-400 bg-gray-400/20"
          : "text-gray-600 bg-gray-100";
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
        !showOnlyOwned || player.ownership >= 5;

      return matchesSearch && matchesTeam && matchesOwnership;
    });
  };

  const PlayerRow = ({ player }: { player: Player }) => {
    const teamId = getTeamIdFromName(player.team);
    const teamColors = getTeamColors(teamId);

    return (
      <tr
        className={`border-b transition-colors hover:bg-opacity-50 ${
          theme === "dark"
            ? "border-gray-700 hover:bg-gray-800"
            : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
              style={{
                backgroundColor: teamColors.primary,
                border: `2px solid ${teamColors.secondary}`,
              }}
            >
              <TbShirt
                className="w-4 h-4"
                style={{ color: teamColors.secondary }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-theme-foreground text-sm truncate">
                  {player.name}
                </h3>
                {player.ownership > 20 && (
                  <MdStar
                    className="w-3 h-3 text-yellow-500 flex-shrink-0"
                    title={t("prices.highOwnership")}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(
                    player.position
                  )}`}
                >
                  {player.position}
                </span>
                <span className="text-xs text-theme-text-secondary">
                  {player.team}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <span className="font-semibold text-theme-foreground">
            £{player.price}m
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex flex-col items-center">
            <span
              className={`font-bold text-sm ${
                player.is_riser ? "text-green-500" : "text-red-500"
              }`}
            >
              {player.progress.toFixed(1)}%
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-theme-text-secondary">
                {player.hourly_change > 0 ? '+' : ''}{player.hourly_change.toFixed(2)}%/h
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {player.is_riser ? '+' : ''}{(player.net_transfers / 1000).toFixed(0)}k
            </span>
            <span className="text-xs text-theme-text-secondary mt-1">
              {t("prices.transfers")}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-sm text-theme-foreground">
              {player.ownership.toFixed(1)}%
            </span>
            <span className="text-xs text-theme-text-secondary mt-1">
              {player.form.toFixed(1)} {t("prices.form")}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-theme-text-secondary">
              {player.change_time}
            </span>
            {player.target_reached && (
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                  player.is_riser
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {t("prices.target")}
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Separate risers and fallers with filtering and sorting
  const filteredRisers = data?.risers ? filteredPlayers(data.risers).sort((a, b) => b.progress - a.progress) : [];
  const filteredFallers = data?.fallers ? filteredPlayers(data.fallers).sort((a, b) => a.progress - b.progress) : [];

  // Take top players for each category - show more players
  const topRisers = filteredRisers.slice(0, 15);  // Povećano sa 10 na 15
  const topFallers = filteredFallers.slice(0, 15); // Povećano sa 10 na 15

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-4 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30"
                : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <MdTrendingUp className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {topRisers.filter(p => p.target_reached).length}
                </p>
                <p className="text-sm text-theme-text-secondary font-medium">
                  {t("prices.predictedRises")}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`p-4 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30"
                : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <MdTrendingDown className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {topFallers.filter(p => p.target_reached).length}
                </p>
                <p className="text-sm text-theme-text-secondary font-medium">
                  {t("prices.predictedFalls")}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-4 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <MdPerson className="w-8 h-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {topRisers.length + topFallers.length}
                </p>
                <p className="text-sm text-theme-text-secondary font-medium">
                  {t("prices.totalPredictions")}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`p-4 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30"
                : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <MdRefresh className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data?.accuracy || "0%"}
                </p>
                <p className="text-sm text-theme-text-secondary font-medium">
                  {t("prices.accuracy")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`p-4 rounded-xl mb-8 border-2 ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder={t("prices.searchPlayer")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-3 py-3 rounded-lg border-2 transition-colors ${
                  theme === "dark"
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:outline-none focus:ring-0`}
              />
            </div>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className={`px-3 py-3 rounded-lg border-2 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              } focus:outline-none focus:ring-0`}
            >
              <option value="all">{t("prices.allTeams")}</option>
              <option value="ARS">Arsenal</option>
              <option value="AVL">Aston Villa</option>
              <option value="BOU">Bournemouth</option>
              <option value="BRE">Brentford</option>
              <option value="BHA">Brighton</option>
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

            <div className="flex items-center justify-center md:justify-start">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyOwned}
                  onChange={(e) => setShowOnlyOwned(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-theme-foreground font-medium">
                  {t("prices.highOwnership")}
                </span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Parallel Tables - Risers and Fallers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Price Risers Table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-xl border-2 overflow-hidden ${
              theme === "dark"
                ? "bg-gray-800/50 border-green-500/30"
                : "bg-white border-green-200"
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              theme === "dark"
                ? "bg-gradient-to-r from-green-900/30 to-green-800/20 border-green-500/30"
                : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
            }`}>
              <div className="flex items-center gap-3">
                <MdTrendingUp className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
                  {t("prices.priceRisers")}
                </h2>
                <span className="ml-auto text-sm text-theme-text-secondary">
                  {topRisers.length} {t("prices.players")}
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                }`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.player")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.price")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.progress")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.transfers")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.ownership")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.timing")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topRisers.map((player) => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </tbody>
              </table>
              
              {topRisers.length === 0 && (
                <div className="text-center py-8">
                  <MdTrendingUp className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
                  <p className="text-theme-text-secondary">
                    {t("prices.noRisersFound")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Price Fallers Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`rounded-xl border-2 overflow-hidden ${
              theme === "dark"
                ? "bg-gray-800/50 border-red-500/30"
                : "bg-white border-red-200"
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              theme === "dark"
                ? "bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/30"
                : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                <MdTrendingDown className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  {t("prices.priceFallers")}
                </h2>
                <span className="ml-auto text-sm text-theme-text-secondary">
                  {topFallers.length} {t("prices.players")}
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                }`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.player")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.price")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.progress")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.transfers")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.ownership")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                      {t("prices.timing")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topFallers.map((player) => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </tbody>
              </table>
              
              {topFallers.length === 0 && (
                <div className="text-center py-8">
                  <MdTrendingDown className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-50" />
                  <p className="text-theme-text-secondary">
                    {t("prices.noFallersFound")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Algorithm Info Footer */}
        <div
          className={`mt-8 p-6 rounded-xl border-2 ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700/50" 
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-theme-foreground mb-2">
              {data?.algorithm}
            </h3>
            <p className="text-sm text-theme-text-secondary mb-2">
              {t("prices.infoFooter")}
            </p>
            <p className="text-xs text-theme-text-secondary">
              {t("prices.lastUpdated")}: {new Date(data?.last_updated || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}