export interface F1EntryInput {
  rank: number;
  team_name: string;
  manager_name: string;
  points: number;
}

/**
 * Parse bulk-pasted F1 standings text into structured entries.
 * Expected pattern per entry after filtering blanks and header:
 *   rank (number)
 *   team_name (string)
 *   manager_name (string)
 *   points (number)
 */
export function parseF1BulkText(input: string): F1EntryInput[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Remove header lines if present
  const headerIdx = lines.findIndex(
    (l) => /rank/i.test(l) && /name/i.test(l) && /points/i.test(l)
  );
  const content = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;

  const entries: F1EntryInput[] = [];

  let i = 0;
  while (i < content.length) {
    const rankLine = content[i];
    const rank = Number(rankLine.replace(/[^0-9]/g, ""));
    const team = content[i + 1];
    const manager = content[i + 2];
    const pointsLine = content[i + 3];
    const points = Number((pointsLine || "").replace(/[^0-9]/g, ""));

    if (
      Number.isFinite(rank) &&
      team &&
      manager &&
      Number.isFinite(points)
    ) {
      entries.push({ rank, team_name: team, manager_name: manager, points });
      i += 4;
    } else {
      // If the pattern doesn't match, advance to the next line to avoid infinite loop
      i += 1;
    }
  }

  return entries;
}

