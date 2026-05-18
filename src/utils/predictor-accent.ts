// =============================================================
// Predictor accent classes
// -------------------------------------------------------------
// Tournament admin picks an accent color (amber / gold / blue /
// purple / red / green). Every UI surface on the predictor page
// must visually echo that pick — banners, score boxes, hover
// states, winner glows, podium gradients, sign-in callouts, etc.
//
// Tailwind's JIT can't see classes built from template literals,
// so each color's full class set is spelled out statically here.
// Helpers below return a typed bundle the page uses everywhere.
// =============================================================

import type { AccentColor } from "@/types/predictor";

export type AccentName = AccentColor | string;

export type AccentClasses = {
  // Legacy 4 — drop-in compatible with the older ACCENT_* maps.
  text: string;          // text-X-500 dark:text-X-400
  bg: string;            // bg-X-500 hover:bg-X-400
  border: string;        // border-l-X-500
  ring: string;          // ring-X-500

  // Text variants
  textOn: string;        // black/white text used on top of bg
  textSolid: string;     // text-X-500
  textBright: string;    // text-X-400
  textDeep: string;      // text-X-600
  textDeeper: string;    // text-X-700
  textBrighter: string;  // text-X-300

  // Background variants
  bgSolid: string;       // bg-X-500
  bgPale: string;        // bg-X-50
  bgPaleStrong: string;  // bg-X-100
  bgPaleVeryStrong: string; // bg-X-200/80
  bg10: string;          // bg-X-500/10
  bg15: string;          // bg-X-500/15
  bg20: string;          // bg-X-500/20
  bgDarkDeep: string;    // bg-X-950/40 (dark mode block)

  // Border variants
  border200: string;     // border-X-200
  border300: string;     // border-X-300
  border500: string;     // border-X-500
  border500_30: string;  // border-X-500/30
  border500_40: string;  // border-X-500/40
  border500_60: string;  // border-X-500/60
  border500_80: string;  // border-X-500/80
  border800: string;     // border-X-800/60

  // Ring variants
  ring500: string;       // ring-X-500
  ring500_40: string;    // ring-X-500/40
  ring500_50: string;    // ring-X-500/50
  ring500_60: string;    // ring-X-500/60
  ring400: string;       // ring-X-400
  ring400_60: string;    // ring-X-400/60
  ring400_70: string;    // ring-X-400/70

  // Hover / focus variants
  hoverBorder500_60: string; // hover:border-X-500/60
  hoverTextLight: string;    // hover:text-X-700
  hoverTextDark: string;     // hover:text-X-300
  focusBorder500: string;    // focus:border-X-500

  // Shadow class names (Tailwind colored shadows)
  shadow500_10: string;  // shadow-X-500/10
  shadow500_15: string;  // shadow-X-500/15
  shadow500_20: string;  // shadow-X-500/20
  shadow500_30: string;  // shadow-X-500/30

  // Gradients — pre-baked Tailwind class combos
  gradMiddleDark: string;    // from-X-500/15 via-X-500/8 to-transparent
  gradLightCard: string;     // from-X-50 via-white to-white
  gradRowDark: string;       // from-X-500/15 via-X-500/5 to-transparent
  gradRowLight: string;      // from-X-50 via-X-50/40 to-transparent
  gradStatDark: string;      // from-X-500/15 via-X-500/5 to-transparent
  gradStatLight: string;     // from-X-50 via-white to-white
  gradPodiumDark: string;    // from-X-500/30 to-X-500/10
  gradPodiumLight: string;   // from-X-100 to-X-50
  gradAvatarMe: string;      // from-X-400 to-X-600

  // Decorative tint text colors
  text500_10: string;    // text-X-500/10
  text400_15: string;    // text-X-400/15

  // Compound (light + dark) pairs - Tailwind needs static `dark:`
  // prefixes, so common patterns are packaged here.
  textPair600_300: string;     // text-X-600 dark:text-X-300
  textPair600_400: string;     // text-X-600 dark:text-X-400
  textPair700_400: string;     // text-X-700 dark:text-X-400
  textPair500_400: string;     // text-X-500 dark:text-X-400 (same as `text`)
  bgPaleStrongPair: string;    // light bg-X-200/80 vs dark bg-X-500/20 form combos
  bgGhostInk: string;          // bg-X-500/20 text-X-600 dark:text-X-300
  bgGhostLight: string;        // bg-X-200/80 text-X-900 (light mode 'me' chip)
  bgGhostDark: string;         // bg-X-500/20 text-X-300 (dark mode 'me' chip)

  // Raw RGB triple ("R G B") for inline <style jsx> / arbitrary CSS
  rgb: string;
};

