"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cx, formatCompact, formatRank } from "./ui";

export interface RankPoint {
  event: number;
  overall_rank: number;
  points: number;
}

interface RankTrendChartProps {
  data: RankPoint[];
  ariaLabel: string;
  /** Small caption naming the y scale ("log scale"). */
  scaleNote?: string;
  /** "76 pts" — tooltip secondary line. */
  formatPoints: (points: number) => string;
}

const ACCENT = "#8b5cf6"; // violet-500 — the dashboard's single accent
const MUTED = "var(--theme-text-muted)";
const SURFACE = "var(--theme-card)";

const HEIGHT = 104;
const PAD_TOP = 24; // room for a label above the best point
const PAD_BOTTOM = 14;
const PAD_X = 12;

/**
 * Overall rank per gameweek. Log scale, best rank on top, so late-season
 * climbs near the top aren't flattened by the first weeks' millions.
 * Hover (or tap) snaps a crosshair to the nearest gameweek.
 */
export default function RankTrendChart({ data, ariaLabel, scaleNote, formatPoints }: RankTrendChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(() => {
    const valid = data.filter((d) => d.overall_rank > 0);
    if (!valid.length || !width) return [];
    const logs = valid.map((d) => Math.log10(d.overall_rank));
    let lo = Math.min(...logs);
    let hi = Math.max(...logs);
    if (hi - lo < 0.1) {
      lo -= 0.05;
      hi += 0.05;
    }
    const innerW = width - PAD_X * 2;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    return valid.map((d, i) => ({
      ...d,
      x: valid.length === 1 ? width / 2 : PAD_X + (i * innerW) / (valid.length - 1),
      y: PAD_TOP + ((Math.log10(d.overall_rank) - lo) / (hi - lo)) * innerH,
    }));
  }, [data, width]);

  const last = points.length - 1;
  const path = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const nearest = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !points.length) return null;
    const x = clientX - rect.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs(points[best].x - x)) best = i;
    });
    return best;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || e.pointerType === "pen") setActive(nearest(e.clientX));
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => setActive(nearest(e.clientX));
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    // Touch keeps the readout after the finger lifts; mouse clears it.
    if (e.pointerType === "mouse") setActive(null);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!points.length) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((cur) => {
        const from = cur ?? last;
        return Math.max(0, Math.min(last, from + (e.key === "ArrowLeft" ? -1 : 1)));
      });
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const labelFor = (p: (typeof points)[number], anchor: "start" | "end") => {
    const above = p.y - 10 > 10;
    return (
      <text
        x={p.x}
        y={above ? p.y - 10 : p.y + 18}
        textAnchor={anchor}
        fontSize={10}
        fontWeight={600}
        fill="var(--theme-text-secondary)"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatCompact(p.overall_rank)}
      </text>
    );
  };

  const activePoint = active !== null ? points[active] : null;
  const tooltipWidth = 124;

  return (
    <div>
      <div
        ref={wrapRef}
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((cur) => cur ?? last)}
        onBlur={() => setActive(null)}
        className="relative touch-pan-y select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        style={{ height: HEIGHT }}
      >
        {points.length > 0 && (
          <svg width={width} height={HEIGHT} className="block overflow-visible" aria-hidden="true">
            {activePoint && (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={6}
                y2={HEIGHT - 4}
                stroke="var(--theme-border-strong)"
                strokeWidth={1}
              />
            )}
            {points.length > 1 && (
              <path d={path} fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {points.length > 1 && (
              <path
                d={`M${points[last - 1].x} ${points[last - 1].y} L${points[last].x} ${points[last].y}`}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )}
            {points.map((p, i) => {
              const isActive = i === active;
              const isLast = i === last;
              return (
                <circle
                  key={p.event}
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 5 : 4}
                  fill={isLast || isActive ? ACCENT : MUTED}
                  stroke={SURFACE}
                  strokeWidth={2}
                />
              );
            })}
            {!activePoint && points.length > 1 && labelFor(points[0], "start")}
            {!activePoint && labelFor(points[last], points.length > 1 ? "end" : "start")}
          </svg>
        )}

        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-theme-border bg-theme-card px-2.5 py-1.5 shadow-lg"
            style={{
              width: tooltipWidth,
              left: Math.max(0, Math.min(width - tooltipWidth, activePoint.x - tooltipWidth / 2)),
              top: activePoint.y > HEIGHT / 2 ? 0 : HEIGHT - 44,
            }}
          >
            <div className="text-xs font-semibold tabular-nums text-theme-heading-primary">
              {formatRank(activePoint.overall_rank)}
            </div>
            <div className="text-[10px] text-theme-text-muted">
              GW{activePoint.event} · {formatPoints(activePoint.points)}
            </div>
          </div>
        )}
      </div>

      {points.length > 0 && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-theme-text-muted">
          <span>GW{points[0].event}</span>
          {scaleNote && <span className={cx(points.length < 2 && "hidden")}>{scaleNote}</span>}
          {points.length > 1 && <span>GW{points[last].event}</span>}
        </div>
      )}
    </div>
  );
}
