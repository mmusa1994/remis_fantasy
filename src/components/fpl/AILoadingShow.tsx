"use client";

// "Reflektor" — AI loader kao taktička tabla: snop svjetla prelazi preko STVARNE postave
// korisnika i budi igrača po igrača, zatim lopta kruži dodavanjima dok model radi.
// Jedini broj na ekranu je proteklo vrijeme — i on je istinit.

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  layoutXI,
  passSequences,
  PITCH_H,
  PITCH_W,
  SCAN_S,
  type PitchNode,
  type SquadPlayer,
} from "@/lib/ai/pitch-layout";

interface AILoadingShowProps {
  lang?: string;
  squad?: SquadPlayer[];
  /** Kada je analiza krenula (provider) — omogućava "resume" bez ponovnog skeniranja. */
  startedAt?: number | null;
  variant?: "full" | "mini";
  /** Izvještaj je stigao — "završni zvižduk": čvorovi pulsiraju, snop prođe još jednom. */
  done?: boolean;
  className?: string;
}

const COPY = {
  bs: {
    scan: ["Čitam tvoju postavu…", "Gledam ko je u prvih 11, a ko na klupi…"],
    weigh: ["Provjeravam formu i minute…", "Vagam raspored za naredna kola…", "Tražim ko zaslužuje kapitensku traku…", "Upoređujem cijene i kretanja na tržištu…"],
    compose: ["Slažem transfere koji imaju smisla…", "Razmišljam o chipovima…", "Pišem akcioni plan, red po red…", "Provjeravam svaki broj protiv živih podataka…"],
    long: ["Traje malo duže nego obično — još radim.", "Sporije nego inače — ne odustajem.", "AI još sastavlja odgovor, strpljenja…"],
    usual: "obično ispod 30 s",
    hint: "Možeš zatvoriti prozor — analiza se nastavlja, javit ću ti u uglu.",
    aria: { scan: "Čitam tvoju postavu.", weigh: "Vagam formu, raspored i tržište.", compose: "Sastavljam preporuke.", long: "Traje duže nego obično, još radim." },
  },
  en: {
    scan: ["Reading your line-up…", "Checking who starts and who sits…"],
    weigh: ["Weighing form and minutes…", "Looking at the fixture run…", "Deciding who deserves the armband…", "Comparing prices and market moves…"],
    compose: ["Building transfers that make sense…", "Thinking about chips…", "Writing the action plan, line by line…", "Checking every number against live data…"],
    long: ["Taking longer than usual — still on it.", "Slower than normal — not giving up.", "Still composing the answer, hang tight…"],
    usual: "usually under 30 s",
    hint: "You can close this window — the analysis continues, I'll ping you in the corner.",
    aria: { scan: "Reading your line-up.", weigh: "Weighing form, fixtures and market.", compose: "Composing recommendations.", long: "Taking longer than usual, still working." },
  },
};

