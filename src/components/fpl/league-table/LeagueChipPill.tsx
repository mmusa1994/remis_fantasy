import type { FPLActiveChip } from "@/types/fpl";

interface LeagueChipPillProps {
  chip: FPLActiveChip;
  size?: "xs" | "sm";
}

const CHIP_LABELS: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "TC",
  bboost: "BB",
  freehit: "FH",
  wildcard: "WC",
};

const CHIP_COLORS: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "bg-purple-500 text-white",
  bboost: "bg-orange-500 text-white",
  freehit: "bg-blue-500 text-white",
  wildcard: "bg-green-500 text-white",
};

const CHIP_FULL_NAME: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
};

export default function LeagueChipPill({
  chip,
  size = "xs",
}: LeagueChipPillProps) {
  if (!chip) {
    return (
      <span
        className={`${
          size === "xs" ? "text-xs" : "text-sm"
        } text-theme-text-secondary`}
        aria-label="No chip"
      >
        —
      </span>
    );
  }
  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5"
      : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wide ${CHIP_COLORS[chip]} ${sizeClasses}`}
      title={CHIP_FULL_NAME[chip]}
    >
      {CHIP_LABELS[chip]}
    </span>
  );
}