// -------------------------------------------------------------
// Per-color class bundles. Each entry uses fully-spelled-out
// Tailwind classes so the JIT compiler can detect them.
// -------------------------------------------------------------

const AMBER: AccentClasses = {
  text: "text-amber-500 dark:text-amber-400",
  bg: "bg-amber-500 hover:bg-amber-400",
  border: "border-l-amber-500",
  ring: "ring-amber-500",
  textOn: "text-black",
  textSolid: "text-amber-500",
  textBright: "text-amber-400",
  textDeep: "text-amber-600",
  textDeeper: "text-amber-700",
  textBrighter: "text-amber-300",
  bgSolid: "bg-amber-500",
  bgPale: "bg-amber-50",
  bgPaleStrong: "bg-amber-100",
  bgPaleVeryStrong: "bg-amber-200/80",
  bg10: "bg-amber-500/10",
  bg15: "bg-amber-500/15",
  bg20: "bg-amber-500/20",
  bgDarkDeep: "bg-amber-950/40",
  border200: "border-amber-200",
  border300: "border-amber-300",
  border500: "border-amber-500",
  border500_30: "border-amber-500/30",
  border500_40: "border-amber-500/40",
  border500_60: "border-amber-500/60",
  border500_80: "border-amber-500/80",
  border800: "border-amber-800/60",
  ring500: "ring-amber-500",
  ring500_40: "ring-amber-500/40",
  ring500_50: "ring-amber-500/50",
  ring500_60: "ring-amber-500/60",
  ring400: "ring-amber-400",
  ring400_60: "ring-amber-400/60",
  ring400_70: "ring-amber-400/70",
  hoverBorder500_60: "hover:border-amber-500/60",
  hoverTextLight: "hover:text-amber-700",
  hoverTextDark: "hover:text-amber-300",
  focusBorder500: "focus:border-amber-500",
  shadow500_10: "shadow-amber-500/10",
  shadow500_15: "shadow-amber-500/15",
  shadow500_20: "shadow-amber-500/20",
  shadow500_30: "shadow-amber-500/30",
  gradMiddleDark: "from-amber-500/15 via-amber-500/8 to-transparent",
  gradLightCard: "from-amber-50 via-white to-white",
  gradRowDark: "from-amber-500/15 via-amber-500/5 to-transparent",
  gradRowLight: "from-amber-50 via-amber-50/40 to-transparent",
  gradStatDark: "from-amber-500/15 via-amber-500/5 to-transparent",
  gradStatLight: "from-amber-50 via-white to-white",
  gradPodiumDark: "from-amber-500/30 to-amber-500/10",
  gradPodiumLight: "from-amber-100 to-amber-50",
  gradAvatarMe: "from-amber-400 to-amber-600",
  text500_10: "text-amber-500/10",
  text400_15: "text-amber-400/15",
  textPair600_300: "text-amber-600 dark:text-amber-300",
  textPair600_400: "text-amber-600 dark:text-amber-400",
  textPair700_400: "text-amber-700 dark:text-amber-400",
  textPair500_400: "text-amber-500 dark:text-amber-400",
  bgPaleStrongPair: "bg-amber-200/80 dark:bg-amber-500/20",
  bgGhostInk: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  bgGhostLight: "bg-amber-200/80 text-amber-900",
  bgGhostDark: "bg-amber-500/20 text-amber-300",
  rgb: "245 158 11",
};

