"use client";

/**
 * Shared building blocks for the FPL Live dashboard tabs.
 *
 * Design rules (keep every tab consistent):
 * - Surfaces are neutral theme tokens; no rainbow numbers or gradient cards.
 * - One accent (violet) for active states and bars; emerald/rose only for
 *   up/down meaning; amber only for the captain badge.
 * - Every player is shown with his club shirt (PlayerJersey), never initials
 *   or coloured dots.
 * - Numbers use tabular-nums so columns line up.
 */

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import TeamJersey from "../TeamJersey";
import { getPlayerTeamColors, getTeamColors } from "@/lib/team-colors";

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export const formatNumber = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "—";

export const formatRank = (rank: number | null | undefined) =>
  typeof rank === "number" && rank > 0 ? `#${rank.toLocaleString("en-US")}` : "—";

/** 678432 → "678k", 1_250_000 → "1.25M" */
export const formatCompact = (n: number | null | undefined) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

/**
 * Locale for dates/times. Browsers ship no Bosnian ("bs") calendar data —
 * Chrome renders months as "M10" — so Bosnian uses sr-Latn-BA, which has the
 * same ijekavian names (ponedjeljak, srijeda, oktobar).
 */
export const dateLocale = (lang?: string | null) =>
  lang?.startsWith("bs") ? "sr-Latn-BA" : "en-GB";

/** FPL prices are in tenths: 58 → "£5.8m" */
export const formatPrice = (tenths: number | null | undefined) =>
  typeof tenths === "number" ? `£${(tenths / 10).toFixed(1)}m` : "—";

export const POSITION_SHORT: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Remove body padding — for full-bleed lists with row dividers. */
  flush?: boolean;
  bodyClassName?: string;
}

/** The standard card every tab section sits in. */
export function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  flush = false,
  bodyClassName,
}: PanelProps) {
  const hasHeader = title || subtitle || action;
  return (
    <section
      className={cx(
        "rounded-2xl border border-theme-border bg-theme-card overflow-hidden",
        className
      )}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-theme-card-secondary text-theme-text-secondary [&_svg]:h-3.5 [&_svg]:w-3.5">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-theme-heading-primary">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs leading-snug text-theme-text-muted">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cx(!flush && "px-4 pb-4 sm:px-5 sm:pb-5", !hasHeader && !flush && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Small uppercase group label inside a panel ("Starting XI", "Bench"). */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-2 px-4 pt-3 pb-1.5 sm:px-5",
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
        {children}
      </span>
      {action}
    </div>
  );
}

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  trend?: number | null;
  className?: string;
}

/** Label + big number tile. Lay several out in a grid. */
export function StatTile({ label, value, hint, trend, className }: StatTileProps) {
  return (
    <div
      className={cx(
        "min-w-0 rounded-xl border border-theme-border bg-theme-card-secondary px-3 py-2.5",
        className
      )}
    >
      <div className="truncate text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="truncate text-lg font-semibold leading-none tabular-nums text-theme-heading-primary">
          {value}
        </span>
        {typeof trend === "number" && trend !== 0 && <Delta value={trend} className="text-[11px]" />}
      </div>
      {hint && <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-theme-text-muted">{hint}</div>}
    </div>
  );
}

/** Row container for lists: `<div className="divide-y divide-theme-border">` of these. */
export function ListRow({
  children,
  onClick,
  highlighted = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
  className?: string;
}) {
  const classes = cx(
    "flex w-full items-center gap-3 px-4 py-2.5 text-left sm:px-5",
    onClick && "transition-colors hover:bg-theme-card-secondary active:bg-theme-card-secondary",
    highlighted && "bg-violet-500/[0.06]",
    className
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  ) : (
    <div className={classes}>{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Players                                                             */
/* ------------------------------------------------------------------ */

const JERSEY_SIZE = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
} as const;

export type JerseySize = keyof typeof JERSEY_SIZE;

interface PlayerJerseyProps {
  /** A bootstrap/FPL player (uses team_code, falls back to team id). */
  player?: { team?: number; team_code?: number; element_type?: number } | null;
  /** Or just the club: season team id, or short name ("LIV"). */
  team?: number | string | null;
  isGoalkeeper?: boolean;
  size?: JerseySize;
  className?: string;
}

/** Club home shirt for a player or a team. */
export function PlayerJersey({
  player,
  team,
  isGoalkeeper,
  size = "md",
  className,
}: PlayerJerseyProps) {
  const kit = player
    ? getPlayerTeamColors(player)
    : getTeamColors(team ?? "");
  const gk = isGoalkeeper ?? player?.element_type === 1;
  return (
    <TeamJersey
      kit={kit}
      isGoalkeeper={gk}
      title={kit.name}
      className={cx(
        JERSEY_SIZE[size],
        "shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        className
      )}
    />
  );
}

/** Neutral GK / DEF / MID / FWD tag. */
export function PosTag({ type, className }: { type?: number | string | null; className?: string }) {
  const label = typeof type === "number" ? POSITION_SHORT[type] : type;
  if (!label) return null;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-theme-text-muted ring-1 ring-inset ring-theme-border",
        className
      )}
    >
      {label}
    </span>
  );
}

