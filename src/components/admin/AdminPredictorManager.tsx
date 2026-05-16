"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import SaveToast, {
  type SaveToastState,
} from "@/components/shared/SaveToast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Trophy,
  ListChecks,
  Gift,
  ScrollText,
  Settings,
  RefreshCcw,
  Lock,
  Save,
  Crown,
  Star,
  Award,
  Loader2,
  ExternalLink,
  Sun,
  Moon,
  LogOut,
  Download,
  X,
  Sparkles,
  Info,
  Users,
  Rocket,
  PlayCircle,
  Flag,
  Copy,
  ChevronRight,
  CalendarClock,
  MapPin,
  Swords,
  ClipboardPaste,
  AlertTriangle,
  Library,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Ban,
  Unlock,
  Music2,
  ImageIcon,
} from "lucide-react";
import type {
  Tournament,
  PredictionCategory,
  PredictionOption,
  TournamentRule,
  TournamentReward,
  CategoryType,
  TournamentStatus,
  PrizeType,
  RuleKind,
  Match,
  MatchStatus,
  TournamentMember,
  MemberStatus,
} from "@/types/predictor";
import { getLogoFilter } from "@/utils/predictor-logo";

type CategoryWithOptions = PredictionCategory & {
  predictor_options?: PredictionOption[];
};

type ManagerTab =
  | "settings"
  | "categories"
  | "matches"
  | "rules"
  | "rewards"
  | "members"
  | "approvals";

const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  single_choice: "Jedan izbor",
  multiple_choice: "Više izbora",
  ranked_top_n: "Rangirano top-N",
  team_selection: "Izbor ekipe",
  player_selection: "Izbor igrača",
  exact_score: "Tačan rezultat",
  numeric: "Brojčana procjena",
  free_text: "Slobodan tekst",
};

// Available WC2026 backdrops shown in the admin picker. Files live in
// public/wc2026/. Order = display order in the dropdown.
const WC_BACKGROUND_OPTIONS: Array<{ src: string; label: string }> = [
  { src: "/wc2026/bg-full-wc-2026.jpg", label: "FIFA 26 logo (tamna, brutalna)" },
  { src: "/wc2026/wc-bg.jpg", label: "Hero #1" },
  { src: "/wc2026/wc-bg1.jpg", label: "Hero #2 (tabele)" },
  { src: "/wc2026/wc-bg-2.webp", label: "Match-day apstrakcija" },
  { src: "/wc2026/wc-bg-3.webp", label: "Stadion blur" },
];

const ACCENT_ICON_CLASS: Record<string, string> = {
  amber: "text-amber-500 dark:text-amber-400",
  gold: "text-amber-500 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-emerald-600 dark:text-emerald-400",
};

const STATUS_BADGE_LIGHT: Record<TournamentStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  published: "bg-emerald-100 text-emerald-700 border-emerald-300",
  locked: "bg-amber-100 text-amber-700 border-amber-300",
  finished: "bg-blue-100 text-blue-700 border-blue-300",
};
const STATUS_BADGE_DARK: Record<TournamentStatus, string> = {
  draft: "bg-gray-800/60 text-gray-300 border-gray-700",
  published: "bg-emerald-950/50 text-emerald-300 border-emerald-800/60",
  locked: "bg-amber-950/50 text-amber-300 border-amber-800/60",
  finished: "bg-blue-950/50 text-blue-300 border-blue-800/60",
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: "Nacrt",
  published: "Aktivan",
  locked: "Zaključan",
  finished: "Završen",
};

const PRIZE_TYPE_LABEL: Record<PrizeType, string> = {
  cash: "Novčana",
  physical: "Fizička",
  voucher: "Voucher",
  vip: "VIP",
  sponsor: "Sponzor",
  fantasy_points: "Fantasy poeni",
  other: "Ostalo",
};

const RULE_KIND_LABEL: Record<RuleKind, string> = {
  rule: "Pravilo",
  bonus: "Bonus",
  info: "Info",
  deadline: "Rok",
  eligibility: "Uslovi učešća",
};

const STAGE_LABEL: Record<string, string> = {
  group: "Grupna faza",
  group_a: "Grupa A",
  group_b: "Grupa B",
  group_c: "Grupa C",
  group_d: "Grupa D",
  group_e: "Grupa E",
  group_f: "Grupa F",
  group_g: "Grupa G",
  group_h: "Grupa H",
  group_i: "Grupa I",
  group_j: "Grupa J",
  group_k: "Grupa K",
  group_l: "Grupa L",
  round_of_32: "Šesnaestina finala",
  round_of_16: "Osmina finala",
  quarter_final: "Četvrtfinale",
  semi_final: "Polufinale",
  third_place: "Utakmica za 3. mjesto",
  final: "Finale",
  other: "Ostalo",
};

const STAGE_LABEL_EN: Record<string, string> = {
  group: "Group stage",
  group_a: "Group A",
  group_b: "Group B",
  group_c: "Group C",
  group_d: "Group D",
  group_e: "Group E",
  group_f: "Group F",
  group_g: "Group G",
  group_h: "Group H",
  group_i: "Group I",
  group_j: "Group J",
  group_k: "Group K",
  group_l: "Group L",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  third_place: "Third-place play-off",
  final: "Final",
  other: "Other",
};

const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  scheduled: "Zakazana",
  live: "UŽIVO",
  finished: "Završena",
  postponed: "Odgođena",
  cancelled: "Otkazana",
};

const MATCH_STATUS_CLASS = (theme: string, status: MatchStatus) => {
  const dark = theme === "dark";
  switch (status) {
    case "live":
      return dark
        ? "bg-red-950/60 text-red-300 border-red-800/70 animate-pulse"
        : "bg-red-100 text-red-700 border-red-300 animate-pulse";
    case "finished":
      return dark
        ? "bg-blue-950/50 text-blue-300 border-blue-800/60"
        : "bg-blue-100 text-blue-700 border-blue-300";
    case "scheduled":
      return dark
        ? "bg-gray-800/60 text-gray-300 border-gray-700"
        : "bg-gray-100 text-gray-700 border-gray-300";
    case "postponed":
      return dark
        ? "bg-amber-950/50 text-amber-300 border-amber-800/60"
        : "bg-amber-100 text-amber-700 border-amber-300";
    case "cancelled":
      return dark
        ? "bg-gray-900/60 text-gray-500 border-gray-800 line-through"
        : "bg-gray-200 text-gray-500 border-gray-300 line-through";
  }
};

// ============================================================
// shared style helpers (theme-aware)
// ============================================================
const cardCls = (theme: string) =>
  theme === "dark"
    ? "bg-gray-900 border border-gray-800"
    : "bg-white border border-gray-200";

const subCardCls = (theme: string) =>
  theme === "dark"
    ? "bg-gray-800/40 border border-gray-700"
    : "bg-gray-50 border border-gray-200";

const inputCls = (theme: string) =>
  `w-full px-3 py-2 rounded-md outline-none text-sm transition-colors ${
    theme === "dark"
      ? "bg-gray-800 border border-gray-700 text-white focus:border-amber-500 placeholder-gray-500"
      : "bg-white border border-gray-300 text-gray-900 focus:border-amber-500 placeholder-gray-400"
  }`;

const headingCls = (theme: string) =>
  theme === "dark" ? "text-white" : "text-gray-900";

const mutedTextCls = (theme: string) =>
  theme === "dark" ? "text-gray-400" : "text-gray-600";

const subtleTextCls = (theme: string) =>
  theme === "dark" ? "text-gray-500" : "text-gray-500";

const primaryBtnCls =
  "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-60 transition-colors";

const ghostBtnCls = (theme: string) =>
  `px-3 py-2 rounded-md text-sm transition-colors ${
    theme === "dark"
      ? "border border-gray-700 hover:bg-gray-800 text-gray-200"
      : "border border-gray-300 hover:bg-gray-50 text-gray-700"
  }`;

const dangerBtnCls = (theme: string) =>
  `p-2 rounded-md transition-colors ${
    theme === "dark"
      ? "hover:bg-red-900/30 text-red-400"
      : "hover:bg-red-50 text-red-600"
  }`;

const editBtnCls = (theme: string) =>
  `p-2 rounded-md transition-colors ${
    theme === "dark"
      ? "hover:bg-gray-800 text-gray-300"
      : "hover:bg-gray-100 text-gray-700"
  }`;

const chipCls = (theme: string) =>
  `text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
    theme === "dark"
      ? "bg-gray-800 text-gray-300 border-gray-700"
      : "bg-gray-100 text-gray-700 border-gray-300"
  }`;

const accentChipCls = (theme: string) =>
  `text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
    theme === "dark"
      ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
      : "bg-amber-50 text-amber-700 border-amber-200"
  }`;

