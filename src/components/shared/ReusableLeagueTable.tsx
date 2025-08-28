"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Award, Shirt, Gift } from "lucide-react";
import { BsCash } from "react-icons/bs";
import { GiDiamondTrophy } from "react-icons/gi";
import { LuGift } from "react-icons/lu";
import { FaTshirt } from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext";

export interface TablePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  points: number;
  position: number;
  h2h_points?: number | null;
  h2h_stats?: { w: number; d: number; l: number } | null;
}

export interface TablePrize {
  position: number;
  description: string;
  amountKM: number;
  amountEUR: number;
  percentage: number;
}

export interface ReusableLeagueTableProps {
  leagueName: string;
  leagueType: "premium" | "standard" | "h2h" | "h2h2" | "free";
  players: TablePlayer[];
  prizes: TablePrize[];
  totalPrizeFundKM: number;
  totalPrizeFundEUR: number;
  entryFeeKM: number;
  entryFeeEUR: number;
  monthlyPrizeKM?: number;
  monthlyPrizeEUR?: number;
  cupPrizeKM?: number;
  cupPrizeEUR?: number;
  maxParticipants: number;
  className?: string;
}

export default function ReusableLeagueTable({
  leagueName,
  leagueType,
  players,
  prizes,
  totalPrizeFundKM,
  totalPrizeFundEUR,
  entryFeeKM,
  entryFeeEUR,
  className = "",
}: ReusableLeagueTableProps) {
  const { theme } = useTheme();

  const getLeagueColors = (leagueType: string) => {
    switch (leagueType) {
      case "premium":
        return {
          primary: theme === "dark" ? "#fbbf24" : "#f59e0b", // gold
          secondary: theme === "dark" ? "#fcd34d" : "#f7c94b",
          light: theme === "dark" ? "yellow-500/20" : "yellow-100",
          border: theme === "dark" ? "yellow-500/30" : "yellow-300",
          text: theme === "dark" ? "yellow-300" : "yellow-800",
          headerBg:
            theme === "dark"
              ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10"
              : "bg-gradient-to-r from-yellow-100 to-yellow-50",
        };
      case "standard":
        return {
          primary: theme === "dark" ? "#60a5fa" : "#3b82f6", // baby blue
          secondary: theme === "dark" ? "#93c5fd" : "#7dd3fc",
          light: theme === "dark" ? "blue-400/20" : "sky-100",
          border: theme === "dark" ? "blue-400/30" : "sky-300",
          text: theme === "dark" ? "blue-300" : "sky-800",
          headerBg:
            theme === "dark"
              ? "bg-gradient-to-r from-blue-400/20 to-sky-400/10"
              : "bg-gradient-to-r from-sky-100 to-blue-50",
        };
      case "h2h":
      case "h2h2":
        return {
          primary: theme === "dark" ? "#dc2626" : "#b91c1c", // burgundy/red
          secondary: theme === "dark" ? "#ef4444" : "#dc2626",
          light: theme === "dark" ? "red-600/20" : "red-100",
          border: theme === "dark" ? "red-600/30" : "red-400",
          text: theme === "dark" ? "red-400" : "red-800",
          headerBg:
            theme === "dark"
              ? "bg-gradient-to-r from-red-600/20 to-red-700/10"
              : "bg-gradient-to-r from-red-100 to-red-50",
        };
      case "free":
        return {
          primary: theme === "dark" ? "#a855f7" : "#8b5cf6", // purple
          secondary: theme === "dark" ? "#c084fc" : "#a78bfa",
          light: theme === "dark" ? "purple-600/20" : "purple-100",
          border: theme === "dark" ? "purple-600/30" : "purple-400",
          text: theme === "dark" ? "purple-400" : "purple-800",
          headerBg:
            theme === "dark"
              ? "bg-gradient-to-r from-purple-600/20 to-purple-700/10"
              : "bg-gradient-to-r from-purple-100 to-purple-50",
        };
      default:
        return {
          primary: theme === "dark" ? "#fbbf24" : "#f59e0b",
          secondary: theme === "dark" ? "#fcd34d" : "#f7c94b",
          light: theme === "dark" ? "yellow-500/20" : "yellow-100",
          border: theme === "dark" ? "yellow-500/30" : "yellow-300",
          text: theme === "dark" ? "yellow-300" : "yellow-800",
          headerBg:
            theme === "dark"
              ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10"
              : "bg-gradient-to-r from-yellow-100 to-yellow-50",
        };
    }
  };

  const colors = getLeagueColors(leagueType);

  const getPositionIcon = (position: number, leagueType: string) => {
    if (leagueType === "premium") {
      switch (position) {
        case 1:
          return (
            <GiDiamondTrophy className="w-5 h-5" style={{ color: "#FFD700" }} />
          );
        case 2:
        case 3:
          return (
            <Trophy className="w-5 h-5" style={{ color: colors.primary }} />
          );
        case 4:
          return <Shirt className="w-5 h-5 text-blue-500" />;
        case 5:
          return <Gift className="w-5 h-5 text-green-500" />;
        default:
          return null;
      }
    } else {
      // Za Standard ligu - posebna logika
      if (leagueType === "standard") {
        switch (position) {
          case 1:
            return (
              <Trophy className="w-5 h-5" style={{ color: colors.primary }} />
            );
          case 2:
            return <Medal className="w-5 h-5" style={{ color: "#C0C0C0" }} />;
          case 3:
            return <Medal className="w-5 h-5" style={{ color: "#CD7F32" }} />;
          case 4:
          case 5:
          case 6:
          case 7:
            return <BsCash className="w-5 h-5 text-green-500" />;
          case 8:
          case 9:
          case 10:
          case 11:
            return <LuGift className="w-5 h-5 text-green-500" />;
          default:
            return null;
        }
      }

      // Za ostale lige (H2H, H2H2, Free) - prvo pokazuj trofeje/medalje za top 3
      if (leagueType === "free") {
        // Za Free Liga samo dres za prvo mesto
        if (position === 1) {
          return (
            <FaTshirt className="w-5 h-5" style={{ color: colors.primary }} />
          );
        }
        return null;
      }

      // Za H2H lige
      switch (position) {
        case 1:
          return <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} />;
        case 2:
          return <Medal className="w-5 h-5" style={{ color: "#C0C0C0" }} />;
        case 3:
          return <Medal className="w-5 h-5" style={{ color: "#CD7F32" }} />;
        default:
          // Za pozicije 4+ proverava da li ima novčanu nagradu
          const prize = prizes.find((p) => p.position === position);
          if (prize && prize.amountKM > 0) {
            return <BsCash className="w-5 h-5 text-green-500" />;
          }
          return null;
      }
    }
  };

  const getPositionRowStyle = (position: number, leagueType: string) => {
    if (leagueType === "premium") {
      // Premium liga - osenčene prve 5 pozicija
      if (position === 1) {
        return theme === "dark"
          ? "bg-gradient-to-r from-yellow-500/40 to-yellow-600/30 border-yellow-500/50"
          : "bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-500";
      }
      if (position <= 5) {
        return theme === "dark"
          ? `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "/20",
              "/10"
            )} border-${colors.border}`
          : `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "100",
              "50"
            )} border-${colors.border}`;
      }
    } else if (leagueType === "standard") {
      // Standard liga - osenčene prve 11 pozicija
      if (position === 1) {
        return theme === "dark"
          ? "bg-gradient-to-r from-blue-500/40 to-blue-600/30 border-blue-500/50"
          : "bg-gradient-to-r from-blue-200 to-blue-300 border-blue-500";
      }
      if (position <= 11) {
        return theme === "dark"
          ? `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "/20",
              "/10"
            )} border-${colors.border}`
          : `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "100",
              "50"
            )} border-${colors.border}`;
      }
    } else if (leagueType === "h2h" || leagueType === "h2h2") {
      // H2H i H2H2 lige - zlatno pozadina za 1. mjesto, crveno za 2-4
      if (position === 1) {
        return theme === "dark"
          ? "bg-gradient-to-r from-yellow-500/40 to-amber-600/30 border-l-4 border-yellow-500"
          : "bg-gradient-to-r from-yellow-100 to-amber-100 border-l-4 border-yellow-500";
      }
      if (position >= 2 && position <= 4) {
        return theme === "dark"
          ? `bg-gradient-to-r from-red-500/20 to-rose-500/10`
          : `bg-gradient-to-r from-red-50 to-rose-50`;
      }
      if (position <= 11) {
        return theme === "dark"
          ? `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "/20",
              "/10"
            )} border-${colors.border}`
          : `bg-gradient-to-r from-${colors.light} to-${colors.light.replace(
              "100",
              "50"
            )} border-${colors.border}`;
      }
    } else if (leagueType === "free") {
      // Free liga - jednostavno ljubičasto pozadinsko osencavanje
      if (position === 1) {
        return theme === "dark"
          ? "bg-gradient-to-r from-purple-500/40 to-violet-600/30 border-l-4 border-purple-500"
          : "bg-gradient-to-r from-purple-100 to-violet-100 border-l-4 border-purple-500";
      }
    }

    return theme === "dark"
      ? "bg-theme-card hover:bg-theme-accent border-theme-border"
      : "bg-white hover:bg-gray-50 border-gray-200";
  };

  return (
    <motion.div
      className={`w-full max-w-6xl mx-auto ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        className={`mb-6 p-6 rounded-lg border-2 ${colors.headerBg} border-${colors.border}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center text-theme-foreground mb-2">
          {leagueName}
        </h2>
        <p className="text-center text-theme-text-secondary">
          Prikaz rangliste prvih - {players.length} igrača
        </p>
        <div className="text-center text-sm text-theme-text-muted mt-2">
          Nagradni fond: {totalPrizeFundKM} KM / {totalPrizeFundEUR} € |
          Kotizacija: {entryFeeKM} KM / {entryFeeEUR} €
        </div>
      </motion.div>

      {/* Dinamička Nagrade Tabela */}
      <motion.div
        className={`mb-6 p-6 rounded-lg border-2 ${colors.headerBg} border-${colors.border}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-center text-${colors.text} mb-4">
          🏆 Nagrade za prvih {prizes.length} pozicija
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {prizes.map((prize) => {
            const getPrizeIcon = (position: number, leagueType: string) => {
              if (leagueType === "premium") {
                switch (position) {
                  case 1:
                    return (
                      <GiDiamondTrophy
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#FFD700" }}
                      />
                    );
                  case 2:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#C0C0C0" }}
                      />
                    );
                  case 3:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#CD7F32" }}
                      />
                    );
                  case 4:
                    return (
                      <Shirt className="w-4 h-4 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                    );
                  case 5:
                    return (
                      <Gift className="w-4 h-4 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                    );
                  default:
                    return (
                      <Award
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: colors.primary }}
                      />
                    );
                }
              } else if (leagueType === "standard") {
                switch (position) {
                  case 1:
                    return (
                      <Trophy
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: colors.primary }}
                      />
                    );
                  case 2:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#C0C0C0" }}
                      />
                    );
                  case 3:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#CD7F32" }}
                      />
                    );
                  case 4:
                  case 5:
                  case 6:
                  case 7:
                    return (
                      <BsCash className="w-4 h-4 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                    );
                  case 8:
                  case 9:
                  case 10:
                  case 11:
                    return (
                      <LuGift className="w-4 h-4 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                    );
                  default:
                    return null;
                }
              } else if (leagueType === "h2h" || leagueType === "h2h2") {
                switch (position) {
                  case 1:
                    return (
                      <Trophy
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: colors.primary }}
                      />
                    );
                  case 2:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#C0C0C0" }}
                      />
                    );
                  case 3:
                    return (
                      <Medal
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: "#CD7F32" }}
                      />
                    );
                  case 4:
                    return (
                      <BsCash className="w-4 h-4 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                    );
                  default:
                    return (
                      <Award
                        className="w-4 h-4 md:w-6 md:h-6"
                        style={{ color: colors.primary }}
                      />
                    );
                }
              } else if (leagueType === "free") {
                // Za Free Liga samo dres za prvo mesto
                if (position === 1) {
                  return (
                    <FaTshirt
                      className="w-4 h-4 md:w-6 md:h-6"
                      style={{ color: colors.primary }}
                    />
                  );
                }
                return null;
              }
            };

            const getPrizeBackground = (
              position: number,
              leagueType: string
            ) => {
              if (leagueType === "premium") {
                switch (position) {
                  case 1:
                    return "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-800/30 dark:to-amber-800/30 border border-yellow-400 dark:border-yellow-500";
                  case 2:
                    return "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 border border-gray-300 dark:border-gray-600";
                  case 3:
                    return "bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700/40 dark:to-orange-700/40 border border-amber-400 dark:border-amber-600";
                  case 4:
                    return "bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-800/30 dark:to-sky-800/30 border border-blue-300 dark:border-blue-500";
                  case 5:
                    return "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/30 dark:to-emerald-800/30 border border-green-300 dark:border-green-500";
                  default:
                    return `bg-gradient-to-r from-${
                      colors.light
                    } to-${colors.light.replace("100", "50")} border border-${
                      colors.border
                    }`;
                }
              } else if (leagueType === "standard") {
                switch (position) {
                  case 1:
                    return "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-800/30 dark:to-amber-800/30 border border-yellow-400 dark:border-yellow-500";
                  case 2:
                    return "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 border border-gray-300 dark:border-gray-600";
                  case 3:
                    return "bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700/40 dark:to-orange-700/40 border border-amber-400 dark:border-amber-600";
                  default:
                    return `bg-gradient-to-r from-${
                      colors.light
                    } to-${colors.light.replace("100", "50")} border border-${
                      colors.border
                    }`;
                }
              } else {
                switch (position) {
                  case 1:
                    return `bg-gradient-to-r from-${
                      colors.light
                    } to-${colors.light.replace("100", "50")} border border-${
                      colors.border
                    }`;
                  case 2:
                    return "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 border border-gray-300 dark:border-gray-600";
                  case 3:
                    return "bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700/40 dark:to-orange-700/40 border border-amber-400 dark:border-amber-600";
                  default:
                    return `bg-gradient-to-r from-${
                      colors.light
                    } to-${colors.light.replace("100", "50")} border border-${
                      colors.border
                    }`;
                }
              }
            };

            const getPrizeTextColor = (
              position: number,
              leagueType: string
            ) => {
              if (leagueType === "premium") {
                switch (position) {
                  case 1:
                    return "text-yellow-800 dark:text-yellow-300";
                  case 2:
                    return "text-gray-700 dark:text-gray-300";
                  case 3:
                    return "text-amber-800 dark:text-amber-400";
                  case 4:
                    return "text-blue-700 dark:text-blue-300";
                  case 5:
                    return "text-green-700 dark:text-green-300";
                  default:
                    return `text-${colors.text}`;
                }
              } else if (leagueType === "standard") {
                switch (position) {
                  case 1:
                    return "text-yellow-800 dark:text-yellow-300";
                  case 2:
                    return "text-gray-700 dark:text-gray-300";
                  case 3:
                    return "text-amber-800 dark:text-amber-400";
                  default:
                    return `text-${colors.text}`;
                }
              } else {
                switch (position) {
                  case 1:
                    return `text-${colors.text}`;
                  case 2:
                    return "text-gray-700 dark:text-gray-300";
                  case 3:
                    return "text-amber-800 dark:text-amber-400";
                  default:
                    return `text-${colors.text}`;
                }
              }
            };

            const getPrizeDescription = (prize: any) => {
              if (prize.amountKM > 0) {
                return `${prize.amountKM} KM / ${prize.amountEUR} €`;
              }
              if (prize.description && prize.description !== "") {
                return prize.description;
              }
              return "";
            };

            return (
              <div
                key={prize.position}
                className={`flex items-center p-3 rounded-lg ${getPrizeBackground(
                  prize.position,
                  leagueType
                )}`}
              >
                <div className="flex-shrink-0 mr-3">
                  {getPrizeIcon(prize.position, leagueType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm ${getPrizeTextColor(
                      prize.position,
                      leagueType
                    )}`}
                  >
                    {prize.position}. mjesto
                  </div>
                  <div className="text-xs text-theme-text-secondary truncate">
                    {getPrizeDescription(prize)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Table Container */}
      <motion.div
        className={`rounded-lg border-2 overflow-hidden shadow-xl bg-theme-card border-${colors.border}`}
        style={{
          boxShadow:
            theme === "dark"
              ? `0 0 20px ${colors.primary}15`
              : `0 0 20px ${colors.primary}20`,
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Table Header */}
        <div
          className={`${
            leagueType === "h2h" || leagueType === "h2h2"
              ? "grid grid-cols-9 gap-1 md:gap-2 lg:gap-4"
              : "grid grid-cols-12 gap-1 md:gap-2 lg:gap-4"
          } p-2 md:p-4 border-b-2 font-bold text-xs md:text-sm lg:text-base ${
            colors.headerBg
          } border-${colors.border} text-${colors.text}`}
        >
          <div className="col-span-1 text-center">#</div>
          <div
            className={
              leagueType === "h2h" || leagueType === "h2h2"
                ? "col-span-2"
                : "col-span-4 md:col-span-3"
            }
          >
            Ime i Prezime
          </div>
          <div
            className={
              leagueType === "h2h" || leagueType === "h2h2"
                ? "col-span-2"
                : "col-span-4 md:col-span-5"
            }
          >
            Tim
          </div>
          {leagueType === "h2h" || leagueType === "h2h2" ? (
            <>
              <div className="col-span-1 text-center text-xs">W/D/L</div>
              <div className="col-span-2 text-center text-xs">
                Overall Poeni
              </div>
              <div className="col-span-1 text-center text-xs">H2H Poeni</div>
            </>
          ) : (
            <div className="col-span-3 text-center">Poeni</div>
          )}
        </div>

        {/* Table Body */}
        <div className="max-h-96 md:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {players.map((player, index) => {
            return (
              <motion.div
                key={player.id}
                className={`${
                  leagueType === "h2h" || leagueType === "h2h2"
                    ? "grid grid-cols-9 gap-1 md:gap-2 lg:gap-4"
                    : "grid grid-cols-12 gap-1 md:gap-2 lg:gap-4"
                } p-2 md:p-4 border-b transition-all duration-300 hover:scale-[1.01] ${getPositionRowStyle(
                  player.position,
                  leagueType
                )}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{
                  scale: 1.01,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Position */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center space-x-0.5 md:space-x-2">
                    {getPositionIcon(player.position, leagueType)}
                    <span className="font-bold text-theme-foreground pr-1 md:pr-0 text-xs md:text-sm lg:text-lg">
                      {player.position}
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div
                  className={
                    leagueType === "h2h" || leagueType === "h2h2"
                      ? "col-span-2 flex items-center"
                      : "col-span-4 md:col-span-3 flex items-center"
                  }
                >
                  <span className="font-semibold text-theme-foreground truncate text-xs md:text-sm lg:text-base">
                    {player.firstName} {player.lastName}
                  </span>
                </div>

                {/* Team Name */}
                <div
                  className={
                    leagueType === "h2h" || leagueType === "h2h2"
                      ? "col-span-2 flex items-center"
                      : "col-span-4 md:col-span-5 flex items-center"
                  }
                >
                  <span className="text-theme-text-secondary truncate text-xs md:text-sm lg:text-base">
                    {player.teamName}
                  </span>
                </div>

                {/* Points */}
                {leagueType === "h2h" || leagueType === "h2h2" ? (
                  <>
                    {/* W/D/L */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-xs text-theme-foreground">
                        {player.h2h_stats
                          ? `${player.h2h_stats.w}/${player.h2h_stats.d}/${player.h2h_stats.l}`
                          : "-"}
                      </span>
                    </div>

                    {/* Overall Points */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="font-semibold text-xs md:text-sm text-theme-foreground">
                        {player.points}
                      </span>
                    </div>

                    {/* H2H Points */}
                    <div className="col-span-1 flex items-center justify-center">
                      <motion.span
                        className={`font-bold text-sm md:text-lg px-1 md:px-2 py-1 md:py-2 rounded-lg ${
                          player.position === 1
                            ? `text-${colors.text}`
                            : player.position <= 3
                            ? theme === "dark"
                              ? "bg-gray-500/20 text-gray-300"
                              : "bg-gray-200 text-gray-700"
                            : "text-theme-foreground"
                        }`}
                        style={
                          player.position === 1
                            ? {
                                backgroundColor:
                                  theme === "dark"
                                    ? `${colors.primary}30`
                                    : `${colors.primary}40`,
                                color: colors.primary,
                              }
                            : {}
                        }
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {player.h2h_points || 0}
                      </motion.span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 flex items-center justify-center">
                    <motion.span
                      className={`font-bold text-sm md:text-lg px-2 md:px-4 py-1 md:py-2 rounded-lg ${
                        leagueType === "premium" && player.position === 1
                          ? "text-yellow-800"
                          : leagueType === "premium" && player.position <= 5
                          ? `text-${colors.text}`
                          : player.position === 1
                          ? `text-${colors.text}`
                          : player.position <= 3
                          ? theme === "dark"
                            ? "bg-gray-500/20 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                          : "text-theme-foreground"
                      }`}
                      style={
                        leagueType === "premium" && player.position === 1
                          ? {
                              backgroundColor: "#FFD700",
                              color: "#B8860B",
                              boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
                            }
                          : leagueType === "premium" && player.position <= 5
                          ? {
                              backgroundColor:
                                theme === "dark"
                                  ? `${colors.primary}30`
                                  : `${colors.primary}40`,
                              color: colors.primary,
                            }
                          : player.position === 1
                          ? {
                              backgroundColor:
                                theme === "dark"
                                  ? `${colors.primary}30`
                                  : `${colors.primary}40`,
                              color: colors.primary,
                            }
                          : {}
                      }
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {player.points}
                    </motion.span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`p-2 md:p-4 text-center text-xs md:text-sm border-t-2 bg-theme-secondary border-${colors.border} text-theme-text-muted`}
        >
          Poslednje ažurirano: {new Date().toLocaleDateString("sr-RS")}
        </div>
      </motion.div>
    </motion.div>
  );
}