/** Captain / vice / triple-captain marker. */
export function RoleBadge({ role, className }: { role: "C" | "V" | "TC"; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
        role === "V"
          ? "bg-theme-card-secondary text-theme-text-secondary ring-1 ring-inset ring-theme-border-strong"
          : "bg-amber-400 text-slate-950",
        className
      )}
    >
      {role}
    </span>
  );
}

interface PlayerCellProps {
  name: ReactNode;
  player?: PlayerJerseyProps["player"];
  team?: PlayerJerseyProps["team"];
  isGoalkeeper?: boolean;
  /** Second line, e.g. "LIV · £7.2m". */
  meta?: ReactNode;
  /** Inline badges after the name (RoleBadge, chips...). */
  badges?: ReactNode;
  size?: JerseySize;
  className?: string;
}

/** Shirt + name + meta line. The standard way to show a player in a row. */
export function PlayerCell({
  name,
  player,
  team,
  isGoalkeeper,
  meta,
  badges,
  size = "md",
  className,
}: PlayerCellProps) {
  return (
    <div className={cx("flex min-w-0 flex-1 items-center gap-2.5", className)}>
      <PlayerJersey player={player} team={team} isGoalkeeper={isGoalkeeper} size={size} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-theme-heading-primary">{name}</span>
          {badges}
        </div>
        {meta && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[11px] text-theme-text-muted">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small indicators                                                    */
/* ------------------------------------------------------------------ */

/** Signed number, emerald up / rose down. `invert` for "lower is better". */
export function Delta({
  value,
  suffix = "",
  invert = false,
  showZero = false,
  className,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  showZero?: boolean;
  className?: string;
}) {
  if (!value && !showZero) return null;
  const good = invert ? value < 0 : value > 0;
  const tone = value === 0 ? "text-theme-text-muted" : good ? "text-emerald-500" : "text-rose-500";
  const arrow = value === 0 ? "" : value > 0 ? "▲" : "▼";
  return (
    <span className={cx("inline-flex items-center gap-0.5 font-semibold tabular-nums", tone, className)}>
      {arrow && <span className="text-[0.7em] leading-none">{arrow}</span>}
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {Math.abs(value).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/** Thin progress bar. */
export function Bar({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: "accent" | "positive" | "negative" | "neutral";
  className?: string;
}) {
  const fill = {
    accent: "bg-violet-500",
    positive: "bg-emerald-500",
    negative: "bg-rose-500",
    neutral: "bg-theme-text-muted",
  }[tone];
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-theme-card-secondary", className)}>
      <div
        className={cx("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Neutral metadata pill ("EO 15%", "FT", "2 transfers"). */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "positive" | "negative" | "warning";
  className?: string;
}) {
  const tones = {
    neutral: "bg-theme-card-secondary text-theme-text-secondary",
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    negative: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight",
        tones,
        className
      )}
    >
      {children}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cx("relative inline-flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/** Pill filter group. Scrolls sideways on narrow screens instead of wrapping. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("-mx-1 overflow-x-auto px-1 scrollbar-hide", className)}>
      <div className="inline-flex gap-0.5 rounded-xl border border-theme-border bg-theme-card-secondary p-0.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cx(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-theme-card text-theme-heading-primary shadow-sm ring-1 ring-theme-border dark:bg-theme-border-strong dark:ring-transparent"
                  : "text-theme-text-muted hover:text-theme-text-secondary"
              )}
            >
              {option.label}
              {typeof option.count === "number" && (
                <span className="tabular-nums text-[10px] text-theme-text-muted">{option.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Quiet secondary button (refresh, details...). */
export function GhostButton({
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-2.5 py-1.5 text-xs font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-theme-card-secondary text-theme-text-muted [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium text-theme-heading-secondary">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-theme-text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx("divide-y divide-theme-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-theme-card-secondary" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-theme-card-secondary" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-theme-card-secondary" />
          </div>
          <div className="h-4 w-8 animate-pulse rounded bg-theme-card-secondary" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet                                                               */
/* ------------------------------------------------------------------ */

/**
 * Detail sheet: slides up from the bottom on phones (drag the handle down to
 * close), opens as a right-side panel from `sm` up. Opaque, above the nav bars.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const dragControls = useDragControls();
  const { t } = useTranslation("fpl");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm dark:bg-black/70"
            onClick={onClose}
          />
          <motion.aside
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-theme-border bg-theme-card pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:max-h-none sm:w-[440px] sm:rounded-2xl sm:border"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="sticky top-0 z-10 flex cursor-grab touch-none justify-center bg-theme-card pb-2 pt-2.5 backdrop-blur active:cursor-grabbing sm:hidden"
            >
              <span className="h-1 w-10 rounded-full bg-theme-border-strong" />
            </div>
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-1 sm:px-5 sm:pt-5">
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-base font-semibold leading-tight text-theme-heading-primary">{title}</h3>
                  )}
                  {subtitle && <p className="mt-0.5 text-xs text-theme-text-muted">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("fplLive.ui.shell.close", "Close")}
                  className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-theme-text-muted hover:bg-theme-card-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="px-4 pb-5 sm:px-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
