"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext";
import LoadingCard from "@/components/shared/LoadingCard";

interface ChampionsLeaguePlayer {
  id: number;
  rank: number;
  team_name: string;
  user_name: string;
  avatar_url: string;
  member_number: number;
  points: number;
  md1_points: number;
  is_winner: boolean;
  is_loser: boolean;
  is_tie: boolean;
}

const PRIZE_INFO = {
  total_km: 750, // 15 * 50 KM
  total_eur: 385, // ~385€
  first_km: 375, // 50% = 375KM
  first_eur: 193, // ~193€
  second_km: 225, // 30% = 225KM
  second_eur: 115, // ~115€
  third_km: 150, // 20% = 150KM
  third_eur: 77, // ~77€
};

export default function ChampionsLeagueTable() {
  const [players, setPlayers] = useState<ChampionsLeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const response = await fetch("/api/champions-league/table");
      if (!response.ok) {
        throw new Error("Failed to fetch table data");
      }
      const data = await response.json();
      setPlayers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <FaMedal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <FaAward className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-l-4 border-yellow-500 shadow-lg shadow-yellow-500/20";
      case 2:
        return "bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/40 dark:to-gray-800/40 border-l-4 border-slate-400 shadow-lg shadow-slate-400/20";
      case 3:
        return "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-l-4 border-orange-500 shadow-lg shadow-orange-500/20";
      default:
        return "bg-theme-card border-theme-border hover:bg-theme-card-secondary/30";
    }
  };

  const getPrizeAmount = (rank: number) => {
    switch (rank) {
      case 1:
        return `${PRIZE_INFO.first_km}KM/${PRIZE_INFO.first_eur}€`;
      case 2:
        return `${PRIZE_INFO.second_km}KM/${PRIZE_INFO.second_eur}€`;
      case 3:
        return `${PRIZE_INFO.third_km}KM/${PRIZE_INFO.third_eur}€`;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingCard title="Učitavanje Champions League tabele..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="text-red-600 dark:text-red-400">
            <FaTrophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Greška prilikom učitavanja tabele
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prize Pool Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              REMIS Champions League 2025/26
            </h2>
            <p className="text-blue-100">Ukupan nagradni fond</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black">
              {PRIZE_INFO.total_km}KM / {PRIZE_INFO.total_eur}€
            </div>
            <div className="text-blue-100 text-sm">48 učesnika</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaTrophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="font-bold text-lg">
              {PRIZE_INFO.first_km}KM / {PRIZE_INFO.first_eur}€
            </div>
            <div className="text-blue-100 text-sm">1. mjesto (50%)</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaMedal className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-bold text-lg">
              {PRIZE_INFO.second_km}KM / {PRIZE_INFO.second_eur}€
            </div>
            <div className="text-blue-100 text-sm">2. mjesto (30%)</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaAward className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="font-bold text-lg">
              {PRIZE_INFO.third_km}KM / {PRIZE_INFO.third_eur}€
            </div>
            <div className="text-blue-100 text-sm">3. mjesto (20%)</div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-theme-card rounded-xl border border-theme-border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Header */}
        <div className="bg-theme-card-secondary border-b border-theme-border p-4">
          <h3 className="text-xl font-bold text-theme-foreground flex items-center gap-2">
            <FaTrophy className="w-5 h-5 text-yellow-500" />
            REMIS CL Paid Liga
          </h3>
          <p className="text-theme-text-secondary text-sm mt-1">
            Trenutno stanje nakon MD1
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="bg-theme-card-secondary border-b border-theme-border">
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-3 text-sm font-bold text-theme-text-secondary uppercase">
              <div className="col-span-1">Rang</div>
              <div className="col-span-6">Igrač</div>
              <div className="col-span-2 text-center">MD1</div>
              <div className="col-span-2 text-center">Ukupno</div>
              <div className="col-span-1 text-center">Nagrada</div>
            </div>
          </div>

          <div className="divide-y divide-theme-border">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                className={`p-6 transition-all duration-200 hover:bg-theme-card-secondary/50 ${getRankBackground(
                  player.rank
                )}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={
                  player.rank <= 3 ? { scale: 1.02, y: -2 } : { scale: 1.01 }
                }
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                          player.rank === 1
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30"
                            : player.rank === 2
                            ? "bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-lg shadow-slate-500/30"
                            : player.rank === 3
                            ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                            : "bg-theme-card-secondary text-theme-foreground border border-theme-border"
                        }`}
                      >
                        {player.rank}
                      </div>
                      {getRankIcon(player.rank)}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="col-span-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={player.avatar_url}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-theme-background rounded-full px-1.5 py-0.5 text-xs font-bold text-theme-foreground border border-theme-border">
                          {player.member_number}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-theme-foreground">
                          {player.team_name}
                        </div>
                        <div className="text-sm text-theme-text-secondary">
                          {player.user_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MD1 Points */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-lg text-theme-foreground">
                      {player.md1_points}
                    </span>
                  </div>

                  {/* Total Points */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">
                      {player.points}
                    </span>
                  </div>

                  {/* Prize */}
                  <div className="col-span-1 text-center">
                    {getPrizeAmount(player.rank) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {getPrizeAmount(player.rank)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Table */}
        <div className="md:hidden">
          <div className="divide-y divide-theme-border">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                className={`p-4 ${getRankBackground(player.rank)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={
                  player.rank <= 3 ? { scale: 1.02, y: -2 } : { scale: 1.01 }
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg ${
                        player.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30"
                          : player.rank === 2
                          ? "bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-lg shadow-slate-500/30"
                          : player.rank === 3
                          ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "bg-theme-card-secondary text-theme-foreground border border-theme-border"
                      }`}
                    >
                      {player.rank}
                    </div>
                    {getRankIcon(player.rank)}
                  </div>
                  {getPrizeAmount(player.rank) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {getPrizeAmount(player.rank)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={player.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-theme-background rounded-full px-1 py-0.5 text-xs font-bold text-theme-foreground border border-theme-border">
                      {player.member_number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-theme-foreground">
                      {player.team_name}
                    </div>
                    <div className="text-sm text-theme-text-secondary">
                      {player.user_name}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-theme-text-secondary">MD1: </span>
                    <span className="font-bold text-theme-foreground">
                      {player.md1_points}
                    </span>
                  </div>
                  <div>
                    <span className="text-theme-text-secondary">Ukupno: </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {player.points}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        className="bg-theme-card rounded-lg border border-theme-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="text-center text-sm text-theme-text-secondary">
          <p>
            Podaci se ažuriraju nakon svakog Matchday-a. Ukupno 48 učesnika u
            ligi.
          </p>
          <p className="mt-2">
            Nagradni fond: {PRIZE_INFO.total_km}KM / {PRIZE_INFO.total_eur}€ |
            1. mjesto: {PRIZE_INFO.first_km}KM/{PRIZE_INFO.first_eur}€ | 2.
            mjesto: {PRIZE_INFO.second_km}KM/{PRIZE_INFO.second_eur}€ | 3.
            mjesto: {PRIZE_INFO.third_km}KM/{PRIZE_INFO.third_eur}€
          </p>
        </div>
      </motion.div>
    </div>
  );
}