const BLUE: AccentClasses = {
  text: "text-blue-600 dark:text-blue-400",
  bg: "bg-blue-600 hover:bg-blue-500",
  border: "border-l-blue-600",
  ring: "ring-blue-600",
  textOn: "text-white",
  textSolid: "text-blue-500",
  textBright: "text-blue-400",
  textDeep: "text-blue-600",
  textDeeper: "text-blue-700",
  textBrighter: "text-blue-300",
  bgSolid: "bg-blue-500",
  bgPale: "bg-blue-50",
  bgPaleStrong: "bg-blue-100",
  bgPaleVeryStrong: "bg-blue-200/80",
  bg10: "bg-blue-500/10",
  bg15: "bg-blue-500/15",
  bg20: "bg-blue-500/20",
  bgDarkDeep: "bg-blue-950/40",
  border200: "border-blue-200",
  border300: "border-blue-300",
  border500: "border-blue-500",
  border500_30: "border-blue-500/30",
  border500_40: "border-blue-500/40",
  border500_60: "border-blue-500/60",
  border500_80: "border-blue-500/80",
  border800: "border-blue-800/60",
  ring500: "ring-blue-500",
  ring500_40: "ring-blue-500/40",
  ring500_50: "ring-blue-500/50",
  ring500_60: "ring-blue-500/60",
  ring400: "ring-blue-400",
  ring400_60: "ring-blue-400/60",
  ring400_70: "ring-blue-400/70",
  hoverBorder500_60: "hover:border-blue-500/60",
  hoverTextLight: "hover:text-blue-700",
  hoverTextDark: "hover:text-blue-300",
  focusBorder500: "focus:border-blue-500",
  shadow500_10: "shadow-blue-500/10",
  shadow500_15: "shadow-blue-500/15",
  shadow500_20: "shadow-blue-500/20",
  shadow500_30: "shadow-blue-500/30",
  gradMiddleDark: "from-blue-500/15 via-blue-500/8 to-transparent",
  gradLightCard: "from-blue-50 via-white to-white",
  gradRowDark: "from-blue-500/15 via-blue-500/5 to-transparent",
  gradRowLight: "from-blue-50 via-blue-50/40 to-transparent",
  gradStatDark: "from-blue-500/15 via-blue-500/5 to-transparent",
  gradStatLight: "from-blue-50 via-white to-white",
  gradPodiumDark: "from-blue-500/30 to-blue-500/10",
  gradPodiumLight: "from-blue-100 to-blue-50",
  gradAvatarMe: "from-blue-400 to-blue-600",
  text500_10: "text-blue-500/10",
  text400_15: "text-blue-400/15",
  textPair600_300: "text-blue-600 dark:text-blue-300",
  textPair600_400: "text-blue-600 dark:text-blue-400",
  textPair700_400: "text-blue-700 dark:text-blue-400",
  textPair500_400: "text-blue-500 dark:text-blue-400",
  bgPaleStrongPair: "bg-blue-200/80 dark:bg-blue-500/20",
  bgGhostInk: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  bgGhostLight: "bg-blue-200/80 text-blue-900",
  bgGhostDark: "bg-blue-500/20 text-blue-300",
  rgb: "37 99 235",
};

const PURPLE: AccentClasses = {
  text: "text-purple-600 dark:text-purple-400",
  bg: "bg-purple-600 hover:bg-purple-500",
  border: "border-l-purple-600",
  ring: "ring-purple-600",
  textOn: "text-white",
  textSolid: "text-purple-500",
  textBright: "text-purple-400",
  textDeep: "text-purple-600",
  textDeeper: "text-purple-700",
  textBrighter: "text-purple-300",
  bgSolid: "bg-purple-500",
  bgPale: "bg-purple-50",
  bgPaleStrong: "bg-purple-100",
  bgPaleVeryStrong: "bg-purple-200/80",
  bg10: "bg-purple-500/10",
  bg15: "bg-purple-500/15",
  bg20: "bg-purple-500/20",
  bgDarkDeep: "bg-purple-950/40",
  border200: "border-purple-200",
  border300: "border-purple-300",
  border500: "border-purple-500",
  border500_30: "border-purple-500/30",
  border500_40: "border-purple-500/40",
  border500_60: "border-purple-500/60",
  border500_80: "border-purple-500/80",
  border800: "border-purple-800/60",
  ring500: "ring-purple-500",
  ring500_40: "ring-purple-500/40",
  ring500_50: "ring-purple-500/50",
  ring500_60: "ring-purple-500/60",
  ring400: "ring-purple-400",
  ring400_60: "ring-purple-400/60",
  ring400_70: "ring-purple-400/70",
  hoverBorder500_60: "hover:border-purple-500/60",
  hoverTextLight: "hover:text-purple-700",
  hoverTextDark: "hover:text-purple-300",
  focusBorder500: "focus:border-purple-500",
  shadow500_10: "shadow-purple-500/10",
  shadow500_15: "shadow-purple-500/15",
  shadow500_20: "shadow-purple-500/20",
  shadow500_30: "shadow-purple-500/30",
  gradMiddleDark: "from-purple-500/15 via-purple-500/8 to-transparent",
  gradLightCard: "from-purple-50 via-white to-white",
  gradRowDark: "from-purple-500/15 via-purple-500/5 to-transparent",
  gradRowLight: "from-purple-50 via-purple-50/40 to-transparent",
  gradStatDark: "from-purple-500/15 via-purple-500/5 to-transparent",
  gradStatLight: "from-purple-50 via-white to-white",
  gradPodiumDark: "from-purple-500/30 to-purple-500/10",
  gradPodiumLight: "from-purple-100 to-purple-50",
  gradAvatarMe: "from-purple-400 to-purple-600",
  text500_10: "text-purple-500/10",
  text400_15: "text-purple-400/15",
  textPair600_300: "text-purple-600 dark:text-purple-300",
  textPair600_400: "text-purple-600 dark:text-purple-400",
  textPair700_400: "text-purple-700 dark:text-purple-400",
  textPair500_400: "text-purple-500 dark:text-purple-400",
  bgPaleStrongPair: "bg-purple-200/80 dark:bg-purple-500/20",
  bgGhostInk: "bg-purple-500/20 text-purple-600 dark:text-purple-300",
  bgGhostLight: "bg-purple-200/80 text-purple-900",
  bgGhostDark: "bg-purple-500/20 text-purple-300",
  rgb: "147 51 234",
};

