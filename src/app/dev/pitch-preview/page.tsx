"use client";

// Dev-only pregled terena (EnhancedPitchView) i Smart Replacement panela bez prijave.
// Tim se slaže iz živog bootstrap-a. U produkciji vraća 404.

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import EnhancedPitchView from "@/components/fpl/EnhancedPitchView";
import SmartReplacementPanel from "@/components/fpl/SmartReplacementPanel";
import { registerFplTeams } from "@/lib/team-colors";

const FORMATIONS: Record<string, [number, number, number]> = {
  "3-5-2": [3, 5, 2],
  "3-4-3": [3, 4, 3],
  "4-4-2": [4, 4, 2],
  "5-4-1": [5, 4, 1],
};

export default function PitchPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [shape, setShape] = useState("3-5-2");
  const [formation, setFormation] = useState("3-5-2");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/fpl/bootstrap-static")
      .then((r) => r.json())
      .then((res) => {
        registerFplTeams(res.data.teams);
        setTeams(res.data.teams);
        setPlayers(res.data.elements);
      });
  }, []);

  const squad = useMemo(() => {
    if (!players.length) return [];
    const top = (type: number, n: number) =>
      [...players]
        .filter((p) => p.element_type === type)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, n);
    const [d, m, f] = FORMATIONS[shape];
    const gk = top(1, 2);
    const def = top(2, 5);
    const mid = top(3, 5);
    const fwd = top(4, 3);
    const xi = [gk[0], ...def.slice(0, d), ...mid.slice(0, m), ...fwd.slice(0, f)];
    const bench = [gk[1], ...def.slice(d), ...mid.slice(m), ...fwd.slice(f)];
    return [...xi, ...bench].map((p, i) => ({
      player_id: p.id,
      position: i + 1,
      is_captain: i === xi.length - 1,
      is_vice_captain: i === xi.length - 2,
      multiplier: i === xi.length - 1 ? 2 : 1,
    }));
  }, [players, shape]);

  return (
    <div className="min-h-screen bg-theme-background px-2 pt-24 pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Object.keys(FORMATIONS).map((f) => (
            <button
              key={f}
              onClick={() => setShape(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                shape === f ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {squad.length > 0 && (
          <EnhancedPitchView
            teamPlayers={squad}
            allPlayers={players}
            onPlayerClick={setSelected}
            formation={formation}
            onFormationChange={setFormation}
          />
        )}
      </div>
      <SmartReplacementPanel
        open={!!selected}
        selectedPlayer={selected}
        allPlayers={players}
        allTeams={teams}
        nextGwFixtures={[]}
        upcomingFixtures={[]}
        nextGwNumber={6}
        currentGameweek={5}
        chipsUsed={[]}
        userTeamPlayerIds={squad.map((s) => s.player_id)}
        availableBudget={4}
        getTeamShortName={(id: number) => teams.find((t) => t.id === id)?.short_name || ""}
        onClose={() => setSelected(null)}
        onPickReplacement={() => setSelected(null)}
        isTransferMode={false}
      />
    </div>
  );
}