// ============================================================
export default function AdminPredictorManager() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => tournaments.find((t) => t.id === selectedId) ?? null,
    [tournaments, selectedId],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/predictor/tournaments");
      if (res.ok) {
        const data = (await res.json()) as Tournament[];
        setTournaments(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (status !== "authenticated" || !(session?.user as any)?.isAdmin) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="text-center">
          <p className="mb-4">Potreban je admin pristup.</p>
          <Link href="/admin" className="underline">
            Prijava
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
      {/* header */}
      <header className="bg-gradient-to-r from-red-950 to-red-900 text-white border-b border-red-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href="/admin/dashboard"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                title="Nazad na glavnu kontrolu"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Image
                src="/images/rf-logo.svg"
                alt="REMIS Fantasy"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Predictor — Turniri
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate">
                  Predikcije, pravila, nagrade i bodovanje
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/predictor"
                target="_blank"
                className="text-white/70 hover:text-white hover:bg-white/10 px-2 sm:px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm"
                title="Otvori javnu stranicu"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Javna stranica</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                title={theme === "dark" ? "Svijetli mod" : "Tamni mod"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/admin" })}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 text-sm"
                title="Odjava"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Odjava</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selected ? (
          <TournamentList
            tournaments={tournaments}
            loading={loading}
            theme={theme}
            onSelect={setSelectedId}
            onCreated={async (t) => {
              await refresh();
              setSelectedId(t.id);
            }}
          />
        ) : (
          <TournamentEditor
            tournament={selected}
            theme={theme}
            onBack={() => setSelectedId(null)}
            onUpdated={refresh}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================
// Import template modal
// ============================================================
type TemplateSummary = {
  id: string;
  name: string;
  short_description: string;
  accent_color: string;
  logo_url: string | null;
  banner_image_url: string | null;
  category_count: number;
  team_count: number;
};

function ImportTemplateModal({
  theme,
  onClose,
  onImported,
}: {
  theme: string;
  onClose: () => void;
  onImported: (t: Tournament) => void;
}) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/predictor/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTemplates(d ?? []))
      .finally(() => setLoading(false));
  }, []);

  const importTemplate = async (id: string) => {
    setImportingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/predictor/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: id,
          name_override: nameOverride[id] || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Greška pri uvozu");
      onImported(j.tournament);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-lg p-6 max-h-[90vh] overflow-y-auto ${cardCls(theme)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 ${editBtnCls(theme)}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className={`text-xl font-bold ${headingCls(theme)}`}>
            Uvezi šablon turnira
          </h3>
        </div>
        <p className={`text-sm mb-5 ${mutedTextCls(theme)}`}>
          Predefinisani turniri sa svim ekipama, kategorijama, pravilima i
          nagradama. Sve možeš urediti nakon uvoza — ti samo brineš o članovima.
        </p>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className={`text-sm ${mutedTextCls(theme)}`}>
            Nema dostupnih šablona.
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`rounded-md p-4 ${subCardCls(theme)}`}
              >
                <div className="flex items-start gap-3">
                  {tmpl.logo_url ? (
                    <div
                      className={`relative w-14 h-14 rounded-md flex-shrink-0 flex items-center justify-center ${
                        theme === "dark" ? "bg-gray-900" : "bg-white"
                      }`}
                    >
                      <Image
                        src={tmpl.logo_url}
                        alt={tmpl.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain"
                        style={{
                          filter: getLogoFilter(tmpl.logo_url, tmpl.accent_color),
                        }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Trophy
                      className={`w-6 h-6 flex-shrink-0 ${ACCENT_ICON_CLASS[tmpl.accent_color] ?? "text-amber-500"}`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold ${headingCls(theme)}`}>
                      {tmpl.name}
                    </h4>
                    <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                      {tmpl.short_description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={chipCls(theme)}>
                        {tmpl.category_count} kategorija
                      </span>
                      {tmpl.team_count > 0 && (
                        <span className={chipCls(theme)}>
                          {tmpl.team_count} ekipa/igrača
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={nameOverride[tmpl.id] ?? ""}
                        onChange={(e) =>
                          setNameOverride({
                            ...nameOverride,
                            [tmpl.id]: e.target.value,
                          })
                        }
                        placeholder={`Naziv (po defaultu: ${tmpl.name})`}
                        className={`${inputCls(theme)} flex-1`}
                      />
                      <button
                        onClick={() => importTemplate(tmpl.id)}
                        disabled={importingId === tmpl.id}
                        className={`${primaryBtnCls} justify-center whitespace-nowrap`}
                      >
                        {importingId === tmpl.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uvoz…
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Uvezi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tournament list + create form
// ============================================================
function TournamentList({
  tournaments,
  loading,
  theme,
  onSelect,
  onCreated,
}: {
  tournaments: Tournament[];
  loading: boolean;
  theme: string;
  onSelect: (id: string) => void;
  onCreated: (t: Tournament) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [accent, setAccent] = useState("amber");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) return setError("Naziv je obavezan");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/predictor/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name_en: nameEn || null,
          short_description: shortDesc || null,
          short_description_en: shortDescEn || null,
          accent_color: accent,
          status: "draft",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Greška pri kreiranju");
      }
      const t = await res.json();
      setName("");
      setNameEn("");
      setShortDesc("");
      setShortDescEn("");
      setCreating(false);
      onCreated(t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${headingCls(theme)}`}>
            Svi turniri
          </h2>
          <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
            Kreiraj prilagođene predikcijske turnire sa kategorijama, pravilima i nagradama.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImporting(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
              theme === "dark"
                ? "bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-950/60"
                : "bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Download className="w-4 h-4" />
            Uvezi šablon
          </button>
          <button
            onClick={() => setCreating((v) => !v)}
            className={primaryBtnCls}
          >
            <Plus className="w-4 h-4" />
            Novi turnir
          </button>
        </div>
      </div>

      {importing && (
        <ImportTemplateModal
          theme={theme}
          onClose={() => setImporting(false)}
          onImported={async (t) => {
            setImporting(false);
            onCreated(t);
          }}
        />
      )}

      {creating && (
        <div className={`rounded-md p-5 space-y-4 ${cardCls(theme)}`}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field theme={theme} label="Naziv (BS)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. Euro 2026 Predictor"
                className={inputCls(theme)}
              />
            </Field>
            <Field theme={theme} label="Name (EN)">
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Euro 2026 Predictor"
                className={inputCls(theme)}
              />
            </Field>
            <Field theme={theme} label="Akcent boja">
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className={inputCls(theme)}
              >
                <option value="amber">Amber / Zlatna</option>
                <option value="purple">Ljubičasta</option>
                <option value="blue">Plava</option>
                <option value="red">Crvena</option>
                <option value="green">Zelena</option>
              </select>
            </Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field theme={theme} label="Kratki opis (BS)">
              <input
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Kratki tekst koji se pojavljuje u listi turnira"
                className={inputCls(theme)}
              />
            </Field>
            <Field theme={theme} label="Short description (EN)">
              <input
                value={shortDescEn}
                onChange={(e) => setShortDescEn(e.target.value)}
                placeholder="Short text that appears in the tournament list"
                className={inputCls(theme)}
              />
            </Field>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className={ghostBtnCls(theme)}
            >
              Otkaži
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className={primaryBtnCls}
            >
              {submitting ? "Kreiranje…" : "Kreiraj nacrt"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : tournaments.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-12 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema turnira. Klikni{" "}
          <span className="text-amber-500 font-semibold">Novi turnir</span> da
          započneš.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => {
            const badge =
              theme === "dark"
                ? STATUS_BADGE_DARK[t.status]
                : STATUS_BADGE_LIGHT[t.status];
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`text-left rounded-md p-5 transition-colors ${cardCls(theme)} ${
                  theme === "dark"
                    ? "hover:bg-gray-800/80"
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy
                      className={`w-5 h-5 flex-shrink-0 ${ACCENT_ICON_CLASS[t.accent_color] ?? "text-amber-500"}`}
                    />
                    <h3 className={`font-semibold truncate ${headingCls(theme)}`}>
                      {t.name}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex-shrink-0 ${badge}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                {t.short_description && (
                  <p
                    className={`text-xs line-clamp-2 mb-3 ${mutedTextCls(theme)}`}
                  >
                    {t.short_description}
                  </p>
                )}
                <div
                  className={`text-xs font-mono ${subtleTextCls(theme)}`}
                >
                  /{t.slug}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Status workflow banner — uvijek vidljiv vodič kroz proces
// ============================================================
function WorkflowBanner({
  tournament,
  theme,
  onPublish,
  onLock,
  onFinish,
  onRescore,
  publishing,
  rescoring,
}: {
  tournament: Tournament;
  theme: string;
  onPublish: () => void;
  onLock: () => void;
  onFinish: () => void;
  onRescore: () => void;
  publishing: boolean;
  rescoring: boolean;
}) {
  const steps = [
    { key: "draft", label: "Nacrt", icon: Edit3 },
    { key: "published", label: "Aktivan", icon: PlayCircle },
    { key: "locked", label: "Zaključan", icon: Lock },
    { key: "finished", label: "Završen", icon: Flag },
  ] as const;
  const currentIdx = steps.findIndex((s) => s.key === tournament.status);

  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/predictor/${tournament.slug}`
      : `/predictor/${tournament.slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-3">
      {/* 4-koraka progres */}
      <div
        className={`rounded-md p-3 ${cardCls(theme)}`}
      >
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={s.key} className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex items-center gap-2 min-w-0 ${idx === steps.length - 1 ? "" : "flex-1"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive
                        ? "bg-amber-500 text-black"
                        : isDone
                          ? theme === "dark"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : theme === "dark"
                            ? "bg-gray-800 text-gray-500 border border-gray-700"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive
                        ? "text-amber-500"
                        : isDone
                          ? theme === "dark"
                            ? "text-emerald-300"
                            : "text-emerald-700"
                          : mutedTextCls(theme)
                    }`}
                  >
                    {idx + 1}. {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight
                    className={`w-4 h-4 mx-1 flex-shrink-0 ${
                      idx < currentIdx
                        ? theme === "dark"
                          ? "text-emerald-700"
                          : "text-emerald-400"
                        : theme === "dark"
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Kontekstualni banner per-status */}
      {tournament.status === "draft" && (
        <div
          className={`rounded-md p-4 border-l-4 border-amber-500 ${
            theme === "dark"
              ? "bg-amber-950/30 border border-amber-900/40"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <Edit3 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold ${headingCls(theme)}`}>
                Turnir je u režimu nacrta
              </h4>
              <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                Korisnici ga još ne vide. Pregledaj <b>Kategorije</b>, dopuni
                <b> Pravila</b> i <b>Nagrade</b>, pa klikni <b>Objavi turnir</b>{" "}
                da bi se pojavio na javnoj stranici.
              </p>
              <button
                onClick={onPublish}
                disabled={publishing}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm disabled:opacity-60 transition-colors"
              >
                <Rocket className="w-4 h-4" />
                {publishing ? "Objavljivanje…" : "Objavi turnir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tournament.status === "published" && (
        <div
          className={`rounded-md p-4 border-l-4 border-emerald-500 ${
            theme === "dark"
              ? "bg-emerald-950/30 border border-emerald-900/40"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <PlayCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold ${headingCls(theme)}`}>
                Turnir je aktivan — korisnici mogu predviđati
              </h4>
              <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                Podijeli link sa članovima. Kad počne prva utakmica,
                ručno <b>zaključaj predikcije</b>.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code
                  className={`text-xs px-3 py-2 rounded-md font-mono ${
                    theme === "dark"
                      ? "bg-gray-900 border border-gray-700 text-emerald-300"
                      : "bg-white border border-gray-300 text-emerald-700"
                  }`}
                >
                  {publicUrl}
                </code>
                <button
                  onClick={copyLink}
                  className={ghostBtnCls(theme) + " inline-flex items-center gap-1.5"}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Kopirano!" : "Kopiraj link"}
                </button>
                <button
                  onClick={onLock}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Zaključaj predikcije
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tournament.status === "locked" && (
        <div
          className={`rounded-md p-4 border-l-4 border-amber-500 ${
            theme === "dark"
              ? "bg-amber-950/30 border border-amber-900/40"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold ${headingCls(theme)}`}>
                Predikcije zaključane — vrijeme za rezultate
              </h4>
              <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                Idi na <b>Kategorije</b> → otvori svaku → klikni{" "}
                <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-500" />{" "}
                pored tačnih opcija → klikni <b>Preračunaj poene</b>. Standings
                se ažuriraju automatski.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={onRescore}
                  disabled={rescoring}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-60 transition-colors"
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${rescoring ? "animate-spin" : ""}`}
                  />
                  Preračunaj poene
                </button>
                <button
                  onClick={onFinish}
                  className={ghostBtnCls(theme) + " inline-flex items-center gap-1.5"}
                >
                  <Flag className="w-4 h-4" />
                  Označi kao završen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tournament.status === "finished" && (
        <div
          className={`rounded-md p-4 border-l-4 border-blue-500 ${
            theme === "dark"
              ? "bg-blue-950/30 border border-blue-900/40"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <Flag className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold ${headingCls(theme)}`}>
                Turnir završen
              </h4>
              <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                Tačni odgovori su javno vidljivi. Provjeri <b>Korisnici</b> tab
                za konačni poredak.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Delete tournament — confirm modal (zahtijeva unos slug-a)
// ============================================================
function DeleteTournamentModal({
  tournament,
  theme,
  onCancel,
  onDeleted,
}: {
  tournament: Tournament;
  theme: string;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirmText.trim() === tournament.slug;

  const doDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/predictor/tournaments?id=${tournament.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Greška pri brisanju");
      }
      onDeleted();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-lg rounded-lg p-6 ${cardCls(theme)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className={`absolute top-3 right-3 ${editBtnCls(theme)}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              theme === "dark"
                ? "bg-red-950/60 text-red-400"
                : "bg-red-100 text-red-600"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${headingCls(theme)}`}>
              Obriši turnir?
            </h3>
            <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
              Ovo briše turnir <b>{tournament.name}</b> sa svim kategorijama,
              opcijama, utakmicama, pravilima, nagradama i predikcijama korisnika.
              Akcija je nepovratna.
            </p>
          </div>
        </div>

        <div className={`rounded-md p-3 mb-3 ${subCardCls(theme)}`}>
          <p className={`text-xs mb-2 ${mutedTextCls(theme)}`}>
            Za potvrdu, otkucaj slug turnira:
          </p>
          <code
            className={`block text-sm font-mono px-2 py-1 rounded mb-3 ${
              theme === "dark"
                ? "bg-gray-900 text-amber-300"
                : "bg-white text-amber-700"
            }`}
          >
            {tournament.slug}
          </code>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={tournament.slug}
            className={inputCls(theme)}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className={ghostBtnCls(theme)}>
            Otkaži
          </button>
          <button
            onClick={doDelete}
            disabled={!canDelete || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Brisanje…" : "Obriši zauvijek"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Single tournament editor with internal tabs
// ============================================================
function TournamentEditor({
  tournament,
  theme,
  onBack,
  onUpdated,
}: {
  tournament: Tournament;
  theme: string;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<ManagerTab>("settings");
  const [rescoring, setRescoring] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [headerToast, setHeaderToast] = useState<SaveToastState>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Poll the pending-approvals count so the tab badge stays fresh
  // whenever the admin lands on this tournament or comes back from
  // approving inside the Approvals tab.
  const refreshPendingCount = useCallback(async () => {
    if (!tournament.require_approval) {
      setPendingCount(0);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/predictor/members?tournament_id=${tournament.id}&status=pending`,
      );
      if (res.ok) {
        const data = (await res.json()) as Array<unknown>;
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      /* ignore network errors — badge just stays stale */
    }
  }, [tournament.id, tournament.require_approval]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount, tab]);

  const rescore = async () => {
    setRescoring(true);
    setHeaderToast(null);
    try {
      const res = await fetch("/api/admin/predictor/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournament.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHeaderToast({
          kind: "error",
          text: j?.error || "Greška pri bodovanju",
        });
      } else {
        setHeaderToast({
          kind: "success",
          text: `Ažurirano ${j.updated ?? 0} predikcija`,
        });
      }
    } finally {
      setRescoring(false);
    }
  };

  const changeStatus = async (newStatus: TournamentStatus) => {
    setPublishing(true);
    try {
      await fetch("/api/admin/predictor/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tournament.id, status: newStatus }),
      });
      await onUpdated();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm ${
            theme === "dark"
              ? "text-gray-300 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Svi turniri
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            theme === "dark"
              ? "bg-red-950/40 border border-red-900/60 text-red-300 hover:bg-red-950/70"
              : "bg-red-50 border border-red-300 text-red-700 hover:bg-red-100"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Obriši turnir
        </button>
      </div>

      {deleteOpen && (
        <DeleteTournamentModal
          tournament={tournament}
          theme={theme}
          onCancel={() => setDeleteOpen(false)}
          onDeleted={() => {
            setDeleteOpen(false);
            onBack();
            onUpdated();
          }}
        />
      )}

      <h2 className={`text-2xl font-bold flex items-center gap-3 flex-wrap ${headingCls(theme)}`}>
        {tournament.logo_url ? (
          <Image
            src={tournament.logo_url}
            alt={tournament.name}
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            unoptimized
          />
        ) : (
          <Trophy
            className={`w-7 h-7 ${ACCENT_ICON_CLASS[tournament.accent_color] ?? "text-amber-500"}`}
          />
        )}
        {tournament.name}
        <span className={`text-sm font-normal font-mono ${subtleTextCls(theme)}`}>
          /{tournament.slug}
        </span>
      </h2>

      <WorkflowBanner
        tournament={tournament}
        theme={theme}
        onPublish={() => changeStatus("published")}
        onLock={() => changeStatus("locked")}
        onFinish={() => changeStatus("finished")}
        onRescore={rescore}
        publishing={publishing}
        rescoring={rescoring}
      />

      <SaveToast
        toast={headerToast}
        onDismiss={() => setHeaderToast(null)}
      />

      <div
        className={`relative -mx-1 px-1 ${
          theme === "dark"
            ? "[--fade-from:#0a0a0a]"
            : "[--fade-from:#fafafa]"
        }`}
      >
        <div
          className={`flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
        >
          {(
            [
              { id: "settings", label: "Postavke", icon: Settings },
              { id: "categories", label: "Kategorije", icon: ListChecks },
              { id: "matches", label: "Utakmice", icon: Swords },
              { id: "approvals", label: "Odobrenja", icon: ShieldCheck },
              { id: "members", label: "Predikcije", icon: Users },
              { id: "rules", label: "Pravila", icon: ScrollText },
              { id: "rewards", label: "Nagrade", icon: Gift },
            ] as const
          ).map((it) => {
            const Icon = it.icon;
            const active = tab === it.id;
            const showPendingBadge =
              it.id === "approvals" && pendingCount > 0;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className={`snap-start inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 border relative ${
                  active
                    ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                    : theme === "dark"
                      ? "bg-gray-900/60 text-gray-300 border-gray-700 hover:border-amber-500/60 hover:text-amber-300"
                      : "bg-white/80 text-gray-700 border-gray-200 hover:border-amber-500/60 hover:text-amber-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                {it.label}
                {showPendingBadge && (
                  <span
                    aria-label={`${pendingCount} zahtjeva na čekanju`}
                    className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums ${
                      active
                        ? "bg-black/85 text-amber-300"
                        : "bg-red-500 text-white ring-2 ring-red-500/40 animate-pulse"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div
          className={`pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l ${
            theme === "dark"
              ? "from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent"
              : "from-[#fafafa] via-[#fafafa]/70 to-transparent"
          }`}
        />
      </div>

      {tab === "settings" && (
        <SettingsTab
          tournament={tournament}
          theme={theme}
          onUpdated={onUpdated}
        />
      )}
      {tab === "categories" && (
        <CategoriesTab tournament={tournament} theme={theme} />
      )}
      {tab === "matches" && (
        <MatchesTab tournament={tournament} theme={theme} />
      )}
      {tab === "rules" && <RulesTab tournament={tournament} theme={theme} />}
      {tab === "rewards" && (
        <RewardsTab tournament={tournament} theme={theme} />
      )}
      {tab === "members" && (
        <MembersTab tournament={tournament} theme={theme} />
      )}
      {tab === "approvals" && (
        <ApprovalsTab
          tournament={tournament}
          theme={theme}
          onPendingChanged={refreshPendingCount}
        />
      )}
    </div>
  );
}

// ============================================================
// Approvals tab — admin odobrava/odbija članove
// ============================================================
function ApprovalsTab({
  tournament,
  theme,
  onPendingChanged,
}: {
  tournament: Tournament;
  theme: string;
  onPendingChanged?: () => void;
}) {
  const [members, setMembers] = useState<TournamentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MemberStatus | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/predictor/members?tournament_id=${tournament.id}`,
      );
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id: string, status: MemberStatus) => {
    const res = await fetch("/api/admin/predictor/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      load();
      onPendingChanged?.();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Ukloni ovog člana iz turnira?")) return;
    const res = await fetch(`/api/admin/predictor/members?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
      onPendingChanged?.();
    }
  };

  const filtered =
    filter === "all" ? members : members.filter((m) => m.status === filter);

  const counts = {
    pending: members.filter((m) => m.status === "pending").length,
    approved: members.filter((m) => m.status === "approved").length,
    rejected: members.filter((m) => m.status === "rejected").length,
    banned: members.filter((m) => m.status === "banned").length,
  };

  if (!tournament.require_approval) {
    return (
      <div
        className={`rounded-lg p-6 ${
          theme === "dark"
            ? "bg-amber-950/30 border border-amber-900/50"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className={`font-bold ${headingCls(theme)}`}>
              Odobrenja su trenutno isključena
            </h3>
            <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
              Svi prijavljeni korisnici mogu odmah predviđati. Da bi koristio
              sistem odobrenja, idi na <b>Postavke</b> i uključi opciju{" "}
              <b>&quot;Zahtijevaj odobrenje admina&quot;</b>. Tada korisnici moraju zatražiti
              učešće, a ti odobravaš/odbijaš zahtjeve ovdje.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const STATUS_BADGE: Record<MemberStatus, string> = {
    pending:
      theme === "dark"
        ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
        : "bg-amber-100 text-amber-700 border-amber-300",
    approved:
      theme === "dark"
        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
        : "bg-emerald-100 text-emerald-700 border-emerald-300",
    rejected:
      theme === "dark"
        ? "bg-red-950/40 text-red-300 border-red-800/60"
        : "bg-red-100 text-red-700 border-red-300",
    banned:
      theme === "dark"
        ? "bg-gray-800 text-gray-400 border-gray-700"
        : "bg-gray-200 text-gray-600 border-gray-300",
  };
  const STATUS_LABEL: Record<MemberStatus, string> = {
    pending: "Na čekanju",
    approved: "Odobren",
    rejected: "Odbijen",
    banned: "Blokiran",
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`font-semibold ${headingCls(theme)}`}>
          Odobrenja korisnika
        </h3>
        <p className={`text-xs ${subtleTextCls(theme)}`}>
          Samo odobreni korisnici mogu predviđati. Standings ostaju javni za sve.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "pending", label: "Na čekanju", count: counts.pending, icon: UserPlus },
            { id: "approved", label: "Odobreni", count: counts.approved, icon: UserCheck },
            { id: "rejected", label: "Odbijeni", count: counts.rejected, icon: UserX },
            { id: "banned", label: "Blokirani", count: counts.banned, icon: Ban },
            { id: "all", label: "Svi", count: members.length, icon: Users },
          ] as const
        ).map((f) => {
          const Icon = f.icon;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                active
                  ? "bg-amber-500 text-black"
                  : theme === "dark"
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-black/20" : theme === "dark" ? "bg-gray-900" : "bg-white"}`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Nema zapisa u ovoj kategoriji.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className={`rounded-md p-3 ${cardCls(theme)}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    theme === "dark" ? "bg-gray-800 text-amber-400" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {(m.user_display_name || m.user_email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${headingCls(theme)}`}>
                    {m.user_display_name || m.user_email?.split("@")[0] || "Korisnik"}
                  </div>
                  <div className={`text-xs ${subtleTextCls(theme)}`}>
                    {m.user_email} · zatraženo{" "}
                    {new Date(m.requested_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[m.status]}`}
                >
                  {STATUS_LABEL[m.status]}
                </span>
                <div className="flex items-center gap-1">
                  {m.status !== "approved" && (
                    <button
                      onClick={() => changeStatus(m.id, "approved")}
                      className={`p-2 rounded-md transition-colors ${
                        theme === "dark"
                          ? "hover:bg-emerald-950/40 text-emerald-400"
                          : "hover:bg-emerald-50 text-emerald-600"
                      }`}
                      title="Odobri"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}
                  {m.status !== "rejected" && (
                    <button
                      onClick={() => changeStatus(m.id, "rejected")}
                      className={`p-2 rounded-md transition-colors ${
                        theme === "dark"
                          ? "hover:bg-red-950/40 text-red-400"
                          : "hover:bg-red-50 text-red-600"
                      }`}
                      title="Odbij"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                  {m.status !== "banned" && (
                    <button
                      onClick={() => changeStatus(m.id, "banned")}
                      className={editBtnCls(theme)}
                      title="Blokiraj"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(m.id)}
                    className={dangerBtnCls(theme)}
                    title="Ukloni"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Matches tab — admin upravlja utakmicama + unos rezultata
// ============================================================
function MatchesTab({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [rescoring, setRescoring] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [toast, setToast] = useState<SaveToastState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/predictor/matches?tournament_id=${tournament.id}`,
      );
      if (res.ok) setMatches(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  const finishedCount = useMemo(
    () => matches.filter((m) => m.status === "finished").length,
    [matches],
  );

  const rescoreAll = async () => {
    if (finishedCount === 0) {
      setToast({
        kind: "error",
        text: "Nema nijedne završene utakmice za bodovanje.",
      });
      return;
    }
    if (
      !confirm(
        `Bodovati sve završene utakmice (${finishedCount})? Postojeći bodovi se prepisuju novim izračunom.`,
      )
    )
      return;
    setRescoring(true);
    try {
      const res = await fetch("/api/admin/predictor/matches/rescore-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournament.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({
          kind: "success",
          text: `Bodovano ${j.scored_matches ?? 0} utakmica · ${j.updated_predictions ?? 0} predikcija`,
        });
      } else {
        setToast({
          kind: "error",
          text: j.error || "Greška pri bodovanju",
        });
      }
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message ?? "Greška pri bodovanju" });
    } finally {
      setRescoring(false);
    }
  };

  const removeMatch = async (id: string) => {
    if (!confirm("Obriši ovu utakmicu i sve njene predikcije?")) return;
    const res = await fetch(`/api/admin/predictor/matches?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  };

  const promoteKnockout = async () => {
    if (
      !confirm(
        "Popuniti knockout fazu na osnovu rezultata grupne faze i prethodnih nokaut rundi? Mijenjaju se samo SCHEDULED utakmice sa placeholder timovima (1A, 2B, Pob. R32-X, ...).",
      )
    )
      return;
    setPromoting(true);
    try {
      const res = await fetch(
        "/api/admin/predictor/matches/promote-knockout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournament_id: tournament.id }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ kind: "error", text: j.error || "Greška pri popunjavanju" });
        return;
      }
      const updated = j.updated_count ?? 0;
      const unresolved: Array<{
        match_label: string | null;
        reasons: string[];
      }> = j.unresolved ?? [];
      if (updated === 0 && unresolved.length === 0) {
        setToast({
          kind: "success",
          text: "Sve knockout utakmice već imaju popunjene timove.",
        });
      } else if (unresolved.length === 0) {
        setToast({
          kind: "success",
          text: `Popunjeno ${updated} knockout utakmica.`,
        });
      } else {
        const top = unresolved
          .slice(0, 3)
          .map(
            (u) =>
              `${u.match_label ?? "?"}: ${u.reasons.join("; ") || "nepoznato"}`,
          )
          .join(" · ");
        const more =
          unresolved.length > 3 ? ` (+ još ${unresolved.length - 3})` : "";
        setToast({
          kind: updated > 0 ? "success" : "error",
          text: `Popunjeno ${updated}. Nerazriješeno ${unresolved.length}: ${top}${more}`,
        });
      }
      await load();
    } catch (e: any) {
      setToast({
        kind: "error",
        text: e?.message ?? "Greška pri popunjavanju",
      });
    } finally {
      setPromoting(false);
    }
  };

  // grupiši po fazi
  const byStage = useMemo(() => {
    const m = new Map<string, Match[]>();
    for (const match of matches) {
      const arr = m.get(match.stage) ?? [];
      arr.push(match);
      m.set(match.stage, arr);
    }
    return Array.from(m.entries()).sort((a, b) => {
      const order = [
        "group_a", "group_b", "group_c", "group_d", "group_e", "group_f",
        "group_g", "group_h", "group_i", "group_j", "group_k", "group_l",
        "group", "round_of_32", "round_of_16", "quarter_final",
        "semi_final", "third_place", "final", "other",
      ];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });
  }, [matches]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`font-semibold ${headingCls(theme)}`}>
            Utakmice turnira
          </h3>
          <p className={`text-xs ${subtleTextCls(theme)}`}>
            Predikcije se automatski zaključavaju u trenutku kickoff-a.
            Korisnici dobijaju poene po: <b>tačan rezultat</b> ({" "}
            <span className="text-amber-500">5</span> pts) ·{" "}
            <b>tačna razlika</b> (<span className="text-amber-500">3</span> pts) ·{" "}
            <b>tačan pobjednik</b> (<span className="text-amber-500">2</span> pts).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={rescoreAll}
            disabled={rescoring || finishedCount === 0}
            title={
              finishedCount === 0
                ? "Nema završenih utakmica"
                : `Boduj sve završene utakmice (${finishedCount})`
            }
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/60"
                : "bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {rescoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            {rescoring
              ? "Bodovanje…"
              : `Boduj sve utakmice${finishedCount > 0 ? ` (${finishedCount})` : ""}`}
          </button>
          <button
            onClick={promoteKnockout}
            disabled={promoting}
            title="Auto-popuni nokaut utakmice (1A, 2B, Pob. R32-X…) na osnovu rezultata"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "bg-purple-950/40 border border-purple-800/60 text-purple-300 hover:bg-purple-950/60"
                : "bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-100"
            }`}
          >
            {promoting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {promoting ? "Popunjavanje…" : "Popuni knockout"}
          </button>
          <button
            onClick={() => setBulkOpen(true)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              theme === "dark"
                ? "bg-blue-950/40 border border-blue-800/60 text-blue-300 hover:bg-blue-950/60"
                : "bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Download className="w-4 h-4" />
            Uvezi više utakmica
          </button>
          <button onClick={() => setCreating(true)} className={primaryBtnCls}>
            <Plus className="w-4 h-4" /> Dodaj utakmicu
          </button>
        </div>
      </div>
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />

      {creating && (
        <MatchForm
          tournamentId={tournament.id}
          theme={theme}
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}

      {bulkOpen && (
        <BulkMatchImport
          tournamentId={tournament.id}
          theme={theme}
          onClose={() => setBulkOpen(false)}
          onImported={async () => {
            setBulkOpen(false);
            await load();
          }}
        />
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : matches.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema utakmica. Dodaj pojedinačno ili uvezi grupu kroz{" "}
          <b>Tekst lista</b>.
        </div>
      ) : (
        <div className="space-y-5">
          {byStage.map(([stage, list]) => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-amber-500" />
                <h4 className={`text-sm font-bold uppercase tracking-wide ${headingCls(theme)}`}>
                  {STAGE_LABEL[stage] ?? stage}
                </h4>
                <span className={`text-xs ${subtleTextCls(theme)}`}>
                  ({list.length})
                </span>
              </div>
              <div className="space-y-2">
                {list.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    theme={theme}
                    editing={editingId === m.id}
                    showResult={resultId === m.id}
                    onEdit={() =>
                      setEditingId(editingId === m.id ? null : m.id)
                    }
                    onResult={() =>
                      setResultId(resultId === m.id ? null : m.id)
                    }
                    onDelete={() => removeMatch(m.id)}
                    onUpdated={async () => {
                      setEditingId(null);
                      setResultId(null);
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchRow({
  match,
  theme,
  editing,
  showResult,
  onEdit,
  onResult,
  onDelete,
  onUpdated,
}: {
  match: Match;
  theme: string;
  editing: boolean;
  showResult: boolean;
  onEdit: () => void;
  onResult: () => void;
  onDelete: () => void;
  onUpdated: () => void;
}) {
  // automatski zaključano ako kickoff_at prošao (osim ako force_unlocked)
  const now = Date.now();
  const autoLocked =
    match.status !== "scheduled" ||
    (match.kickoff_at != null && now >= Date.parse(match.kickoff_at));
  const effectivelyLocked = autoLocked && !match.force_unlocked;

  const toggleUnlock = async () => {
    await fetch("/api/admin/predictor/matches", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: match.id,
        force_unlocked: !match.force_unlocked,
      }),
    });
    onUpdated();
  };

  return (
    <div className={`rounded-md p-3 ${cardCls(theme)}`}>
      {/* Top meta row: status + lock badges */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${MATCH_STATUS_CLASS(theme, match.status)}`}
        >
          {MATCH_STATUS_LABEL[match.status]}
        </span>

        {match.force_unlocked && (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
              theme === "dark"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                : "bg-emerald-100 text-emerald-700 border-emerald-300"
            }`}
            title="Admin je ručno otključao — predikcije ostaju otvorene poslije kickoffa"
          >
            <Unlock className="w-3 h-3" />
            Otključano ručno
          </span>
        )}
        {effectivelyLocked && !match.force_unlocked && (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
              theme === "dark"
                ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                : "bg-amber-100 text-amber-700 border-amber-300"
            }`}
            title="Predikcije zaključane (kickoff prošao ili status nije scheduled)"
          >
            <Lock className="w-3 h-3" />
            Zaključano
          </span>
        )}

        {match.kickoff_at && (
          <span
            className={`text-xs inline-flex items-center gap-1 ml-auto ${mutedTextCls(theme)}`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            {new Date(match.kickoff_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Teams row — stacked on mobile, dense on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.home_logo_url && (
            <Image
              src={match.home_logo_url}
              alt={match.home_team}
              width={24}
              height={16}
              className="object-contain rounded-sm flex-shrink-0"
              unoptimized
            />
          )}
          <span
            className={`text-sm font-semibold truncate flex-1 min-w-0 ${headingCls(theme)}`}
          >
            {match.home_team}
          </span>
          {match.home_score != null && (
            <span
              className={`text-base font-black tabular-nums ${headingCls(theme)}`}
            >
              {match.home_score}
            </span>
          )}
        </div>

        <span
          className={`hidden sm:inline text-xs font-bold ${mutedTextCls(theme)}`}
        >
          vs
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.away_logo_url && (
            <Image
              src={match.away_logo_url}
              alt={match.away_team}
              width={24}
              height={16}
              className="object-contain rounded-sm flex-shrink-0"
              unoptimized
            />
          )}
          <span
            className={`text-sm font-semibold truncate flex-1 min-w-0 ${headingCls(theme)}`}
          >
            {match.away_team}
          </span>
          {match.away_score != null && (
            <span
              className={`text-base font-black tabular-nums ${headingCls(theme)}`}
            >
              {match.away_score}
            </span>
          )}
        </div>
      </div>

      {/* Venue row */}
      {match.venue && (
        <div
          className={`mt-2 text-xs inline-flex items-center gap-1 ${mutedTextCls(theme)}`}
        >
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>
      )}

      {/* Actions row */}
      <div
        className={`mt-3 pt-2 border-t flex items-center justify-end gap-1 ${
          theme === "dark" ? "border-gray-800" : "border-gray-200"
        }`}
      >
        {(autoLocked || match.force_unlocked) && match.status === "scheduled" && (
          <button
            onClick={toggleUnlock}
            className={`p-2 rounded-md transition-colors ${
              match.force_unlocked
                ? theme === "dark"
                  ? "bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300"
                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                : theme === "dark"
                  ? "hover:bg-amber-950/40 text-amber-300"
                  : "hover:bg-amber-50 text-amber-700"
            }`}
            title={
              match.force_unlocked
                ? "Vrati na automatsko zaključavanje"
                : "Ručno otključaj (produži rok)"
            }
          >
            {match.force_unlocked ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={onResult}
          className={`p-2 rounded-md transition-colors ${
            theme === "dark"
              ? "hover:bg-emerald-950/40 text-emerald-300"
              : "hover:bg-emerald-50 text-emerald-700"
          }`}
          title="Unesi rezultat"
        >
          <Flag className="w-4 h-4" />
        </button>
        <button onClick={onEdit} className={editBtnCls(theme)} title="Uredi">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className={dangerBtnCls(theme)} title="Obriši">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showResult && (
        <MatchResultForm
          match={match}
          theme={theme}
          onCancel={onResult}
          onSaved={onUpdated}
        />
      )}

      {editing && (
        <div
          className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
        >
          <MatchForm
            tournamentId={match.tournament_id}
            theme={theme}
            initial={match}
            onCancel={onEdit}
            onSaved={onUpdated}
          />
        </div>
      )}
    </div>
  );
}

function MatchForm({
  tournamentId,
  theme,
  initial,
  onCancel,
  onSaved,
}: {
  tournamentId: string;
  theme: string;
  initial?: Match;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [stage, setStage] = useState(initial?.stage ?? "group");
  const [homeTeam, setHomeTeam] = useState(initial?.home_team ?? "");
  const [homeTeamEn, setHomeTeamEn] = useState(initial?.home_team_en ?? "");
  const [awayTeam, setAwayTeam] = useState(initial?.away_team ?? "");
  const [awayTeamEn, setAwayTeamEn] = useState(initial?.away_team_en ?? "");
  const [homeCode, setHomeCode] = useState(initial?.home_team_code ?? "");
  const [awayCode, setAwayCode] = useState(initial?.away_team_code ?? "");
  const [kickoff, setKickoff] = useState(dtLocal(initial?.kickoff_at ?? null));
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [venueEn, setVenueEn] = useState(initial?.venue_en ?? "");
  const [pExact, setPExact] = useState(initial?.points_exact ?? 5);
  const [pDiff, setPDiff] = useState(initial?.points_diff ?? 3);
  const [pWinner, setPWinner] = useState(initial?.points_winner ?? 2);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!homeTeam.trim() || !awayTeam.trim()) {
      return setErr("Naziv obje ekipe je obavezan");
    }
    setSaving(true);
    try {
      const flagFromCode = (cc: string) =>
        cc ? `https://flagcdn.com/w80/${cc.toLowerCase()}.png` : null;
      const body = {
        ...(initial ? { id: initial.id } : { tournament_id: tournamentId }),
        stage,
        stage_label: STAGE_LABEL[stage] ?? null,
        stage_label_en: STAGE_LABEL_EN[stage] ?? null,
        home_team: homeTeam,
        home_team_en: homeTeamEn || null,
        away_team: awayTeam,
        away_team_en: awayTeamEn || null,
        home_team_code: homeCode || null,
        away_team_code: awayCode || null,
        home_logo_url: homeCode ? flagFromCode(homeCode) : null,
        away_logo_url: awayCode ? flagFromCode(awayCode) : null,
        kickoff_at: fromDtLocal(kickoff),
        venue: venue || null,
        venue_en: venueEn || null,
        points_exact: pExact,
        points_diff: pDiff,
        points_winner: pWinner,
      };
      const res = await fetch("/api/admin/predictor/matches", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Greška");
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-3 rounded-md p-4 ${subCardCls(theme)}`}>
      <div className="grid md:grid-cols-3 gap-3">
        <Field theme={theme} label="Faza">
          <Select
            theme={theme}
            value={stage}
            onChange={setStage}
            options={Object.entries(STAGE_LABEL).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </Field>
        <Field theme={theme} label="Početak (kickoff)">
          <Input
            theme={theme}
            type="datetime-local"
            value={kickoff}
            onChange={setKickoff}
          />
        </Field>
        <Field theme={theme} label="Stadion (BS)">
          <Input theme={theme} value={venue} onChange={setVenue} />
        </Field>
        <Field theme={theme} label="Venue (EN)">
          <Input theme={theme} value={venueEn} onChange={setVenueEn} />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Field theme={theme} label="Domaćin (BS)">
            <Input
              theme={theme}
              value={homeTeam}
              onChange={setHomeTeam}
              placeholder="npr. Brazil"
            />
          </Field>
          <Field theme={theme} label="Kod" hint="zastava">
            <Input
              theme={theme}
              value={homeCode}
              onChange={(v) => setHomeCode(v.toLowerCase())}
              placeholder="br"
            />
          </Field>
          {homeCode && (
            <div className="flex items-end justify-center">
              <Image
                src={`https://flagcdn.com/w80/${homeCode.toLowerCase()}.png`}
                alt=""
                width={48}
                height={36}
                className="object-contain rounded"
                unoptimized
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field theme={theme} label="Gost (BS)">
            <Input
              theme={theme}
              value={awayTeam}
              onChange={setAwayTeam}
              placeholder="npr. Argentina"
            />
          </Field>
          <Field theme={theme} label="Kod" hint="zastava">
            <Input
              theme={theme}
              value={awayCode}
              onChange={(v) => setAwayCode(v.toLowerCase())}
              placeholder="ar"
            />
          </Field>
          {awayCode && (
            <div className="flex items-end justify-center">
              <Image
                src={`https://flagcdn.com/w80/${awayCode.toLowerCase()}.png`}
                alt=""
                width={48}
                height={36}
                className="object-contain rounded"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Home team (EN)" hint="opcionalno — engleski naziv ekipe">
          <Input
            theme={theme}
            value={homeTeamEn}
            onChange={setHomeTeamEn}
            placeholder="e.g. Brazil"
          />
        </Field>
        <Field theme={theme} label="Away team (EN)" hint="opcionalno — engleski naziv ekipe">
          <Input
            theme={theme}
            value={awayTeamEn}
            onChange={setAwayTeamEn}
            placeholder="e.g. Argentina"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field theme={theme} label="Tačan rezultat">
          <Input
            theme={theme}
            type="number"
            value={String(pExact)}
            onChange={(v) => setPExact(Number(v) || 0)}
          />
        </Field>
        <Field theme={theme} label="Tačna razlika">
          <Input
            theme={theme}
            type="number"
            value={String(pDiff)}
            onChange={(v) => setPDiff(Number(v) || 0)}
          />
        </Field>
        <Field theme={theme} label="Tačan pobjednik">
          <Input
            theme={theme}
            type="number"
            value={String(pWinner)}
            onChange={(v) => setPWinner(Number(v) || 0)}
          />
        </Field>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className={ghostBtnCls(theme)}>
          Otkaži
        </button>
        <button onClick={save} disabled={saving} className={primaryBtnCls}>
          {saving ? "Čuvanje…" : initial ? "Sačuvaj" : "Dodaj utakmicu"}
        </button>
      </div>
    </div>
  );
}

function MatchResultForm({
  match,
  theme,
  onCancel,
  onSaved,
}: {
  match: Match;
  theme: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [home, setHome] = useState<number | null>(match.home_score ?? null);
  const [away, setAway] = useState<number | null>(match.away_score ?? null);
  const [status, setStatus] = useState<MatchStatus>(
    match.status === "finished" ? "finished" : "finished",
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<SaveToastState>(null);

  const save = async () => {
    if (home == null || away == null) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/predictor/matches/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          home_score: home,
          away_score: away,
          status,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Greška");
      setToast({
        kind: "success",
        text: `Rezultat upisan · bodovano ${j.updated ?? 0} predikcija`,
      });
      setTimeout(onSaved, 900);
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message || "Greška pri bodovanju" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
    >
      <div className="flex items-end gap-3 flex-wrap">
        <Field theme={theme} label={match.home_team}>
          <input
            type="number"
            min={0}
            value={home ?? ""}
            onChange={(e) =>
              setHome(e.target.value === "" ? null : Number(e.target.value))
            }
            className={`${inputCls(theme)} !w-20 text-center text-lg font-bold`}
            placeholder="0"
          />
        </Field>
        <span className="pb-2 text-xl font-bold">:</span>
        <Field theme={theme} label={match.away_team}>
          <input
            type="number"
            min={0}
            value={away ?? ""}
            onChange={(e) =>
              setAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className={`${inputCls(theme)} !w-20 text-center text-lg font-bold`}
            placeholder="0"
          />
        </Field>
        <Field theme={theme} label="Status">
          <Select
            theme={theme}
            value={status}
            onChange={(v) => setStatus(v as MatchStatus)}
            options={[
              { value: "finished", label: "Završena" },
              { value: "live", label: "UŽIVO" },
              { value: "postponed", label: "Odgođena" },
              { value: "cancelled", label: "Otkazana" },
            ]}
          />
        </Field>
        <button
          onClick={save}
          disabled={saving || home == null || away == null}
          className={`${primaryBtnCls} ${saving ? "" : "bg-emerald-500 hover:bg-emerald-400"}`}
        >
          <Save className="w-4 h-4" />
          {saving ? "Bodovanje…" : "Snimi i boduj"}
        </button>
        <button onClick={onCancel} className={ghostBtnCls(theme)}>
          Otkaži
        </button>
      </div>
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

type ImportMode = "quick" | "bulk" | "templates";

function BulkMatchImport({
  tournamentId,
  theme,
  onClose,
  onImported,
}: {
  tournamentId: string;
  theme: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [mode, setMode] = useState<ImportMode>("quick");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-t-2xl sm:rounded-lg p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto ${cardCls(theme)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-10 ${editBtnCls(theme)}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1 pr-10">
          <ClipboardPaste className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <h3 className={`text-lg sm:text-xl font-bold truncate ${headingCls(theme)}`}>
            Uvezi utakmice
          </h3>
        </div>
        <p className={`text-xs sm:text-sm mb-4 ${mutedTextCls(theme)}`}>
          Tri načina za dodavanje više utakmica odjednom.
        </p>

        {/* sub-tabs — pill style, scrollable on mobile */}
        <div
          className={`flex gap-1.5 sm:gap-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
        >
          {(
            [
              { id: "quick", label: "Brzi dnevni unos", icon: CalendarClock },
              { id: "templates", label: "Šabloni", icon: Library },
              { id: "bulk", label: "Tekst lista", icon: ClipboardPaste },
            ] as const
          ).map((it) => {
            const Icon = it.icon;
            const active = mode === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setMode(it.id)}
                className={`snap-start inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 border ${
                  active
                    ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                    : theme === "dark"
                      ? "bg-gray-900/60 text-gray-300 border-gray-700 hover:border-amber-500/60 hover:text-amber-300"
                      : "bg-white/80 text-gray-700 border-gray-200 hover:border-amber-500/60 hover:text-amber-700"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {it.label}
              </button>
            );
          })}
        </div>

        {mode === "quick" && (
          <QuickDayImport
            tournamentId={tournamentId}
            theme={theme}
            onImported={onImported}
          />
        )}
        {mode === "bulk" && (
          <BulkPasteImport
            tournamentId={tournamentId}
            theme={theme}
            onImported={onImported}
          />
        )}
        {mode === "templates" && (
          <MatchTemplateImport
            tournamentId={tournamentId}
            theme={theme}
            onImported={onImported}
          />
        )}
      </div>
    </div>
  );
}

// ----- Quick day mode: izaberi datum + fazu, dodaj rows ----------------
type QuickRow = {
  time: string;
  home: string;
  homeCode: string;
  away: string;
  awayCode: string;
  venue: string;
};
const emptyRow = (): QuickRow => ({
  time: "20:00",
  home: "",
  homeCode: "",
  away: "",
  awayCode: "",
  venue: "",
});

function QuickDayImport({
  tournamentId,
  theme,
  onImported,
}: {
  tournamentId: string;
  theme: string;
  onImported: () => void;
}) {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  const [date, setDate] = useState(isoDate);
  const [stage, setStage] = useState("group");
  const [rows, setRows] = useState<QuickRow[]>([
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<SaveToastState>(null);

  const updateRow = (idx: number, patch: Partial<QuickRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx: number) =>
    setRows((rs) => rs.filter((_, i) => i !== idx));

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);

  const importRows = async () => {
    setToast(null);
    const valid = rows.filter((r) => r.home.trim() && r.away.trim());
    if (valid.length === 0) {
      setToast({
        kind: "error",
        text: "Nema utakmica — popuni barem jedan red.",
      });
      return;
    }
    setSaving(true);
    try {
      const flag = (cc: string) =>
        cc ? `https://flagcdn.com/w80/${cc.toLowerCase()}.png` : null;
      const matches = valid.map((r, idx) => {
        const kickoffIso = r.time
          ? new Date(`${date}T${r.time}:00`).toISOString()
          : null;
        return {
          stage,
          stage_label: STAGE_LABEL[stage] ?? null,
          home_team: r.home.trim(),
          away_team: r.away.trim(),
          home_team_code: r.homeCode || null,
          away_team_code: r.awayCode || null,
          home_logo_url: flag(r.homeCode),
          away_logo_url: flag(r.awayCode),
          kickoff_at: kickoffIso,
          venue: r.venue || null,
          sort_order: idx,
        };
      });

      const res = await fetch("/api/admin/predictor/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, matches }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Greška");
      setToast({
        kind: "success",
        text: `Uvezeno ${j.inserted ?? 0} utakmica`,
      });
      setTimeout(onImported, 800);
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message || "Greška pri uvozu" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className={`text-sm ${mutedTextCls(theme)}`}>
        Idealno za <b>dnevno dodavanje</b> — biraš dan i fazu jednom, pa
        ispisuješ red po red. Sistem auto-dodaje zastave preko ISO kodova
        (npr. <code>br</code>, <code>ar</code>, <code>mx</code>).
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Datum (svih utakmica)">
          <Input
            theme={theme}
            type="date"
            value={date}
            onChange={setDate}
          />
        </Field>
        <Field theme={theme} label="Faza (svih utakmica)">
          <Select
            theme={theme}
            value={stage}
            onChange={setStage}
            options={Object.entries(STAGE_LABEL).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </Field>
      </div>

      <div className="space-y-3">
        {/* Desktop-only column header */}
        <div
          className={`hidden md:grid md:grid-cols-[80px_1fr_70px_30px_1fr_70px_120px_30px] gap-2 px-2 text-[10px] uppercase font-bold ${mutedTextCls(theme)}`}
        >
          <span>Vrijeme</span>
          <span>Domaćin</span>
          <span>Kod</span>
          <span></span>
          <span>Gost</span>
          <span>Kod</span>
          <span>Stadion</span>
          <span></span>
        </div>
        {rows.map((r, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-md md:p-2 ${subCardCls(theme)}`}
          >
            {/* Desktop: dense grid */}
            <div className="hidden md:grid md:grid-cols-[80px_1fr_70px_30px_1fr_70px_120px_30px] gap-2 items-center">
              <input
                type="time"
                value={r.time}
                onChange={(e) => updateRow(idx, { time: e.target.value })}
                className={inputCls(theme)}
              />
              <input
                value={r.home}
                onChange={(e) => updateRow(idx, { home: e.target.value })}
                placeholder="Brazil"
                className={inputCls(theme)}
              />
              <input
                value={r.homeCode}
                onChange={(e) =>
                  updateRow(idx, { homeCode: e.target.value.toLowerCase() })
                }
                placeholder="br"
                className={inputCls(theme)}
              />
              <span
                className={`text-center text-xs font-bold ${mutedTextCls(theme)}`}
              >
                vs
              </span>
              <input
                value={r.away}
                onChange={(e) => updateRow(idx, { away: e.target.value })}
                placeholder="Argentina"
                className={inputCls(theme)}
              />
              <input
                value={r.awayCode}
                onChange={(e) =>
                  updateRow(idx, { awayCode: e.target.value.toLowerCase() })
                }
                placeholder="ar"
                className={inputCls(theme)}
              />
              <input
                value={r.venue}
                onChange={(e) => updateRow(idx, { venue: e.target.value })}
                placeholder="MetLife"
                className={inputCls(theme)}
              />
              <button
                onClick={() => removeRow(idx)}
                className={dangerBtnCls(theme)}
                disabled={rows.length <= 1}
                title="Ukloni red"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile: stacked card */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${mutedTextCls(theme)}`}
                >
                  Utakmica {idx + 1}
                </span>
                <button
                  onClick={() => removeRow(idx)}
                  className={dangerBtnCls(theme)}
                  disabled={rows.length <= 1}
                  title="Ukloni red"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label
                  className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                >
                  Vrijeme
                </label>
                <input
                  type="time"
                  value={r.time}
                  onChange={(e) => updateRow(idx, { time: e.target.value })}
                  className={`${inputCls(theme)} w-full`}
                />
              </div>

              <div className="grid grid-cols-[1fr_72px] gap-2">
                <div>
                  <label
                    className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                  >
                    Domaćin
                  </label>
                  <input
                    value={r.home}
                    onChange={(e) => updateRow(idx, { home: e.target.value })}
                    placeholder="Brazil"
                    className={`${inputCls(theme)} w-full`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                  >
                    Kod
                  </label>
                  <input
                    value={r.homeCode}
                    onChange={(e) =>
                      updateRow(idx, {
                        homeCode: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="br"
                    className={`${inputCls(theme)} w-full`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 h-px ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[10px] uppercase font-bold ${mutedTextCls(theme)}`}
                >
                  vs
                </span>
                <div
                  className={`flex-1 h-px ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                />
              </div>

              <div className="grid grid-cols-[1fr_72px] gap-2">
                <div>
                  <label
                    className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                  >
                    Gost
                  </label>
                  <input
                    value={r.away}
                    onChange={(e) => updateRow(idx, { away: e.target.value })}
                    placeholder="Argentina"
                    className={`${inputCls(theme)} w-full`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                  >
                    Kod
                  </label>
                  <input
                    value={r.awayCode}
                    onChange={(e) =>
                      updateRow(idx, {
                        awayCode: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="ar"
                    className={`${inputCls(theme)} w-full`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-[10px] uppercase font-bold mb-1 ${mutedTextCls(theme)}`}
                >
                  Stadion
                </label>
                <input
                  value={r.venue}
                  onChange={(e) => updateRow(idx, { venue: e.target.value })}
                  placeholder="MetLife"
                  className={`${inputCls(theme)} w-full`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className={`${ghostBtnCls(theme)} inline-flex items-center gap-2 w-full justify-center`}
      >
        <Plus className="w-4 h-4" /> Dodaj red
      </button>

      <SaveToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="flex justify-end gap-2">
        <button
          onClick={importRows}
          disabled={saving}
          className={primaryBtnCls}
        >
          <Download className="w-4 h-4" />
          {saving ? "Uvoz…" : `Uvezi ${rows.filter((r) => r.home && r.away).length} utakmica`}
        </button>
      </div>
    </div>
  );
}

// ----- Bulk paste textarea (originalna logika) -----
function BulkPasteImport({
  tournamentId,
  theme,
  onImported,
}: {
  tournamentId: string;
  theme: string;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState<SaveToastState>(null);

  const example = `# Format (jedna utakmica po liniji):
# Faza | YYYY-MM-DD HH:MM | Domaćin (kod) | Gost (kod) | Stadion(opc.)
#
# Primjer:
group_a | 2026-06-11 20:00 | Meksiko (mx) | Iran (ir) | Estadio Azteca
group_a | 2026-06-12 21:00 | SAD (us) | Novi Zeland (nz) | SoFi Stadium
round_of_16 | 2026-07-04 21:00 | Brazil (br) | Argentina (ar) | MetLife Stadium`;

  const parseAndImport = async () => {
    setToast(null);
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    const matches: any[] = [];
    for (const line of lines) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 4) continue;
      const [stage, kickoff, home, away, venue] = parts;
      const extract = (s: string) => {
        const m = s.match(/^(.*?)\s*\(([a-zA-Z-]+)\)\s*$/);
        return m
          ? { team: m[1].trim(), code: m[2].toLowerCase() }
          : { team: s.trim(), code: "" };
      };
      const h = extract(home);
      const a = extract(away);
      const flag = (cc: string) =>
        cc ? `https://flagcdn.com/w80/${cc}.png` : null;
      let kickoffIso: string | null = null;
      if (kickoff) {
        const d = new Date(kickoff.replace(" ", "T"));
        if (!Number.isNaN(d.getTime())) kickoffIso = d.toISOString();
      }
      matches.push({
        stage: stage || "group",
        stage_label: STAGE_LABEL[stage] ?? null,
        home_team: h.team,
        away_team: a.team,
        home_team_code: h.code || null,
        away_team_code: a.code || null,
        home_logo_url: flag(h.code),
        away_logo_url: flag(a.code),
        kickoff_at: kickoffIso,
        venue: venue || null,
      });
    }

    if (matches.length === 0) {
      setToast({
        kind: "error",
        text: "Nije parsirana nijedna utakmica. Provjeri format.",
      });
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/admin/predictor/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, matches }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Greška");
      setToast({
        kind: "success",
        text: `Uvezeno ${j.inserted ?? 0} utakmica`,
      });
      setTimeout(onImported, 800);
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message || "Greška pri uvozu" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-sm ${mutedTextCls(theme)}`}>
        Nalijepi cijeli raspored — npr. kopiraj iz Wikipedia/ESPN/Excel i
        formatiraj liniju po liniji u dolje navedenom formatu.
      </p>
      <Textarea theme={theme} value={text} onChange={setText} rows={12} />
      <details className="text-xs">
        <summary className={`cursor-pointer font-semibold ${mutedTextCls(theme)}`}>
          Format i primjer
        </summary>
        <pre
          className={`mt-2 p-3 rounded-md whitespace-pre-wrap font-mono text-xs ${
            theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
          }`}
        >
          {example}
        </pre>
      </details>
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
      <div className="flex justify-end">
        <button onClick={parseAndImport} disabled={parsing} className={primaryBtnCls}>
          <Download className="w-4 h-4" />
          {parsing ? "Uvoz…" : "Uvezi"}
        </button>
      </div>
    </div>
  );
}

// ----- Match templates picker -----
type MatchTemplateSummary = {
  id: string;
  name: string;
  description: string;
  count: number;
  tag: string | null;
};

function MatchTemplateImport({
  tournamentId,
  theme,
  onImported,
}: {
  tournamentId: string;
  theme: string;
  onImported: () => void;
}) {
  const [templates, setTemplates] = useState<MatchTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [toast, setToast] = useState<SaveToastState>(null);

  useEffect(() => {
    fetch("/api/admin/predictor/match-templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTemplates(d ?? []))
      .finally(() => setLoading(false));
  }, []);

  const importTpl = async (id: string) => {
    setImportingId(id);
    setToast(null);
    try {
      const res = await fetch(
        "/api/admin/predictor/match-templates/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournament_id: tournamentId, template_id: id }),
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Greška");
      setToast({
        kind: "success",
        text: `Uvezeno ${j.inserted ?? 0} utakmica`,
      });
      setTimeout(onImported, 800);
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message || "Greška pri uvozu" });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-sm ${mutedTextCls(theme)}`}>
        Predefinisani rasporedi koje možeš uvesti odmah, pa urediti detalje
        (datume, protivnike). Idealno za <b>SP 2026</b>, nokaut faze i slično.
      </p>
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`rounded-md p-4 flex items-start gap-3 ${subCardCls(theme)}`}
            >
              <Library className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-bold ${headingCls(theme)}`}>{t.name}</h4>
                  <span className={accentChipCls(theme)}>
                    {t.count} utakmica
                  </span>
                  {t.tag && <span className={chipCls(theme)}>{t.tag}</span>}
                </div>
                <p className={`text-sm mt-1 ${mutedTextCls(theme)}`}>
                  {t.description}
                </p>
              </div>
              <button
                onClick={() => importTpl(t.id)}
                disabled={importingId === t.id}
                className={`${primaryBtnCls} flex-shrink-0`}
              >
                {importingId === t.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uvoz…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Uvezi
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

// ============================================================
// Members tab — admin pregled svih korisničkih predikcija
// ============================================================
type AdminPredictionRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  category_id: string;
  category_name: string;
  category_type: string;
  selected_option_ids: string[];
  text_value: string | null;
  numeric_value: number | null;
  score_home: number | null;
  score_away: number | null;
  points_awarded: number;
  is_scored: boolean;
  option_labels: string[];
  created_at: string;
  updated_at: string;
};

type MemberSummary = {
  user_id: string;
  user_display_name: string | null;
  user_email: string | null;
  predictions_count: number;
  total_points: number;
  rank: number;
};

function MembersTab({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const [rows, setRows] = useState<AdminPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/predictor/predictions?tournament_id=${tournament.id}`,
      );
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  // reset stranice kada se promijeni pretraga ili veličina stranice
  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  // sumiranje po korisniku + ranking
  const members: MemberSummary[] = useMemo(() => {
    const map = new Map<string, MemberSummary>();
    for (const r of rows) {
      const cur = map.get(r.user_id) ?? {
        user_id: r.user_id,
        user_display_name: r.user_display_name,
        user_email: r.user_email,
        predictions_count: 0,
        total_points: 0,
        rank: 0,
      };
      cur.predictions_count += 1;
      cur.total_points += r.points_awarded ?? 0;
      if (!cur.user_display_name && r.user_display_name) {
        cur.user_display_name = r.user_display_name;
      }
      map.set(r.user_id, cur);
    }
    const arr = Array.from(map.values()).sort(
      (a, b) => b.total_points - a.total_points,
    );
    arr.forEach((m, idx) => (m.rank = idx + 1));
    return arr;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!query) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        (m.user_display_name ?? "").toLowerCase().includes(q) ||
        (m.user_email ?? "").toLowerCase().includes(q),
    );
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`font-semibold ${headingCls(theme)}`}>
            Korisnici i njihove predikcije
          </h3>
          <p className={`text-xs ${subtleTextCls(theme)}`}>
            Pregled svake predikcije, ukupnih poena i konačnog poretka.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži po imenu ili e-mailu…"
          className={`${inputCls(theme)} max-w-xs`}
        />
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : members.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još niko nije podnio predikciju.
        </div>
      ) : (
        <div className={`rounded-md overflow-hidden ${cardCls(theme)}`}>
          <table className="w-full text-sm">
            <thead
              className={`text-xs uppercase ${
                theme === "dark"
                  ? "bg-gray-800 text-gray-400"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Korisnik</th>
                <th className="px-3 py-2 text-right">Predikcija</th>
                <th className="px-3 py-2 text-right">Poena</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((m) => (
                <Fragment key={m.user_id}>
                  <tr
                    className={`border-t cursor-pointer transition-colors ${
                      theme === "dark"
                        ? "border-gray-800 hover:bg-gray-800/40"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setOpenUser(openUser === m.user_id ? null : m.user_id)
                    }
                  >
                    <td className="px-3 py-2 font-bold">
                      {m.rank === 1
                        ? "🥇"
                        : m.rank === 2
                          ? "🥈"
                          : m.rank === 3
                            ? "🥉"
                            : m.rank}
                    </td>
                    <td className="px-3 py-2">
                      <div className={headingCls(theme)}>
                        {m.user_display_name ||
                          m.user_email?.split("@")[0] ||
                          "Korisnik"}
                      </div>
                      {m.user_email && (
                        <div className={`text-xs ${subtleTextCls(theme)}`}>
                          {m.user_email}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {m.predictions_count}
                    </td>
                    <td className={`px-3 py-2 text-right font-bold ${ACCENT_ICON_CLASS[tournament.accent_color] ?? "text-amber-500"}`}>
                      {m.total_points}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ChevronRight
                        className={`w-4 h-4 inline transition-transform ${openUser === m.user_id ? "rotate-90" : ""} ${subtleTextCls(theme)}`}
                      />
                    </td>
                  </tr>
                  {openUser === m.user_id && (
                    <tr
                      className={
                        theme === "dark"
                          ? "bg-gray-800/30"
                          : "bg-gray-50/60"
                      }
                    >
                      <td colSpan={5} className="px-3 py-3">
                        <UserPredictionsList
                          rows={rows.filter((r) => r.user_id === m.user_id)}
                          theme={theme}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div
              className={`flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t ${
                theme === "dark"
                  ? "bg-gray-900/40 border-gray-800"
                  : "bg-gray-50/60 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className={mutedTextCls(theme)}>
                  {(safePage - 1) * pageSize + 1}
                  {"–"}
                  {Math.min(safePage * pageSize, filtered.length)} od{" "}
                  <span className={headingCls(theme)}>{filtered.length}</span>
                </span>
                <span className={`mx-2 ${subtleTextCls(theme)}`}>·</span>
                <span className={mutedTextCls(theme)}>Po stranici:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(1)}
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300 disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-700 disabled:opacity-30"
                  } disabled:cursor-not-allowed`}
                >
                  «
                </button>
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300 disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-700 disabled:opacity-30"
                  } disabled:cursor-not-allowed`}
                >
                  ‹ Prethodna
                </button>
                <span
                  className={`px-3 py-1 text-xs font-semibold ${headingCls(theme)}`}
                >
                  {safePage} / {totalPages}
                </span>
                <button
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={`px-3 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300 disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-700 disabled:opacity-30"
                  } disabled:cursor-not-allowed`}
                >
                  Sljedeća ›
                </button>
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setPage(totalPages)}
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300 disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-700 disabled:opacity-30"
                  } disabled:cursor-not-allowed`}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserPredictionsList({
  rows,
  theme,
}: {
  rows: AdminPredictionRow[];
  theme: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        let answer = "";
        if (r.score_home != null && r.score_away != null) {
          answer = `${r.score_home} : ${r.score_away}`;
        } else if (r.numeric_value != null) {
          answer = String(r.numeric_value);
        } else if (r.text_value) {
          answer = r.text_value;
        } else if (r.option_labels?.length) {
          answer = r.option_labels.join(", ");
        } else {
          answer = "—";
        }
        return (
          <div
            key={r.id}
            className={`rounded-md p-3 flex items-start justify-between gap-3 ${subCardCls(theme)}`}
          >
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs uppercase font-bold ${mutedTextCls(theme)}`}
              >
                {r.category_name}
              </div>
              <div className={`mt-0.5 ${headingCls(theme)}`}>{answer}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className={`text-xs ${subtleTextCls(theme)}`}
              >
                {r.is_scored ? "Bodovano" : "Nije bodovano"}
              </div>
              <div className="text-lg font-bold text-amber-500">
                {r.points_awarded} pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Settings tab
// ============================================================
function SettingsTab({
  tournament,
  theme,
  onUpdated,
}: {
  tournament: Tournament;
  theme: string;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState<Tournament>(tournament);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<SaveToastState>(null);

  useEffect(() => setForm(tournament), [tournament]);

  const update = (patch: Partial<Tournament>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/predictor/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setToast({ kind: "success", text: "Postavke sačuvane" });
        onUpdated();
      } else {
        const j = await res.json().catch(() => ({}));
        setToast({
          kind: "error",
          text: j.error || "Greška pri čuvanju",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-md p-5 space-y-5 ${cardCls(theme)}`}>
      {/* Pristup turniru — istaknuto na vrhu da admin odmah vidi i odluči */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${
          form.require_approval
            ? theme === "dark"
              ? "bg-gradient-to-br from-amber-950/50 via-amber-900/20 to-gray-900/80 border border-amber-700/50"
              : "bg-gradient-to-br from-amber-50 via-orange-50 to-white border border-amber-300"
            : theme === "dark"
              ? "bg-gradient-to-br from-emerald-950/40 via-gray-900/60 to-gray-900/80 border border-emerald-800/40"
              : "bg-gradient-to-br from-emerald-50 via-green-50 to-white border border-emerald-200"
        }`}
      >
        <div
          aria-hidden
          className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl ${
            form.require_approval ? "bg-amber-500/20" : "bg-emerald-500/15"
          }`}
        />
        <div className="relative flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              form.require_approval
                ? "bg-amber-500 text-black"
                : "bg-emerald-500 text-white"
            }`}
          >
            {form.require_approval ? (
              <Lock className="w-6 h-6" strokeWidth={2.5} />
            ) : (
              <Unlock className="w-6 h-6" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                form.require_approval
                  ? theme === "dark"
                    ? "text-amber-300"
                    : "text-amber-600"
                  : theme === "dark"
                    ? "text-emerald-300"
                    : "text-emerald-600"
              }`}
            >
              Pristup turniru
            </p>
            <h4
              className={`text-base sm:text-lg font-black mt-0.5 ${headingCls(theme)}`}
            >
              {form.require_approval
                ? "Zatvoren turnir — admin odobrava učesnike"
                : "Otvoren turnir — svi prijavljeni mogu predviđati"}
            </h4>
            <p className={`text-xs sm:text-sm mt-1 ${mutedTextCls(theme)}`}>
              {form.require_approval
                ? "Korisnici klikaju 'Zatraži učešće', pojavljuju se u tabu 'Odobrenja'. Tek kad ih odobriš, mogu unositi predikcije."
                : "Bilo ko prijavljen može odmah unositi predikcije. Bez čekanja, bez odobrenja."}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => update({ require_approval: false })}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                !form.require_approval
                  ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/50"
                  : theme === "dark"
                    ? "bg-gray-900/60 text-gray-400 border border-gray-700 hover:border-emerald-500/50"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-emerald-400"
              }`}
            >
              Otvoren
            </button>
            <button
              type="button"
              onClick={() => update({ require_approval: true })}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                form.require_approval
                  ? "bg-amber-500 text-black shadow-md ring-2 ring-amber-400/50"
                  : theme === "dark"
                    ? "bg-gray-900/60 text-gray-400 border border-gray-700 hover:border-amber-500/50"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-amber-400"
              }`}
            >
              Zatvoren
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Naziv (BS)">
          <Input
            theme={theme}
            value={form.name}
            onChange={(v) => update({ name: v })}
          />
        </Field>
        <Field theme={theme} label="Name (EN)">
          <Input
            theme={theme}
            value={form.name_en ?? ""}
            onChange={(v) => update({ name_en: v || null })}
          />
        </Field>
        <Field theme={theme} label="Slug (URL)">
          <Input
            theme={theme}
            value={form.slug}
            onChange={(v) => update({ slug: v })}
          />
        </Field>
        <Field theme={theme} label="Akcent boja">
          <Select
            theme={theme}
            value={form.accent_color}
            onChange={(v) => update({ accent_color: v as any })}
            options={[
              { value: "amber", label: "Amber / Zlatna" },
              { value: "purple", label: "Ljubičasta" },
              { value: "blue", label: "Plava" },
              { value: "red", label: "Crvena" },
              { value: "green", label: "Zelena" },
            ]}
          />
        </Field>
        <Field theme={theme} label="Istakni">
          <Select
            theme={theme}
            value={form.is_featured ? "yes" : "no"}
            onChange={(v) => update({ is_featured: v === "yes" })}
            options={[
              { value: "no", label: "Ne" },
              { value: "yes", label: "Da" },
            ]}
          />
        </Field>
        <Field theme={theme} label="Početak">
          <Input
            theme={theme}
            type="datetime-local"
            value={dtLocal(form.starts_at)}
            onChange={(v) => update({ starts_at: fromDtLocal(v) })}
          />
        </Field>
        <Field theme={theme} label="Završetak">
          <Input
            theme={theme}
            type="datetime-local"
            value={dtLocal(form.ends_at)}
            onChange={(v) => update({ ends_at: fromDtLocal(v) })}
          />
        </Field>
        <Field
          theme={theme}
          label="Globalni rok predikcija"
          hint="Ostavi prazno — predikcije ostaju otvorene dok ručno ne promijeniš status u 'Zaključan' ili 'Završen'."
        >
          <Input
            theme={theme}
            type="datetime-local"
            value={dtLocal(form.registration_lock_at)}
            onChange={(v) =>
              update({ registration_lock_at: fromDtLocal(v) })
            }
          />
        </Field>
        <Field theme={theme} label="Nagradni fond">
          <div className="flex gap-2">
            <Input
              theme={theme}
              type="number"
              value={form.prize_pool_amount?.toString() ?? ""}
              onChange={(v) =>
                update({ prize_pool_amount: v ? Number(v) : null })
              }
            />
            <Input
              theme={theme}
              value={form.prize_pool_currency ?? "EUR"}
              onChange={(v) => update({ prize_pool_currency: v })}
              className="!w-24"
            />
          </div>
        </Field>
        <Field theme={theme} label="URL banera">
          <Input
            theme={theme}
            value={form.banner_image_url ?? ""}
            onChange={(v) => update({ banner_image_url: v || null })}
          />
        </Field>
        <Field theme={theme} label="URL hero slike">
          <Input
            theme={theme}
            value={form.hero_image_url ?? ""}
            onChange={(v) => update({ hero_image_url: v || null })}
          />
        </Field>
        <Field theme={theme} label="Naziv sponzora">
          <Input
            theme={theme}
            value={form.sponsor_name ?? ""}
            onChange={(v) => update({ sponsor_name: v || null })}
          />
        </Field>
        <Field theme={theme} label="URL logoa sponzora">
          <Input
            theme={theme}
            value={form.sponsor_logo_url ?? ""}
            onChange={(v) => update({ sponsor_logo_url: v || null })}
          />
        </Field>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          theme === "dark"
            ? "border-gray-700/70 bg-gray-900/40"
            : "border-gray-200 bg-gray-50/70"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-amber-500" />
          <h4 className={`text-sm font-bold ${headingCls(theme)}`}>
            WC 2026 tema (samo za svjetsko prvenstvo)
          </h4>
        </div>
        <p className={`text-xs mb-4 ${mutedTextCls(theme)}`}>
          Pozadina i tema muzika se aktiviraju isključivo za turnir kome ovdje
          eksplicitno postaviš sliku/muziku. Ostali turniri ostaju čisti.
        </p>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-xs font-semibold mb-2 ${mutedTextCls(theme)}`}
            >
              Pozadinska slika
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => update({ theme_background_image: null })}
                className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all ${
                  !form.theme_background_image
                    ? "border-amber-500 ring-2 ring-amber-500/30"
                    : theme === "dark"
                      ? "border-gray-700 hover:border-gray-500"
                      : "border-gray-300 hover:border-gray-400"
                } ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ban
                    className={`w-6 h-6 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                  />
                </div>
                <span
                  className={`absolute bottom-1 left-1 right-1 text-[10px] font-semibold text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Bez pozadine
                </span>
              </button>
              {WC_BACKGROUND_OPTIONS.map((opt) => {
                const selected = form.theme_background_image === opt.src;
                return (
                  <button
                    key={opt.src}
                    type="button"
                    onClick={() => update({ theme_background_image: opt.src })}
                    className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all group ${
                      selected
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : theme === "dark"
                          ? "border-gray-700 hover:border-gray-500"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    title={opt.label}
                  >
                    <Image
                      src={opt.src}
                      alt={opt.label}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    <div
                      className={`absolute inset-0 transition-opacity ${
                        selected
                          ? "bg-black/20"
                          : "bg-black/40 group-hover:bg-black/20"
                      }`}
                    />
                    {selected && (
                      <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 right-1 text-[10px] font-semibold text-center text-white drop-shadow-lg line-clamp-1">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field
            theme={theme}
            label="Auto-pusti WC 2026 himnu"
            hint="Ako uključiš, na stranici turnira će se prikazati toggle za FIFA WC 2026 himnu. Stanje se pamti po korisniku — ne pušta se automatski uz autoplay-block."
          >
            <Select
              theme={theme}
              value={form.theme_music_enabled ? "yes" : "no"}
              onChange={(v) => update({ theme_music_enabled: v === "yes" })}
              options={[
                { value: "no", label: "Ne — bez himne" },
                { value: "yes", label: "Da — prikaži dugme za himnu" },
              ]}
            />
          </Field>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Kratki opis (BS)">
          <Input
            theme={theme}
            value={form.short_description ?? ""}
            onChange={(v) => update({ short_description: v || null })}
          />
        </Field>
        <Field theme={theme} label="Short description (EN)">
          <Input
            theme={theme}
            value={form.short_description_en ?? ""}
            onChange={(v) => update({ short_description_en: v || null })}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Detaljan opis / uvod (BS)">
          <Textarea
            theme={theme}
            value={form.long_description ?? ""}
            onChange={(v) => update({ long_description: v || null })}
            rows={4}
          />
        </Field>
        <Field theme={theme} label="Long description / intro (EN)">
          <Textarea
            theme={theme}
            value={form.long_description_en ?? ""}
            onChange={(v) => update({ long_description_en: v || null })}
            rows={4}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Pravila — markdown (BS)">
          <Textarea
            theme={theme}
            value={form.rules_md ?? ""}
            onChange={(v) => update({ rules_md: v || null })}
            rows={5}
          />
        </Field>
        <Field theme={theme} label="Rules — markdown (EN)">
          <Textarea
            theme={theme}
            value={form.rules_md_en ?? ""}
            onChange={(v) => update({ rules_md_en: v || null })}
            rows={5}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Objašnjenje bodovanja — markdown (BS)">
          <Textarea
            theme={theme}
            value={form.point_system_md ?? ""}
            onChange={(v) => update({ point_system_md: v || null })}
            rows={4}
          />
        </Field>
        <Field theme={theme} label="Point system — markdown (EN)">
          <Textarea
            theme={theme}
            value={form.point_system_md_en ?? ""}
            onChange={(v) => update({ point_system_md_en: v || null })}
            rows={4}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Uslovi učešća — markdown (BS)">
          <Textarea
            theme={theme}
            value={form.eligibility_md ?? ""}
            onChange={(v) => update({ eligibility_md: v || null })}
            rows={3}
          />
        </Field>
        <Field theme={theme} label="Eligibility — markdown (EN)">
          <Textarea
            theme={theme}
            value={form.eligibility_md_en ?? ""}
            onChange={(v) => update({ eligibility_md_en: v || null })}
            rows={3}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className={primaryBtnCls}>
          <Save className="w-4 h-4" />
          {saving ? "Čuvanje…" : "Sačuvaj postavke"}
        </button>
      </div>

      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

// ============================================================
// Categories tab — list + create + edit (with options manager)
// ============================================================
function CategoriesTab({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const [categories, setCategories] = useState<CategoryWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/predictor/categories?tournament_id=${tournament.id}`,
      );
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  const removeCategory = async (id: string) => {
    if (!confirm("Obriši ovu kategoriju i sve njene opcije/predikcije?")) return;
    const res = await fetch(`/api/admin/predictor/categories?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`font-semibold ${headingCls(theme)}`}>
            Kategorije predikcija
          </h3>
          <p className={`text-xs ${subtleTextCls(theme)}`}>
            Svaka kategorija je jedno pitanje (pobjednik, najbolji strijelac, top 4…).
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={primaryBtnCls}>
          <Plus className="w-4 h-4" />
          Nova kategorija
        </button>
      </div>

      {creating && (
        <CategoryForm
          tournament={tournament}
          theme={theme}
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : categories.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema kategorija.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className={`rounded-md p-4 ${cardCls(theme)}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-semibold ${headingCls(theme)}`}>
                      {cat.name}
                    </h4>
                    <span className={chipCls(theme)}>
                      {CATEGORY_TYPE_LABEL[cat.category_type]}
                    </span>
                    <span className={accentChipCls(theme)}>
                      {cat.points_correct} pts
                    </span>
                    {cat.lock_at && (
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          theme === "dark"
                            ? "bg-blue-950/40 text-blue-300 border-blue-800/60"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        {new Date(cat.lock_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className={`text-xs mt-1 ${mutedTextCls(theme)}`}>
                      {cat.description}
                    </p>
                  )}
                  <p
                    className={`text-[11px] font-mono mt-1 ${subtleTextCls(theme)}`}
                  >
                    /{cat.slug} · {(cat.predictor_options ?? []).length} opcija
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setEditingId(editingId === cat.id ? null : cat.id)
                    }
                    className={editBtnCls(theme)}
                    title="Uredi"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className={dangerBtnCls(theme)}
                    title="Obriši"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingId === cat.id && (
                <div
                  className={`mt-4 pt-4 border-t space-y-5 ${
                    theme === "dark" ? "border-gray-800" : "border-gray-200"
                  }`}
                >
                  <CategoryForm
                    tournament={tournament}
                    theme={theme}
                    initial={cat}
                    onCancel={() => setEditingId(null)}
                    onSaved={async () => {
                      setEditingId(null);
                      await load();
                    }}
                  />
                  <OptionsManager
                    category={cat}
                    options={cat.predictor_options ?? []}
                    theme={theme}
                    onChanged={load}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  tournament,
  theme,
  initial,
  onCancel,
  onSaved,
}: {
  tournament: Tournament;
  theme: string;
  initial?: PredictionCategory;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.description_en ?? "",
  );
  const [type, setType] = useState<CategoryType>(
    initial?.category_type ?? "single_choice",
  );
  const [maxSel, setMaxSel] = useState(initial?.max_selections ?? 1);
  const [pCorrect, setPCorrect] = useState(initial?.points_correct ?? 10);
  const [pPartial, setPPartial] = useState(initial?.points_partial ?? 0);
  const [pRank, setPRank] = useState(initial?.points_ranked_bonus ?? 0);
  const [lockAt, setLockAt] = useState(dtLocal(initial?.lock_at ?? null));
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!name.trim()) return setErr("Naziv je obavezan");
    setSaving(true);
    try {
      const body = {
        ...(initial ? { id: initial.id } : { tournament_id: tournament.id }),
        name,
        name_en: nameEn || null,
        slug: slug || name,
        description,
        description_en: descriptionEn || null,
        category_type: type,
        max_selections: maxSel,
        points_correct: pCorrect,
        points_partial: pPartial,
        points_ranked_bonus: pRank,
        lock_at: fromDtLocal(lockAt),
        sort_order: sortOrder,
        is_active: isActive,
      };
      const res = await fetch("/api/admin/predictor/categories", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Greška");
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-4 rounded-md p-4 ${subCardCls(theme)}`}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Naziv (BS)">
          <Input
            theme={theme}
            value={name}
            onChange={setName}
            placeholder="npr. Pobjednik turnira"
          />
        </Field>
        <Field theme={theme} label="Name (EN)">
          <Input
            theme={theme}
            value={nameEn}
            onChange={setNameEn}
            placeholder="e.g. Tournament Winner"
          />
        </Field>
        <Field theme={theme} label="Slug">
          <Input
            theme={theme}
            value={slug}
            onChange={setSlug}
            placeholder="pobjednik-turnira"
          />
        </Field>
        <Field theme={theme} label="Tip">
          <Select
            theme={theme}
            value={type}
            onChange={(v) => setType(v as CategoryType)}
            options={Object.entries(CATEGORY_TYPE_LABEL).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </Field>
        <Field theme={theme} label="Maks. izbora">
          <Input
            theme={theme}
            type="number"
            value={String(maxSel)}
            onChange={(v) => setMaxSel(Math.max(1, Number(v) || 1))}
          />
        </Field>
        <Field theme={theme} label="Poeni (puni)">
          <Input
            theme={theme}
            type="number"
            value={String(pCorrect)}
            onChange={(v) => setPCorrect(Number(v) || 0)}
          />
        </Field>
        <Field theme={theme} label="Poeni (djelimično / po pogotku)">
          <Input
            theme={theme}
            type="number"
            value={String(pPartial)}
            onChange={(v) => setPPartial(Number(v) || 0)}
          />
        </Field>
        <Field theme={theme} label="Bonus za tačan rang">
          <Input
            theme={theme}
            type="number"
            value={String(pRank)}
            onChange={(v) => setPRank(Number(v) || 0)}
          />
        </Field>
        <Field
          theme={theme}
          label="Zaključaj kategoriju u"
          hint="Opcionalno — ostavi prazno da se primjenjuje globalni rok turnira."
        >
          <Input
            theme={theme}
            type="datetime-local"
            value={lockAt}
            onChange={setLockAt}
          />
        </Field>
        <Field theme={theme} label="Redoslijed">
          <Input
            theme={theme}
            type="number"
            value={String(sortOrder)}
            onChange={(v) => setSortOrder(Number(v) || 0)}
          />
        </Field>
        <Field theme={theme} label="Aktivno">
          <Select
            theme={theme}
            value={isActive ? "yes" : "no"}
            onChange={(v) => setIsActive(v === "yes")}
            options={[
              { value: "yes", label: "Da" },
              { value: "no", label: "Ne" },
            ]}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field theme={theme} label="Opis (BS)">
          <Textarea
            theme={theme}
            value={description}
            onChange={setDescription}
            rows={2}
          />
        </Field>
        <Field theme={theme} label="Description (EN)">
          <Textarea
            theme={theme}
            value={descriptionEn}
            onChange={setDescriptionEn}
            rows={2}
          />
        </Field>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className={ghostBtnCls(theme)}>
          Otkaži
        </button>
        <button onClick={save} disabled={saving} className={primaryBtnCls}>
          {saving
            ? "Čuvanje…"
            : initial
              ? "Sačuvaj kategoriju"
              : "Kreiraj kategoriju"}
        </button>
      </div>
    </div>
  );
}

// Options manager — add option, mark correct, set rank
function OptionsManager({
  category,
  options,
  theme,
  onChanged,
}: {
  category: PredictionCategory;
  options: PredictionOption[];
  theme: string;
  onChanged: () => void;
}) {
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [groupLabel, setGroupLabel] = useState("");
  const [groupLabelEn, setGroupLabelEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editGroupEn, setEditGroupEn] = useState("");

  const isChoice =
    category.category_type === "single_choice" ||
    category.category_type === "multiple_choice" ||
    category.category_type === "ranked_top_n" ||
    category.category_type === "team_selection" ||
    category.category_type === "player_selection";

  const isAnswerSlot =
    category.category_type === "exact_score" ||
    category.category_type === "numeric" ||
    category.category_type === "free_text";

  const addOption = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/predictor/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.id,
          label,
          label_en: labelEn || null,
          image_url: imageUrl || null,
          group_label: groupLabel || null,
          group_label_en: groupLabelEn || null,
          sort_order: options.length,
        }),
      });
      if (res.ok) {
        setLabel("");
        setLabelEn("");
        setImageUrl("");
        setGroupLabel("");
        setGroupLabelEn("");
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateOption = async (
    id: string,
    patch: Partial<PredictionOption>,
  ) => {
    const res = await fetch("/api/admin/predictor/options", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) onChanged();
  };

  const removeOption = async (id: string) => {
    if (!confirm("Obriši ovu opciju?")) return;
    const res = await fetch(`/api/admin/predictor/options?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className={`text-sm font-semibold ${headingCls(theme)}`}>
          {isAnswerSlot ? "Tačan odgovor" : "Opcije"}
        </h5>
        <span className={`text-xs ${subtleTextCls(theme)}`}>
          {options.length} {isAnswerSlot ? "odgovora" : "opcija"}
        </span>
      </div>

      {isChoice && (
        <div className="space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <Field theme={theme} label="Naziv (BS)">
              <Input
                theme={theme}
                value={label}
                onChange={setLabel}
                placeholder="npr. Brazil"
              />
            </Field>
            <Field theme={theme} label="Name (EN)">
              <Input
                theme={theme}
                value={labelEn}
                onChange={setLabelEn}
                placeholder="e.g. Brazil"
              />
            </Field>
          </div>
          <div className="grid md:grid-cols-4 gap-2 items-end">
            <Field theme={theme} label="URL slike (opcionalno)">
              <Input
                theme={theme}
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://…"
              />
            </Field>
            <Field theme={theme} label="Grupa BS (opc.)">
              <Input
                theme={theme}
                value={groupLabel}
                onChange={setGroupLabel}
                placeholder="Grupa A"
              />
            </Field>
            <Field theme={theme} label="Group EN (opt.)">
              <Input
                theme={theme}
                value={groupLabelEn}
                onChange={setGroupLabelEn}
                placeholder="Group A"
              />
            </Field>
            <button
              onClick={addOption}
              disabled={saving}
              className={primaryBtnCls + " justify-center"}
            >
              <Plus className="w-4 h-4" /> Dodaj
            </button>
          </div>
        </div>
      )}

      {isAnswerSlot && options.length === 0 && (
        <button
          onClick={async () => {
            await fetch("/api/admin/predictor/options", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category_id: category.id,
                label: "Tačan odgovor",
                is_correct: true,
                metadata: {},
              }),
            });
            onChanged();
          }}
          className={`${ghostBtnCls(theme)} inline-flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" /> Kreiraj odgovor
        </button>
      )}

      <div className="space-y-1.5">
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
              opt.is_correct
                ? theme === "dark"
                  ? "border-emerald-700/60 bg-emerald-950/30"
                  : "border-emerald-300 bg-emerald-50"
                : theme === "dark"
                  ? "border-gray-700 bg-gray-800/40"
                  : "border-gray-200 bg-white"
            }`}
          >
            {isChoice && (
              <button
                onClick={() =>
                  updateOption(opt.id, { is_correct: !opt.is_correct })
                }
                className={`p-1 rounded transition-colors ${
                  opt.is_correct
                    ? "text-emerald-500"
                    : theme === "dark"
                      ? "text-gray-500 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-700"
                }`}
                title={
                  opt.is_correct ? "Označeno kao tačno" : "Označi kao tačno"
                }
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {editingLabelId === opt.id ? (
              <div className="flex-1 grid md:grid-cols-2 gap-1 min-w-0">
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Naziv (BS)"
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
                <input
                  value={editLabelEn}
                  onChange={(e) => setEditLabelEn(e.target.value)}
                  placeholder="Name (EN)"
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
                <input
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  placeholder="Grupa (BS)"
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
                <input
                  value={editGroupEn}
                  onChange={(e) => setEditGroupEn(e.target.value)}
                  placeholder="Group (EN)"
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            ) : (
              <span
                className={`text-sm font-medium flex-1 min-w-0 truncate ${headingCls(theme)}`}
              >
                {opt.label}
                {opt.label_en && (
                  <span className={`ml-2 text-[10px] ${subtleTextCls(theme)}`}>
                    / {opt.label_en}
                  </span>
                )}
              </span>
            )}
            {opt.group_label && editingLabelId !== opt.id && (
              <span className={chipCls(theme)}>
                {opt.group_label}
                {opt.group_label_en ? ` / ${opt.group_label_en}` : ""}
              </span>
            )}
            {editingLabelId === opt.id ? (
              <>
                <button
                  onClick={async () => {
                    await updateOption(opt.id, {
                      label: editLabel,
                      label_en: editLabelEn || null,
                      group_label: editGroup || null,
                      group_label_en: editGroupEn || null,
                    });
                    setEditingLabelId(null);
                  }}
                  className={primaryBtnCls}
                  title="Sačuvaj"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingLabelId(null)}
                  className={ghostBtnCls(theme)}
                  title="Otkaži"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingLabelId(opt.id);
                  setEditLabel(opt.label);
                  setEditLabelEn(opt.label_en ?? "");
                  setEditGroup(opt.group_label ?? "");
                  setEditGroupEn(opt.group_label_en ?? "");
                }}
                className={editBtnCls(theme)}
                title="Uredi nazive"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {category.category_type === "ranked_top_n" && opt.is_correct && (
              <input
                type="number"
                min={1}
                value={opt.correct_rank ?? idx + 1}
                onChange={(e) =>
                  updateOption(opt.id, {
                    correct_rank: Number(e.target.value) || null,
                  })
                }
                className={`w-16 px-2 py-1 rounded text-xs text-center ${
                  theme === "dark"
                    ? "bg-gray-800 border border-gray-700 text-white"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
                title="Tačan rang"
              />
            )}
            {category.category_type === "exact_score" && opt.is_correct && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={(opt.metadata as any)?.home ?? ""}
                  onChange={(e) =>
                    updateOption(opt.id, {
                      metadata: {
                        ...(opt.metadata as any),
                        home: Number(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="D"
                  className={`w-12 px-2 py-1 rounded text-xs text-center ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
                <span className={subtleTextCls(theme)}>:</span>
                <input
                  type="number"
                  min={0}
                  value={(opt.metadata as any)?.away ?? ""}
                  onChange={(e) =>
                    updateOption(opt.id, {
                      metadata: {
                        ...(opt.metadata as any),
                        away: Number(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="G"
                  className={`w-12 px-2 py-1 rounded text-xs text-center ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            )}
            {(category.category_type === "numeric" ||
              category.category_type === "free_text") &&
              opt.is_correct && (
                <input
                  value={(opt.metadata as any)?.value ?? ""}
                  onChange={(e) =>
                    updateOption(opt.id, {
                      metadata: {
                        ...(opt.metadata as any),
                        value:
                          category.category_type === "numeric"
                            ? Number(e.target.value)
                            : e.target.value,
                      },
                    })
                  }
                  placeholder={
                    category.category_type === "numeric"
                      ? "Tačna vrijednost"
                      : "Tačan odgovor"
                  }
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                />
              )}
            <button
              onClick={() => removeOption(opt.id)}
              className={dangerBtnCls(theme)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Rules tab
// ============================================================
function RulesTab({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const [rules, setRules] = useState<TournamentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/predictor/tournaments/${tournament.slug}`);
    if (res.ok) {
      const j = await res.json();
      setRules(j.rules ?? []);
    }
    setLoading(false);
  }, [tournament.slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`font-semibold ${headingCls(theme)}`}>
            Pravila, bonusi i napomene
          </h3>
          <p className={`text-xs ${subtleTextCls(theme)}`}>
            Svaka stavka se prikazuje u sekciji pravila turnira.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={primaryBtnCls}>
          <Plus className="w-4 h-4" /> Dodaj pravilo
        </button>
      </div>

      {creating && (
        <RuleForm
          tournamentId={tournament.id}
          theme={theme}
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : rules.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema pravila.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <RuleRow key={r.id} rule={r} theme={theme} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function RuleRow({
  rule,
  theme,
  onChanged,
}: {
  rule: TournamentRule;
  theme: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const remove = async () => {
    if (!confirm("Obriši ovo pravilo?")) return;
    const res = await fetch(`/api/admin/predictor/rules?id=${rule.id}`, {
      method: "DELETE",
    });
    if (res.ok) onChanged();
  };
  return (
    <div className={`rounded-md p-3 ${cardCls(theme)}`}>
      {editing ? (
        <RuleForm
          tournamentId={rule.tournament_id}
          theme={theme}
          initial={rule}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onChanged();
          }}
        />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold text-sm ${headingCls(theme)}`}>
                {rule.title}
              </h4>
              <span className={chipCls(theme)}>
                {RULE_KIND_LABEL[rule.kind]}
              </span>
            </div>
            {rule.body_md && (
              <p
                className={`text-xs mt-1 whitespace-pre-wrap ${mutedTextCls(theme)}`}
              >
                {rule.body_md}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className={editBtnCls(theme)}>
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={remove} className={dangerBtnCls(theme)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleForm({
  tournamentId,
  theme,
  initial,
  onCancel,
  onSaved,
}: {
  tournamentId: string;
  theme: string;
  initial?: TournamentRule;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [body, setBody] = useState(initial?.body_md ?? "");
  const [bodyEn, setBodyEn] = useState(initial?.body_md_en ?? "");
  const [kind, setKind] = useState<RuleKind>(initial?.kind ?? "rule");
  const [order, setOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body_ = {
      ...(initial ? { id: initial.id } : { tournament_id: tournamentId }),
      title,
      title_en: titleEn || null,
      body_md: body || null,
      body_md_en: bodyEn || null,
      kind,
      sort_order: order,
    };
    const res = await fetch("/api/admin/predictor/rules", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body_),
    });
    setSaving(false);
    if (res.ok) onSaved();
  };

  return (
    <div className={`space-y-3 rounded-md p-3 ${subCardCls(theme)}`}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Naslov (BS)">
          <Input theme={theme} value={title} onChange={setTitle} />
        </Field>
        <Field theme={theme} label="Title (EN)">
          <Input theme={theme} value={titleEn} onChange={setTitleEn} />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Tip">
          <Select
            theme={theme}
            value={kind}
            onChange={(v) => setKind(v as RuleKind)}
            options={Object.entries(RULE_KIND_LABEL).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </Field>
        <Field theme={theme} label="Redoslijed">
          <Input
            theme={theme}
            type="number"
            value={String(order)}
            onChange={(v) => setOrder(Number(v) || 0)}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Tekst — markdown (BS)">
          <Textarea theme={theme} value={body} onChange={setBody} rows={3} />
        </Field>
        <Field theme={theme} label="Body — markdown (EN)">
          <Textarea theme={theme} value={bodyEn} onChange={setBodyEn} rows={3} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className={ghostBtnCls(theme)}>
          Otkaži
        </button>
        <button onClick={save} disabled={saving} className={primaryBtnCls}>
          {saving ? "Čuvanje…" : initial ? "Sačuvaj pravilo" : "Dodaj pravilo"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Rewards tab
// ============================================================
function RewardsTab({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const [rewards, setRewards] = useState<TournamentReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/predictor/tournaments/${tournament.slug}`);
    if (res.ok) {
      const j = await res.json();
      setRewards(j.rewards ?? []);
    }
    setLoading(false);
  }, [tournament.slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`font-semibold ${headingCls(theme)}`}>
            Nagrade i sponzori
          </h3>
          <p className={`text-xs ${subtleTextCls(theme)}`}>
            Dodaj nagrade po plasmanu ili opšte nagrade. Koristi polja sponzora za brendirane nagrade.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={primaryBtnCls}>
          <Plus className="w-4 h-4" /> Dodaj nagradu
        </button>
      </div>

      {creating && (
        <RewardForm
          tournamentId={tournament.id}
          theme={theme}
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : rewards.length === 0 ? (
        <div
          className={`rounded-md border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema nagrada.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rewards.map((rw) => (
            <RewardRow
              key={rw.id}
              reward={rw}
              theme={theme}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RewardRow({
  reward,
  theme,
  onChanged,
}: {
  reward: TournamentReward;
  theme: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const remove = async () => {
    if (!confirm("Obriši ovu nagradu?")) return;
    const res = await fetch(`/api/admin/predictor/rewards?id=${reward.id}`, {
      method: "DELETE",
    });
    if (res.ok) onChanged();
  };
  const RankIcon =
    reward.rank_position === 1
      ? Crown
      : reward.rank_position === 2
        ? Award
        : reward.rank_position === 3
          ? Star
          : Gift;
  return (
    <div className={`rounded-md p-4 ${cardCls(theme)}`}>
      {editing ? (
        <RewardForm
          tournamentId={reward.tournament_id}
          theme={theme}
          initial={reward}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onChanged();
          }}
        />
      ) : (
        <div className="flex items-start gap-3">
          <RankIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold text-sm ${headingCls(theme)}`}>
                {reward.title}
              </h4>
              {reward.rank_position != null && (
                <span className={accentChipCls(theme)}>
                  #{reward.rank_position}
                </span>
              )}
              <span className={chipCls(theme)}>
                {PRIZE_TYPE_LABEL[reward.prize_type]}
              </span>
              {reward.prize_value != null && (
                <span className="text-xs font-bold text-amber-500">
                  {reward.prize_value} {reward.prize_currency}
                </span>
              )}
            </div>
            {reward.description && (
              <p className={`text-xs mt-1 ${mutedTextCls(theme)}`}>
                {reward.description}
              </p>
            )}
            {reward.sponsor_name && (
              <p className={`text-[11px] mt-1 ${subtleTextCls(theme)}`}>
                Sponzor: {reward.sponsor_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className={editBtnCls(theme)}>
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={remove} className={dangerBtnCls(theme)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RewardForm({
  tournamentId,
  theme,
  initial,
  onCancel,
  onSaved,
}: {
  tournamentId: string;
  theme: string;
  initial?: TournamentReward;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [rank, setRank] = useState(initial?.rank_position ?? 1);
  const [type, setType] = useState<PrizeType>(initial?.prize_type ?? "cash");
  const [value, setValue] = useState(
    initial?.prize_value != null ? String(initial.prize_value) : "",
  );
  const [currency, setCurrency] = useState(initial?.prize_currency ?? "EUR");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.description_en ?? "",
  );
  const [image, setImage] = useState(initial?.image_url ?? "");
  const [sponsorName, setSponsorName] = useState(initial?.sponsor_name ?? "");
  const [sponsorLogo, setSponsorLogo] = useState(
    initial?.sponsor_logo_url ?? "",
  );
  const [sponsorUrl, setSponsorUrl] = useState(initial?.sponsor_url ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      ...(initial ? { id: initial.id } : { tournament_id: tournamentId }),
      title,
      title_en: titleEn || null,
      rank_position: rank ?? null,
      prize_type: type,
      prize_value: value ? Number(value) : null,
      prize_currency: currency,
      description: description || null,
      description_en: descriptionEn || null,
      image_url: image || null,
      sponsor_name: sponsorName || null,
      sponsor_logo_url: sponsorLogo || null,
      sponsor_url: sponsorUrl || null,
    };
    const res = await fetch("/api/admin/predictor/rewards", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onSaved();
  };

  return (
    <div className={`space-y-3 rounded-md p-3 md:col-span-2 ${subCardCls(theme)}`}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Naziv (BS)">
          <Input theme={theme} value={title} onChange={setTitle} />
        </Field>
        <Field theme={theme} label="Title (EN)">
          <Input theme={theme} value={titleEn} onChange={setTitleEn} />
        </Field>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Field theme={theme} label="Plasman">
          <Input
            theme={theme}
            type="number"
            value={String(rank ?? "")}
            onChange={(v) => setRank(v ? Number(v) : 0)}
          />
        </Field>
        <Field theme={theme} label="Tip nagrade">
          <Select
            theme={theme}
            value={type}
            onChange={(v) => setType(v as PrizeType)}
            options={Object.entries(PRIZE_TYPE_LABEL).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </Field>
        <Field theme={theme} label="Vrijednost">
          <Input
            theme={theme}
            value={value}
            onChange={setValue}
            type="number"
          />
        </Field>
        <Field theme={theme} label="Valuta">
          <Input
            theme={theme}
            value={currency ?? ""}
            onChange={setCurrency}
          />
        </Field>
        <Field theme={theme} label="URL slike">
          <Input theme={theme} value={image} onChange={setImage} />
        </Field>
        <Field theme={theme} label="Naziv sponzora">
          <Input
            theme={theme}
            value={sponsorName}
            onChange={setSponsorName}
          />
        </Field>
        <Field theme={theme} label="URL logoa sponzora">
          <Input
            theme={theme}
            value={sponsorLogo}
            onChange={setSponsorLogo}
          />
        </Field>
        <Field theme={theme} label="URL sponzora">
          <Input theme={theme} value={sponsorUrl} onChange={setSponsorUrl} />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field theme={theme} label="Opis (BS)">
          <Textarea
            theme={theme}
            value={description}
            onChange={setDescription}
            rows={2}
          />
        </Field>
        <Field theme={theme} label="Description (EN)">
          <Textarea
            theme={theme}
            value={descriptionEn}
            onChange={setDescriptionEn}
            rows={2}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className={ghostBtnCls(theme)}>
          Otkaži
        </button>
        <button onClick={save} disabled={saving} className={primaryBtnCls}>
          {saving
            ? "Čuvanje…"
            : initial
              ? "Sačuvaj nagradu"
              : "Dodaj nagradu"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Reusable form primitives (theme-aware)
// ============================================================
function Field({
  theme,
  label,
  hint,
  children,
}: {
  theme: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span
        className={`text-xs uppercase tracking-wide font-semibold ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          className={`block text-[11px] leading-snug ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function Input({
  theme,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: {
  theme: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls(theme)} ${className ?? ""}`}
    />
  );
}

function Textarea({
  theme,
  value,
  onChange,
  rows = 3,
}: {
  theme: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={inputCls(theme)}
    />
  );
}

function Select({
  theme,
  value,
  onChange,
  options,
}: {
  theme: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls(theme)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// datetime-local helpers (ISO -> input value & back)
function dtLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDtLocal(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
