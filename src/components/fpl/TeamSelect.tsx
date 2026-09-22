"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getTeamColors } from "@/lib/team-colors";
import TeamJersey from "./TeamJersey";

export interface TeamSelectOption {
  id: number;
  short_name: string;
  name: string;
}

interface Props {
  teams: TeamSelectOption[];
  /** Selected club short name, or "all". */
  value: string;
  onChange: (value: string) => void;
  /** Label for the "no filter" entry. */
  allLabel: string;
  className?: string;
}

/**
 * Club filter that shows each team's actual kit.
 *
 * A native <select> can only hold text, so this is a custom listbox — it is the
 * one place on the page where the kit could not simply replace an icon.
 */
export default function TeamSelect({
  teams,
  value,
  onChange,
  allLabel,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = value === "all" ? null : teams.find((tm) => tm.short_name === value);
  const selectedKit = selected ? getTeamColors(selected.short_name) : null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Bring the active row into view when the list opens.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-theme-border bg-theme-card py-2 pl-2 pr-8 text-sm text-theme-foreground transition-colors hover:border-theme-foreground/25 focus:outline-none focus:ring-1 focus:ring-theme-foreground/20"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{
            background: selectedKit
              ? `linear-gradient(135deg, ${selectedKit.primary}1a 0%, ${selectedKit.primary}0d 100%)`
              : undefined,
          }}
        >
          {selectedKit ? (
            <TeamJersey
              kit={selectedKit}
              className="h-4 w-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
            />
          ) : (
            <AllTeamsGlyph />
          )}
        </span>
        <span className="truncate">{selected ? selected.name : allLabel}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-text-secondary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute right-0 z-30 mt-1.5 max-h-[19rem] w-[15rem] overflow-y-auto rounded-lg border border-theme-border bg-theme-card p-1 shadow-xl shadow-black/20"
        >
          <Row
            active={value === "all"}
            onSelect={() => pick("all")}
            label={allLabel}
          >
            <AllTeamsGlyph />
          </Row>

          {teams.map((tm) => {
            const kit = getTeamColors(tm.short_name);
            const active = value === tm.short_name;
            return (
              <Row
                key={tm.id}
                active={active}
                onSelect={() => pick(tm.short_name)}
                label={tm.name}
                hint={tm.short_name}
                tint={kit.primary}
              >
                <TeamJersey
                  kit={kit}
                  className="h-4 w-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                />
              </Row>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({
  active,
  onSelect,
  label,
  hint,
  tint,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active}
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors ${
        active
          ? "bg-theme-card-secondary text-theme-foreground"
          : "text-theme-text-secondary hover:bg-theme-card-secondary/60 hover:text-theme-foreground"
      }`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{
          background: tint
            ? `linear-gradient(135deg, ${tint}1a 0%, ${tint}0d 100%)`
            : undefined,
        }}
      >
        {children}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-theme-text-secondary">
          {hint}
        </span>
      )}
      <Check
        className={`h-3.5 w-3.5 shrink-0 ${active ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}

/** Stand-in for "every club" — three overlapping shirt shoulders. */
function AllTeamsGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="text-theme-text-secondary"
      >
        <path d="M4 7.5 6.5 6l1.4 1.4L9.3 6l2.5 1.5V17H4z" />
        <path d="M14 6h6v4" opacity="0.65" />
        <path d="M14 11h6v4" opacity="0.45" />
        <path d="M14 16h6v2" opacity="0.3" />
      </g>
    </svg>
  );
}