type Phase = "scan" | "weigh" | "compose" | "long";
const phaseFor = (s: number): Phase => (s < SCAN_S ? "scan" : s < 20 ? "weigh" : s < 45 ? "compose" : "long");
const statusFor = (lang: "bs" | "en", s: number) => {
  const pool = COPY[lang][phaseFor(s)];
  return pool[Math.floor(s / 4) % pool.length];
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function AILoadingShow({
  lang = "bs",
  squad,
  startedAt,
  variant = "full",
  done = false,
  className = "",
}: AILoadingShowProps) {
  const reduce = useReducedMotion() ?? false;
  const mini = variant === "mini";
  const l: "bs" | "en" = lang === "en" ? "en" : "bs";
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (k: string) => `${uid}-${k}`;

  // Sve što zavisi od "sada" se računa jednom pri montiranju (lazy init), bez ref-ova u renderu.
  const [session] = useState(() => {
    const mountedAt = Date.now();
    const start = startedAt ?? mountedAt;
    return { mountedAt, resumed: (mountedAt - start) / 1000 > SCAN_S || mini };
  });
  const t0 = startedAt ?? session.mountedAt;
  const [now, setNow] = useState(session.mountedAt);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, []);
  const elapsed = Math.max(0, (now - t0) / 1000);
  const phase = phaseFor(elapsed);

  // Ako je modal ponovo otvoren usred analize, tabla je već "pročitana" — ne skeniraj ponovo.
  const resumed = session.resumed;
  const lit = resumed || reduce;

  const nodes = useMemo(() => layoutXI(squad), [squad]);
  const seqs = useMemo(() => passSequences(nodes), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // lopta kreće tek kad snop sigurno završi prvi prolaz (animacije startaju ~1s nakon montiranja)
  const passing = !reduce && !done && (resumed || elapsed >= SCAN_S + 1.2);
  const [seqIdx, setSeqIdx] = useState(0);
  const seq = seqs[seqIdx % seqs.length].map((i) => byId.get(i)).filter(Boolean) as PitchNode[];
  const segDur = phase === "long" ? 1.0 : 0.8;
  const passDur = segDur * Math.max(1, seq.length - 1);
  const polyline = seq.map((n, i) => `${i === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");

  const nodeR = mini ? 15 : 9;
  const glowR = mini ? 22 : 15;
  const ballR = mini ? 8 : 4.5;

  return (
    <div className={`${mini ? "" : "py-2 sm:py-3 select-none text-center"} ${className}`}>
      <svg
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        className={`${mini ? "w-full h-full" : "w-full max-w-[520px] mx-auto"} block`}
        aria-hidden
      >
        <defs>
          <radialGradient id={id("node")} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#f0abfc" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </radialGradient>
          <linearGradient id={id("beam")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#d946ef" stopOpacity="0" />
            <stop offset="0.5" stopColor="#d946ef" stopOpacity="0.32" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("line")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#d946ef" />
          </linearGradient>
          <clipPath id={id("clip")}>
            <rect x="8" y="8" width="344" height="184" rx="10" />
          </clipPath>
        </defs>

        {/* tabla */}
        <g
          className={`fill-none stroke-slate-400/60 dark:stroke-white/25 ${mini ? "opacity-60" : ""}`}
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        >
          <rect x="8" y="8" width="344" height="184" rx="10" className="fill-violet-500/[0.05] dark:fill-white/[0.035]" />
          <rect x="8" y="82" width="10" height="36" />
          <rect x="8" y="66" width="24" height="68" />
          <rect x="8" y="40" width="62" height="120" />
          <path d="M70 82 A22 22 0 0 1 70 118" />
          <circle cx="54" cy="100" r="1.2" className="fill-slate-400/60 dark:fill-white/25" />
          <line x1="352" y1="8" x2="352" y2="192" />
          <path d="M352 62 A38 38 0 0 0 352 138" />
          <circle cx="352" cy="100" r="1.2" className="fill-slate-400/60 dark:fill-white/25" />
        </g>

        {/* reflektor — clip na <g>, jer clipPath na pomjerenom elementu putuje s njim */}
        {!reduce && !mini && (
          <g clipPath={`url(#${id("clip")})`} className="opacity-70 dark:opacity-100">
            {done ? (
              <motion.rect
                key="beam-done"
                y="8"
                height="184"
                width="90"
                fill={`url(#${id("beam")})`}
                initial={{ x: -100 }}
                animate={{ x: 380 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
              />
            ) : (
              <motion.rect
                key="beam-loop"
                y="8"
                height="184"
                width="90"
                fill={`url(#${id("beam")})`}
                initial={{ x: -100 }}
                animate={{ x: [-100, 380] }}
                transition={{ duration: SCAN_S, ease: "linear", repeat: Infinity, repeatDelay: 7, delay: resumed ? 2 : 0 }}
              />
            )}
          </g>
        )}

        {/* linija dodavanja */}
        <AnimatePresence>
          {passing && seq.length > 1 && (
            <motion.path
              key={`line-${seqIdx}`}
              d={polyline}
              fill="none"
              stroke={`url(#${id("line")})`}
              strokeWidth={mini ? 4 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.75 }}
              animate={{ pathLength: 1 }}
              exit={{ opacity: 0 }}
              transition={{ pathLength: { duration: passDur, ease: "easeInOut", delay: 0.35 }, opacity: { duration: 0.5 } }}
            />
          )}
        </AnimatePresence>
        {reduce && !mini && (
          <path d={polyline} fill="none" stroke={`url(#${id("line")})`} strokeWidth={1.5} strokeDasharray="3 4" opacity={0.5} />
        )}

        {/* igrači */}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={glowR}
              className="fill-fuchsia-500/20 dark:fill-fuchsia-400/30"
              initial={lit ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: lit ? 0 : n.wakeAt, duration: 0.5 }}
            />
            <circle cx={n.x} cy={n.y} r={nodeR} className="fill-slate-300/70 dark:fill-slate-700/80 stroke-slate-400/70 dark:stroke-slate-500/70" strokeWidth={1} />
            <motion.circle
              cx={n.x}
              cy={n.y}
              fill={`url(#${id("node")})`}
              stroke="#fff"
              strokeWidth={1.5}
              initial={lit ? { opacity: 1, r: nodeR } : { opacity: 0, r: nodeR }}
              animate={
                done && !reduce
                  ? { opacity: 1, r: [nodeR, nodeR * 1.45, nodeR] }
                  : lit
                  ? { opacity: 1, r: nodeR }
                  : { opacity: 1, r: [nodeR, nodeR * 1.33, nodeR] }
              }
              transition={done ? { delay: i * 0.03, duration: 0.4 } : { delay: lit ? 0 : n.wakeAt, duration: 0.55, ease: "easeOut" }}
            />
            {!lit && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                fill="none"
                stroke="#d946ef"
                strokeWidth={1.5}
                initial={{ r: nodeR, opacity: 0.55 }}
                animate={{ r: nodeR + 13, opacity: 0 }}
                transition={{ delay: n.wakeAt, duration: 0.7, ease: "easeOut" }}
              />
            )}
            {!mini && n.label && (
              <motion.text
                x={n.x + 14}
                y={n.y + 3.5}
                fontSize={9}
                fontWeight={600}
                className="fill-slate-600 dark:fill-slate-300"
                initial={lit ? false : { opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: lit ? 0 : n.wakeAt + 0.15, duration: 0.4 }}
              >
                {n.label}
              </motion.text>
            )}
          </g>
        ))}

        {/* prijem lopte — talasi */}
        {passing &&
          seq.slice(1).map((n, k) => (
            <motion.circle
              key={`rip-${seqIdx}-${k}`}
              cx={n.x}
              cy={n.y}
              fill="none"
              stroke="#d946ef"
              strokeWidth={1.5}
              initial={{ r: nodeR, opacity: 0.55 }}
              animate={{ r: nodeR + 13, opacity: 0 }}
              transition={{ delay: 0.35 + segDur * (k + 1), duration: 0.6, ease: "easeOut" }}
            />
          ))}

        {/* lopta (grupa, da tamni sjaj putuje s njom) */}
        <AnimatePresence>
          {passing && seq.length > 1 && (
            <motion.g
              key={`ball-${seqIdx}`}
              initial={{ x: seq[0].x, y: seq[0].y, opacity: seqIdx === 0 ? 0 : 1 }}
              animate={{ x: seq.map((n) => n.x), y: seq.map((n) => n.y), opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{
                x: { duration: passDur, ease: "easeInOut", delay: 0.35 },
                y: { duration: passDur, ease: "easeInOut", delay: 0.35 },
                opacity: { duration: 0.3 },
              }}
              onAnimationComplete={() => {
                if (!done) setSeqIdx((v) => v + 1);
              }}
            >
              <circle r={ballR + 3.5} className="fill-fuchsia-300/0 dark:fill-fuchsia-300/35" />
              <circle r={ballR} fill="#fff" className="stroke-slate-700/70 dark:stroke-transparent" strokeWidth={1} />
            </motion.g>
          )}
        </AnimatePresence>
        {reduce && !mini && seq[0] && (
          <circle cx={seq[0].x} cy={seq[0].y} r={ballR} fill="#fff" className="stroke-slate-700/70 dark:stroke-transparent" strokeWidth={1} />
        )}
      </svg>

      {!mini && (
        <div className="mt-3 sm:mt-4">
          <div className="min-h-[1.5rem]">
            {/* keyed fade-in bez AnimatePresence "wait" — ne može zaglaviti na starom tekstu */}
            <motion.p
              key={statusFor(l, elapsed)}
              data-testid="ai-status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-[15px] sm:text-base font-semibold text-slate-700 dark:text-slate-200 max-w-[36ch] mx-auto leading-snug"
            >
              {statusFor(l, elapsed)}
            </motion.p>
          </div>
          <p data-testid="ai-clock" className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums" aria-hidden>
            {fmt(elapsed)}
            {elapsed < 30 && <span> · {COPY[l].usual}</span>}
          </p>
          <span role="status" aria-live="polite" className="sr-only">
            {COPY[l].aria[phase]}
          </span>
          <AnimatePresence>
            {elapsed >= 8 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`mt-2 text-[11px] ${
                  phase === "long" ? "font-medium text-violet-600 dark:text-violet-300" : "text-violet-600/90 dark:text-violet-300/90"
                }`}
              >
                {COPY[l].hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
