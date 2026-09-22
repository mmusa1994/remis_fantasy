"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  Eye,
  Gauge,
  ListChecks,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import type { FplTeamAnalysisReport, AnalysisMeta } from "@/lib/ai/fpl-analysis-prompt";
export type { AnalysisMeta };


interface Props {
  report: FplTeamAnalysisReport;
  meta: AnalysisMeta;
  lang: string;
}

const t = (lang: string, bs: string, en: string) => (lang === "bs" ? bs : en);

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));

const gradeTone = (grade: number) =>
  grade >= 85
    ? { ring: "#10b981", text: "text-emerald-500", glow: "shadow-emerald-500/30" }
    : grade >= 70
    ? { ring: "#8b5cf6", text: "text-violet-500", glow: "shadow-violet-500/30" }
    : grade >= 50
    ? { ring: "#f59e0b", text: "text-amber-500", glow: "shadow-amber-500/30" }
    : { ring: "#f43f5e", text: "text-rose-500", glow: "shadow-rose-500/30" };

const severityStyles: Record<string, string> = {
  high: "border-rose-300/60 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
  medium:
    "border-amber-300/60 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  low: "border-slate-300/60 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300",
};

const sentimentStyles: Record<string, string> = {
  good: "from-emerald-500/15 to-emerald-600/10 border-emerald-300/50 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300",
  neutral:
    "from-slate-500/10 to-slate-600/10 border-slate-300/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300",
  bad: "from-rose-500/15 to-rose-600/10 border-rose-300/50 dark:border-rose-800/40 text-rose-700 dark:text-rose-300",
};

function GradeRing({ grade, label }: { grade: number; label: string }) {
  const value = clamp(grade);
  const tone = gradeTone(value);
  const [shown, setShown] = useState(0);
  const r = 46;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className={`relative shrink-0 w-28 h-28 drop-shadow-lg ${tone.glow}`}>
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          strokeWidth="9"
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <motion.circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke={tone.ring}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black tabular-nums ${tone.text}`}>{shown}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 text-center leading-tight">
          {label}
        </span>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  accent,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent}`} />
      <div className="px-4 sm:px-5 pt-4 pb-4">
        <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-3">
          <span className="text-violet-500 dark:text-violet-400">{icon}</span>
          {title}
        </h4>
        {children}
      </div>
    </motion.section>
  );
}

function Confidence({ value, lang }: { value: number; lang: string }) {
  const v = clamp(value);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
        {v}% {t(lang, "sigurnost", "confidence")}
      </span>
    </div>
  );
}

const RECOMMENDATION_LABEL: Record<string, { bs: string; en: string; tone: string }> = {
  hold: { bs: "Sačuvaj transfer", en: "Hold transfers", tone: "from-slate-500 to-slate-600" },
  one_transfer: { bs: "1 transfer", en: "1 transfer", tone: "from-violet-500 to-fuchsia-500" },
  two_transfers: { bs: "2 transfera", en: "2 transfers", tone: "from-violet-500 to-indigo-500" },
  take_hit: { bs: "Uzmi hit", en: "Take a hit", tone: "from-amber-500 to-orange-500" },
  wildcard: { bs: "Wildcard", en: "Wildcard", tone: "from-emerald-500 to-teal-500" },
  free_hit: { bs: "Free Hit", en: "Free Hit", tone: "from-cyan-500 to-blue-500" },
};

