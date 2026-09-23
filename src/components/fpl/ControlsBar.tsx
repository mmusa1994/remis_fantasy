"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2 } from "lucide-react";
import TeamSearchInput from "./TeamSearchInput";

interface ControlsBarProps {
  managerId: number | null;
  gameweek: number;
  isPolling: boolean;
  onManagerIdChange: (id: number) => void;
  onGameweekChange: (gw: number) => void;
  onLoadTeam: (managerId?: number, gameweek?: number) => void; // Optional params
  onStartPolling: () => void;
  onStopPolling: () => void;
  loading: boolean;
}

const inputClass =
  "w-full rounded-xl border border-theme-border bg-theme-card-secondary px-3.5 py-2.5 text-sm font-medium tabular-nums text-theme-heading-primary placeholder:text-theme-text-muted transition-colors focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function ControlsBar({
  managerId,
  gameweek,
  onManagerIdChange,
  onGameweekChange,
  onLoadTeam,
  loading,
}: ControlsBarProps) {
  const { t } = useTranslation("fpl");
  const { data: session, status } = useSession();

  const [localManagerId, setLocalManagerId] = useState(
    managerId ? String(managerId) : ""
  );
  const [isLoadingManagerId, setIsLoadingManagerId] = useState(false);
  // Follows the live gameweek the page resolved from FPL until the user types
  const [gameweekInput, setGameweekInput] = useState<string | null>(null);
  const localGameweek = gameweekInput ?? (gameweek ? String(gameweek) : "");

  // Manager ID from localStorage, or from the account for signed-in users
  useEffect(() => {
    const loadManagerId = async () => {
      if (typeof window === "undefined") return;

      const storedManagerId = localStorage.getItem("fpl-manager-id");
      if (storedManagerId) {
        setLocalManagerId(storedManagerId);
        return;
      }

      if (status === "authenticated" && session?.user) {
        setIsLoadingManagerId(true);
        try {
          const response = await fetch("/api/user/manager-id");
          if (response.ok) {
            const data = await response.json();
            if (data.managerId) {
              setLocalManagerId(String(data.managerId));
              localStorage.setItem("fpl-manager-id", String(data.managerId));
            }
          }
        } catch (error) {
          console.error("❌ Failed to fetch manager ID from database:", error);
        } finally {
          setIsLoadingManagerId(false);
        }
      }
    };

    loadManagerId();
  }, [status, session]);

  const managerIdNum = parseInt(localManagerId, 10);
  const gameweekNum = parseInt(localGameweek, 10);
  const canLoad =
    !loading &&
    !isNaN(managerIdNum) &&
    managerIdNum > 0 &&
    !isNaN(gameweekNum) &&
    gameweekNum >= 1 &&
    gameweekNum <= 38;

  const handleManagerIdChange = (value: string) => {
    setLocalManagerId(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("fpl-manager-id", value);
    }
  };

  const handleLoadTeam = () => {
    if (!canLoad) return;
    onManagerIdChange(managerIdNum);
    onGameweekChange(gameweekNum);
    onLoadTeam(managerIdNum, gameweekNum);
  };

  const handleTeamSearchFound = (foundManagerId: number) => {
    const managerIdStr = foundManagerId.toString();
    setLocalManagerId(managerIdStr);
    if (typeof window !== "undefined") {
      localStorage.setItem("fpl-manager-id", managerIdStr);
    }
    onManagerIdChange(foundManagerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleLoadTeam();
    }
  };

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm sm:p-5">
      <label className="mb-1.5 block text-xs font-medium text-theme-text-secondary">
        {t("fplLive.ui.shell.searchLabel", "Find your team")}
      </label>
      <TeamSearchInput
        onManagerIdFound={handleTeamSearchFound}
        placeholder={t("fplLive.search.searchInputPlaceholder")}
      />

      <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-theme-text-muted">
        <span className="h-px flex-1 bg-theme-border" />
        {t("fplLive.ui.shell.or", "or")}
        <span className="h-px flex-1 bg-theme-border" />
      </div>

      <div className="flex gap-2.5">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="manager-id-input"
            className="mb-1.5 block text-xs font-medium text-theme-text-secondary"
          >
            {t("fplLive.managerId")}
          </label>
          <div className="relative">
            <input
              id="manager-id-input"
              type="number"
              inputMode="numeric"
              value={localManagerId}
              onChange={(e) => handleManagerIdChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoadingManagerId}
              className={inputClass}
              placeholder="133790"
            />
            {isLoadingManagerId && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-theme-text-muted" />
            )}
          </div>
        </div>

        <div className="w-20 shrink-0">
          <label
            htmlFor="gameweek-input"
            className="mb-1.5 block text-xs font-medium text-theme-text-secondary"
          >
            GW
          </label>
          <input
            id="gameweek-input"
            type="number"
            min="1"
            max="38"
            step="1"
            inputMode="numeric"
            value={localGameweek}
            onChange={(e) => setGameweekInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${inputClass} text-center`}
            placeholder="1-38"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLoadTeam}
        disabled={!canLoad}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-theme-foreground px-4 py-3 text-sm font-semibold text-theme-background shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("fplLive.loading")}
          </>
        ) : (
          <>
            {t("fplLive.loadTeam")}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
