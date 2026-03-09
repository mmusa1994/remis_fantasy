export interface F1EntryInput {
  rank: number;
  team_name: string;
  manager_name: string;
  points: number;
}

/**
 * Check if a line is a pure number (rank or points).
 */
function isNumericLine(line: string): boolean {
  return /^\d+$/.test(line);
}

/**
 * Parse bulk-pasted F1 standings text into structured entries.
 *
 * New format per entry (copied from F1 Fantasy site):
 *   rank (number)
 *   [optional badge/tier line, e.g. "T1"]
 *   team_name (string)
 *   manager_name (string)
 *   points (number)
 *   5 driver name lines (skipped)
 *   2 constructor name lines (skipped)
 *
 * Also supports the old simple 4-line format:
 *   rank, team_name, manager_name, points
 */
export function parseF1BulkText(input: string): F1EntryInput[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Remove header lines if present (e.g. "POSITION    NAME    PTS    TEAM")
  const headerIdx = lines.findIndex(
    (l) =>
      (/rank/i.test(l) && /name/i.test(l) && /points/i.test(l)) ||
      (/position/i.test(l) && /name/i.test(l) && /pts/i.test(l))
  );
  const content = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;

  const entries: F1EntryInput[] = [];

  let i = 0;
  while (i < content.length) {
    // Step 1: Expect rank line (pure number)
    if (!isNumericLine(content[i])) {
      i++;
      continue;
    }
    const rank = Number(content[i]);
    i++;

    // Step 2: Collect text lines until we hit the points line (next pure number)
    const nameLines: string[] = [];
    while (i < content.length && !isNumericLine(content[i])) {
      nameLines.push(content[i]);
      i++;
    }

    // Step 3: Points line (pure number)
    if (i >= content.length || !isNumericLine(content[i])) {
      continue; // malformed entry, skip
    }
    const points = Number(content[i]);
    i++;

    // Step 4: Extract team_name and manager_name from nameLines
    // The last line is always manager_name, second-to-last is team_name
    // Any earlier lines are badges/tier indicators (ignored)
    if (nameLines.length < 2) {
      continue; // need at least team + manager
    }
    const manager_name = nameLines[nameLines.length - 1];
    const team_name = nameLines[nameLines.length - 2];

    entries.push({ rank, team_name, manager_name, points });

    // Step 5: Skip driver + constructor lines (7 lines) if present
    // Peek ahead: if the next line is NOT a pure number (i.e. not the next rank),
    // it's a driver/constructor line — skip until next rank or end
    while (i < content.length && !isNumericLine(content[i])) {
      i++;
    }
  }

  return entries;
}