const RED: AccentClasses = {
  text: "text-red-600 dark:text-red-400",
  bg: "bg-red-600 hover:bg-red-500",
  border: "border-l-red-600",
  ring: "ring-red-600",
  textOn: "text-white",
  textSolid: "text-red-500",
  textBright: "text-red-400",
  textDeep: "text-red-600",
  textDeeper: "text-red-700",
  textBrighter: "text-red-300",
  bgSolid: "bg-red-500",
  bgPale: "bg-red-50",
  bgPaleStrong: "bg-red-100",
  bgPaleVeryStrong: "bg-red-200/80",
  bg10: "bg-red-500/10",
  bg15: "bg-red-500/15",
  bg20: "bg-red-500/20",
  bgDarkDeep: "bg-red-950/40",
  border200: "border-red-200",
  border300: "border-red-300",
  border500: "border-red-500",
  border500_30: "border-red-500/30",
  border500_40: "border-red-500/40",
  border500_60: "border-red-500/60",
  border500_80: "border-red-500/80",
  border800: "border-red-800/60",
  ring500: "ring-red-500",
  ring500_40: "ring-red-500/40",
  ring500_50: "ring-red-500/50",
  ring500_60: "ring-red-500/60",
  ring400: "ring-red-400",
  ring400_60: "ring-red-400/60",
  ring400_70: "ring-red-400/70",
  hoverBorder500_60: "hover:border-red-500/60",
  hoverTextLight: "hover:text-red-700",
  hoverTextDark: "hover:text-red-300",
  focusBorder500: "focus:border-red-500",
  shadow500_10: "shadow-red-500/10",
  shadow500_15: "shadow-red-500/15",
  shadow500_20: "shadow-red-500/20",
  shadow500_30: "shadow-red-500/30",
  gradMiddleDark: "from-red-500/15 via-red-500/8 to-transparent",
  gradLightCard: "from-red-50 via-white to-white",
  gradRowDark: "from-red-500/15 via-red-500/5 to-transparent",
  gradRowLight: "from-red-50 via-red-50/40 to-transparent",
  gradStatDark: "from-red-500/15 via-red-500/5 to-transparent",
  gradStatLight: "from-red-50 via-white to-white",
  gradPodiumDark: "from-red-500/30 to-red-500/10",
  gradPodiumLight: "from-red-100 to-red-50",
  gradAvatarMe: "from-red-400 to-red-600",
  text500_10: "text-red-500/10",
  text400_15: "text-red-400/15",
  textPair600_300: "text-red-600 dark:text-red-300",
  textPair600_400: "text-red-600 dark:text-red-400",
  textPair700_400: "text-red-700 dark:text-red-400",
  textPair500_400: "text-red-500 dark:text-red-400",
  bgPaleStrongPair: "bg-red-200/80 dark:bg-red-500/20",
  bgGhostInk: "bg-red-500/20 text-red-600 dark:text-red-300",
  bgGhostLight: "bg-red-200/80 text-red-900",
  bgGhostDark: "bg-red-500/20 text-red-300",
  rgb: "220 38 38",
};

