"use client";

import { useTranslation } from "react-i18next";
import { TEMPLATE_PICKER_META, getTemplate } from "@/data/predictor-templates";
import { getMatchTemplate } from "@/data/predictor-match-templates";

interface Props {
  dark: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * Quick-start template picker shown on the /create-tournament landing.
 * Clicking a template auto-fills the form (name, slug, accent, categories
 * seeded on creation by the backend). User can also pick "Blank" to start fresh.
 */
export default function TemplatePicker({ dark, selectedId, onSelect }: Props) {
  const { t } = useTranslation("predictor");

  return (
    <section className="mb-20">
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`h-px w-10 flex-shrink-0 ${
            dark ? "bg-predictor-accent-dark/45" : "bg-predictor-accent-light/55"
          }`}
        />
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
            dark ? "text-predictor-accent-dark/85" : "text-predictor-accent-light/95"
          }`}
        >
          {t("create.templates.eyebrow", "Quick start")}
        </span>
      </div>

      <h2
        className={`mb-3 text-2xl font-black tracking-tight text-theme-heading-primary sm:text-3xl`}
      >
        {t("create.templates.title", "Templates")}
      </h2>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-theme-text-secondary sm:text-base">
        {t(
          "create.templates.subtitle",
          "Pick a template and the basics fill in automatically. Everything is editable afterwards.",
        )}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Blank tile first — always available */}
        <TemplateCard
          dark={dark}
          selected={!selectedId}
          onClick={() => onSelect(null)}
          name={t("create.templates.blank.name", "Blank tournament")}
          short={t("create.templates.blank.short", "Start from scratch")}
          monogram="+"
          gradient="from-gray-400 to-gray-600"
          blank
        />
        {TEMPLATE_PICKER_META.map((meta) => {
          const tmpl = getTemplate(meta.id);
          if (!tmpl) return null;
          const matchTmpl = tmpl.defaultMatchTemplateId
            ? getMatchTemplate(tmpl.defaultMatchTemplateId)
            : null;
          const matchCount = matchTmpl?.count ?? 0;
          return (
            <TemplateCard
              key={meta.id}
              dark={dark}
              selected={selectedId === meta.id}
              onClick={() => onSelect(meta.id)}
              name={t(
                `create.templates.items.${meta.i18nKey}.name`,
                tmpl.name,
              )}
              short={t(
                `create.templates.items.${meta.i18nKey}.short`,
                tmpl.short_description,
              )}
              matchesBadge={
                matchCount > 0
                  ? t("create.templatesExtra.matchesIncluded", {
                      count: matchCount,
                      defaultValue: `${matchCount} matches included`,
                    })
                  : null
              }
              logo={meta.logo}
              monogram={meta.monogram}
              brandBg={meta.brandBg}
              gradient={meta.gradient}
            />
          );
        })}
      </div>

      <p
        className={`mt-4 text-[11px] ${
          dark ? "text-gray-500" : "text-gray-500"
        }`}
      >
        {t(
          "create.templates.pickHint",
          "Click a template to auto-fill the form.",
        )}
      </p>
    </section>
  );
}

function TemplateCard({
  dark,
  selected,
  onClick,
  name,
  short,
  matchesBadge,
  logo,
  monogram,
  brandBg,
  gradient,
  blank,
}: {
  dark: boolean;
  selected: boolean;
  onClick: () => void;
  name: string;
  short: string;
  matchesBadge?: string | null;
  logo?: string | null;
  monogram: string;
  brandBg?: string | null;
  gradient?: string;
  blank?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected
          ? dark
            ? "border-predictor-primary/60 bg-predictor-primary/10 ring-1 ring-predictor-primary/40"
            : "border-predictor-primary bg-predictor-primary/20 ring-1 ring-predictor-primary/60"
          : dark
            ? "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {/* Logo tile */}
      <LogoTile
        dark={dark}
        logo={logo}
        monogram={monogram}
        brandBg={brandBg}
        gradient={gradient}
        blank={blank}
        selected={selected}
      />

      <div className="min-h-[2.5rem]">
        <h3 className="line-clamp-1 text-sm font-bold text-theme-heading-primary">
          {name}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-theme-text-secondary">
          {short}
        </p>
        {matchesBadge && (
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              dark
                ? "bg-predictor-primary/15 text-predictor-accent-dark"
                : "bg-predictor-primary/20 text-predictor-accent-light"
            }`}
          >
            <span aria-hidden>✦</span>
            {matchesBadge}
          </span>
        )}
      </div>
    </button>
  );
}

function LogoTile({
  dark,
  logo,
  monogram,
  brandBg,
  gradient,
  blank,
  selected,
}: {
  dark: boolean;
  logo?: string | null;
  monogram: string;
  brandBg?: string | null;
  gradient?: string;
  blank?: boolean;
  selected: boolean;
}) {
  // Blank tile: dashed border, plus sign
  if (blank) {
    return (
      <div
        className={`relative mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed ${
          dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50/60"
        }`}
      >
        <span
          className={`text-3xl font-black ${
            dark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {monogram}
        </span>
        {selected && <SelectedDot dark={dark} />}
      </div>
    );
  }

  // Branded backdrop (PL/CL etc.) — solid colour behind transparent logo
  if (logo && brandBg) {
    return (
      <div
        className="relative mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: brandBg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className="h-12 w-auto max-w-[70%] object-contain"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {selected && <SelectedDot dark={dark} />}
      </div>
    );
  }

  // Standard logo on theme-aware tile
  if (logo) {
    return (
      <div
        className={`relative mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-xl ${
          dark ? "bg-white/[0.04]" : "bg-gray-50"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className="h-14 w-auto max-w-[80%] object-contain"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {selected && <SelectedDot dark={dark} />}
      </div>
    );
  }

  // Monogram fallback (no logo available)
  return (
    <div
      className={`relative mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${
        gradient || "from-gray-500 to-gray-700"
      }`}
    >
      <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        {monogram}
      </span>
      {selected && <SelectedDot dark={dark} />}
    </div>
  );
}

function SelectedDot({ dark }: { dark: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
        dark ? "bg-predictor-primary text-gray-900" : "bg-predictor-primary text-gray-900"
      } ring-2 ring-white/30`}
    >
      ✓
    </span>
  );
}
