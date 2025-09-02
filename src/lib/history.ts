import fs from "node:fs";
import path from "node:path";

let cache: any[] | null = null;

export function loadHistoryTable(): any[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), "public", "pl-datasets", "player_stats_2024_2025_season.csv");
  const raw = fs.readFileSync(p, "utf8");
  // micro CSV parser (no dep): split lines, then commas
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  cache = lines.map(l => {
    const cells = l.split(",");
    const o: any = {};
    headers.forEach((h, i) => o[h] = cells[i]);
    return o;
  });
  return cache;
}