export default function AITeamAnalysisReport({ report, meta, lang }: Props) {
  const rec = RECOMMENDATION_LABEL[report.transferPlan?.recommendation] ?? {
    bs: report.transferPlan?.recommendation ?? "-",
    en: report.transferPlan?.recommendation ?? "-",
    tone: "from-violet-500 to-fuchsia-500",
  };

  const deadlineText = useMemo(() => {
    if (!meta.deadline) return null;
    const d = new Date(meta.deadline);
    return d.toLocaleString(lang === "bs" ? "bs-BA" : "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [meta.deadline, lang]);

  const has = (arr?: unknown[]) => Array.isArray(arr) && arr.length > 0;

  return (
    <div className="space-y-3">
      {/* ---------- VERDIKT ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/40 dark:via-slate-900/70 dark:to-fuchsia-950/30 p-4 sm:p-5"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <GradeRing
            grade={report.verdict?.grade ?? 0}
            label={report.verdict?.gradeLabel ?? t(lang, "ocjena", "rating")}
          />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white">
                <Sparkles className="w-3 h-3" /> GW{meta.targetGW}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                {meta.season}
              </span>
              {meta.teamName && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                  {meta.teamName}
                </span>
              )}
              {deadlineText && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-300">
                  <CalendarDays className="w-3 h-3" /> {deadlineText}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black leading-snug bg-gradient-to-r from-violet-700 to-fuchsia-600 dark:from-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
              {report.verdict?.headline}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {report.verdict?.summary}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---------- HITNO ---------- */}
      {has(report.urgent) && (
        <Section
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          title={t(lang, "Hitno — riješi prije deadlinea", "Urgent — fix before deadline")}
          accent="from-rose-500 to-orange-500"
          delay={0.05}
        >
          <div className="space-y-2">
            {report.urgent.map((u, i) => (
              <div
                key={`${u.player}-${i}`}
                className={`rounded-xl border px-3 py-2.5 ${severityStyles[u.severity] ?? severityStyles.medium}`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {u.player}{" "}
                      <span className="font-medium opacity-70">({u.team})</span>
                    </p>
                    <p className="text-xs mt-0.5 opacity-90">{u.issue}</p>
                    <p className="text-xs mt-1 font-semibold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> {u.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- TRANSFERI ---------- */}
      <Section
        icon={<Wand2 className="w-3.5 h-3.5" />}
        title={t(lang, "Transfer plan", "Transfer plan")}
        accent="from-violet-500 via-fuchsia-500 to-indigo-500"
        delay={0.1}
      >
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span
            className={`text-[11px] font-black px-2.5 py-1 rounded-lg text-white bg-gradient-to-r ${rec.tone}`}
          >
            {t(lang, rec.bs, rec.en)}
          </span>
          {report.transferPlan?.hitCost > 0 && (
            <span className="text-[11px] font-bold px-2 py-1 rounded-lg border border-rose-300/60 dark:border-rose-800/50 text-rose-600 dark:text-rose-300">
              −{report.transferPlan.hitCost} {t(lang, "bodova", "pts")}
            </span>
          )}
          <span className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
            {t(lang, "banka poslije", "bank after")}: £
            {Number(report.transferPlan?.bankAfter ?? 0).toFixed(1)}m
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
          {report.transferPlan?.rationale}
        </p>

        <div className="space-y-2">
          {(report.transferPlan?.moves ?? []).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-950/40 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 shrink-0 rounded-md bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
                  {m.priority}
                </span>
                <Confidence value={m.confidence} lang={lang} />
                <span className="ml-auto text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {m.netSpend >= 0 ? "+" : ""}
                  £{Number(m.netSpend ?? 0).toFixed(1)}m
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="rounded-lg border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-rose-500 mb-0.5">
                    {t(lang, "Van", "Out")}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {m.out?.name}{" "}
                    <span className="text-[11px] font-semibold text-slate-500">
                      {m.out?.team} · {m.out?.position} · £
                      {Number(m.out?.price ?? 0).toFixed(1)}m
                    </span>
                  </p>
                  <p className="text-[11px] mt-0.5 text-slate-600 dark:text-slate-400 leading-snug">
                    {m.out?.reason}
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-violet-500" />
                </div>
                <div className="rounded-lg border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-0.5">
                    {t(lang, "Unutra", "In")}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {m.in?.name}{" "}
                    <span className="text-[11px] font-semibold text-slate-500">
                      {m.in?.team} · {m.in?.position} · £
                      {Number(m.in?.price ?? 0).toFixed(1)}m
                    </span>
                  </p>
                  <p className="text-[11px] mt-0.5 text-slate-600 dark:text-slate-400 leading-snug">
                    {m.in?.reason}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {has(report.transferPlan?.alternatives) && (
          <div className="mt-3 space-y-1.5">
            {report.transferPlan.alternatives.map((a, i) => (
              <div
                key={i}
                className="text-xs text-slate-600 dark:text-slate-400 rounded-lg border border-dashed border-slate-300/70 dark:border-slate-700/70 px-2.5 py-2"
              >
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {a.title}:
                </span>{" "}
                {a.detail}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ---------- KAPITEN ---------- */}
      {has(report.captaincy) && (
        <Section
          icon={<Crown className="w-3.5 h-3.5" />}
          title={t(lang, "Kapitenska traka", "Captaincy")}
          accent="from-amber-400 via-amber-500 to-orange-500"
          delay={0.15}
        >
          <div className="space-y-2">
            {report.captaincy
              .slice()
              .sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9))
              .map((c, i) => (
                <div
                  key={`${c.player}-${i}`}
                  className={`rounded-xl border px-3 py-2.5 ${
                    i === 0
                      ? "border-amber-300/70 dark:border-amber-700/50 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20"
                      : "border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full text-[10px] font-black flex items-center justify-center ${
                        i === 0
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {c.rank ?? i + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {c.player}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {c.team} · {c.fixture}
                    </span>
                    {c.isDifferential && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-fuchsia-600 text-white">
                        {t(lang, "diferencijal", "differential")}
                      </span>
                    )}
                    <span className="ml-auto">
                      <Confidence value={c.confidence} lang={lang} />
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {c.reason}
                  </p>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* ---------- SNAGE / SLABOSTI ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {has(report.strengths) && (
          <Section
            icon={<BadgeCheck className="w-3.5 h-3.5" />}
            title={t(lang, "Jake tačke", "Strengths")}
            accent="from-emerald-500 to-teal-500"
            delay={0.2}
          >
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has(report.weaknesses) && (
          <Section
            icon={<Shield className="w-3.5 h-3.5" />}
            title={t(lang, "Slabe tačke", "Weak spots")}
            accent="from-rose-500 to-pink-500"
            delay={0.22}
          >
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      w.severity === "high"
                        ? "bg-rose-500"
                        : w.severity === "medium"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {w.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {w.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* ---------- POSTAVA ---------- */}
      {report.lineup && (
        <Section
          icon={<Users className="w-3.5 h-3.5" />}
          title={t(lang, "Postava i klupa", "Lineup & bench")}
          accent="from-indigo-500 to-violet-500"
          delay={0.25}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
              {report.lineup.formation}
            </span>
            {report.lineup.startingChanges?.map((c, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
          {has(report.lineup.benchOrder) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {report.lineup.benchOrder
                .slice()
                .sort((a, b) => (a.order ?? 9) - (b.order ?? 9))
                .map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-950/30 px-2 py-1"
                    title={b.reason}
                  >
                    <span className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-700 text-[9px] font-black flex items-center justify-center text-slate-700 dark:text-slate-200">
                      {b.order}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {b.player}
                    </span>
                  </div>
                ))}
            </div>
          )}
          {report.lineup.note && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {report.lineup.note}
            </p>
          )}
        </Section>
      )}

      {/* ---------- CHIP + RASPORED ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {report.chipPlan && (
          <Section
            icon={<Gauge className="w-3.5 h-3.5" />}
            title={t(lang, "Chip strategija", "Chip strategy")}
            accent="from-cyan-500 to-blue-500"
            delay={0.3}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                {report.chipPlan.chip}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {report.chipPlan.targetGW}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {report.chipPlan.rationale}
            </p>
          </Section>
        )}

        {has(report.fixtureOutlook) && (
          <Section
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            title={t(lang, "Raspored koji odlučuje", "Fixture outlook")}
            accent="from-sky-500 to-cyan-500"
            delay={0.32}
          >
            <div className="space-y-1.5">
              {report.fixtureOutlook.map((f, i) => (
                <div
                  key={i}
                  className={`rounded-lg border bg-gradient-to-r px-2.5 py-2 ${
                    sentimentStyles[f.sentiment] ?? sentimentStyles.neutral
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black">{f.team}</span>
                    <span className="text-[10px] font-mono opacity-80">{f.run}</span>
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-snug">{f.verdict}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ---------- WATCHLIST ---------- */}
      {has(report.watchlist) && (
        <Section
          icon={<Eye className="w-3.5 h-3.5" />}
          title={t(lang, "Na radaru", "Watchlist")}
          accent="from-fuchsia-500 to-pink-500"
          delay={0.35}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.watchlist.map((w, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/30 px-3 py-2"
              >
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {w.player}{" "}
                  <span className="text-[11px] font-semibold text-slate-500">
                    {w.team} · £{Number(w.price ?? 0).toFixed(1)}m
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                  {w.reason}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mt-1">
                  {w.timing}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- RIZICI ---------- */}
      {has(report.risks) && (
        <Section
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          title={t(lang, "Rizici", "Risks")}
          accent="from-amber-500 to-rose-500"
          delay={0.38}
        >
          <ul className="space-y-1.5">
            {report.risks.map((r, i) => (
              <li
                key={i}
                className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------- AKCIONI PLAN ---------- */}
      {has(report.actionPlan) && (
        <Section
          icon={<ListChecks className="w-3.5 h-3.5" />}
          title={t(lang, "Uradi ovo prije deadlinea", "Do this before the deadline")}
          accent="from-emerald-500 via-violet-500 to-fuchsia-500"
          delay={0.4}
        >
          <ol className="space-y-2">
            {report.actionPlan.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                className="flex gap-2.5 items-start"
              >
                <span className="w-5 h-5 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {a}
                </span>
              </motion.li>
            ))}
          </ol>
        </Section>
      )}

      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
        {t(lang, "Generisano", "Generated")}{" "}
        {new Date(meta.generatedAt).toLocaleString(lang === "bs" ? "bs-BA" : "en-GB")} ·{" "}
        {meta.model} · {t(lang, "podaci", "data")}: FPL API GW
        {meta.picksGW ?? meta.targetGW}
      </p>
    </div>
  );
}