// Green is rendered via Tailwind's emerald palette (matches the
// existing ACCENT_* tables that always mapped green→emerald).
const GREEN: AccentClasses = {
  text: "text-emerald-600 dark:text-emerald-400",
  bg: "bg-emerald-600 hover:bg-emerald-500",
  border: "border-l-emerald-600",
  ring: "ring-emerald-600",
  textOn: "text-white",
  textSolid: "text-emerald-500",
  textBright: "text-emerald-400",
  textDeep: "text-emerald-600",
  textDeeper: "text-emerald-700",
  textBrighter: "text-emerald-300",
  bgSolid: "bg-emerald-500",
  bgPale: "bg-emerald-50",
  bgPaleStrong: "bg-emerald-100",
  bgPaleVeryStrong: "bg-emerald-200/80",
  bg10: "bg-emerald-500/10",
  bg15: "bg-emerald-500/15",
  bg20: "bg-emerald-500/20",
  bgDarkDeep: "bg-emerald-950/40",
  border200: "border-emerald-200",
  border300: "border-emerald-300",
  border500: "border-emerald-500",
  border500_30: "border-emerald-500/30",
  border500_40: "border-emerald-500/40",
  border500_60: "border-emerald-500/60",
  border500_80: "border-emerald-500/80",
  border800: "border-emerald-800/60",
  ring500: "ring-emerald-500",
  ring500_40: "ring-emerald-500/40",
  ring500_50: "ring-emerald-500/50",
  ring500_60: "ring-emerald-500/60",
  ring400: "ring-emerald-400",
  ring400_60: "ring-emerald-400/60",
  ring400_70: "ring-emerald-400/70",
  hoverBorder500_60: "hover:border-emerald-500/60",
  hoverTextLight: "hover:text-emerald-700",
  hoverTextDark: "hover:text-emerald-300",
  focusBorder500: "focus:border-emerald-500",
  shadow500_10: "shadow-emerald-500/10",
  shadow500_15: "shadow-emerald-500/15",
  shadow500_20: "shadow-emerald-500/20",
  shadow500_30: "shadow-emerald-500/30",
  gradMiddleDark: "from-emerald-500/15 via-emerald-500/8 to-transparent",
  gradLightCard: "from-emerald-50 via-white to-white",
  gradRowDark: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  gradRowLight: "from-emerald-50 via-emerald-50/40 to-transparent",
  gradStatDark: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  gradStatLight: "from-emerald-50 via-white to-white",
  gradPodiumDark: "from-emerald-500/30 to-emerald-500/10",
  gradPodiumLight: "from-emerald-100 to-emerald-50",
  gradAvatarMe: "from-emerald-400 to-emerald-600",
  text500_10: "text-emerald-500/10",
  text400_15: "text-emerald-400/15",
  textPair600_300: "text-emerald-600 dark:text-emerald-300",
  textPair600_400: "text-emerald-600 dark:text-emerald-400",
  textPair700_400: "text-emerald-700 dark:text-emerald-400",
  textPair500_400: "text-emerald-500 dark:text-emerald-400",
  bgPaleStrongPair: "bg-emerald-200/80 dark:bg-emerald-500/20",
  bgGhostInk: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  bgGhostLight: "bg-emerald-200/80 text-emerald-900",
  bgGhostDark: "bg-emerald-500/20 text-emerald-300",
  rgb: "5 150 105",
};

export function getAccentClasses(
  name: AccentName | null | undefined,
): AccentClasses {
  switch (name) {
    case "purple":
      return PURPLE;
    case "blue":
      return BLUE;
    case "red":
      return RED;
    case "green":
      return GREEN;
    case "gold":
    case "amber":
    default:
      return AMBER;
  }
}

// -------------------------------------------------------------
// Convenience helpers for the older 4-key map signature still
// used by /predictor (list page). Lets the list page keep its
// existing call sites without duplicating the lookup table.
// -------------------------------------------------------------

export function accentBorderClass(name: AccentName): string {
  return getAccentClasses(name).border;
}
export function accentTextClass(name: AccentName): string {
  return getAccentClasses(name).text;
}
export function accentBgClass(name: AccentName): string {
  return getAccentClasses(name).bg;
}
export function accentRingClass(name: AccentName): string {
  return getAccentClasses(name).ring;
}
