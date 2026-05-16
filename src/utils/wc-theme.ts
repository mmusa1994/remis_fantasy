import type { Tournament } from "@/types/predictor";

/**
 * Detect whether a tournament should use the World Cup 2026 theme
 * (background images + theme music). Anchored on slug/name keywords so
 * non-WC tournaments stay clean and chrome-less.
 *
 * Opt-in patterns:
 *   - slug contains "world-cup", "wc-26", "fifa", "wc2026"
 *   - name contains "world cup", "svjetsko prvenstvo", "FIFA"
 */
export function isWorldCupTheme(
  t: Pick<Tournament, "slug" | "name"> | null | undefined,
): boolean {
  if (!t) return false;
  const slug = (t.slug || "").toLowerCase();
  const name = (t.name || "").toLowerCase();
  const haystack = `${slug} ${name}`;
  return (
    /world[\s-]?cup/.test(haystack) ||
    /svjetsko\s+prvenstvo/.test(haystack) ||
    /\bfifa\b/.test(haystack) ||
    /\bwc[-\s]?2?0?26\b/.test(haystack)
  );
}
