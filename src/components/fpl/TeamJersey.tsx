"use client";

import { useId } from "react";
import type { TeamKit } from "@/lib/team-colors";

interface TeamJerseyProps {
  kit: TeamKit;
  /** Keepers wear their own kit, never the outfield shirt. */
  isGoalkeeper?: boolean;
  className?: string;
  /** Accessible label — omit for a purely decorative shirt. */
  title?: string;
}

// Shirt silhouette on a 64×64 grid: torso, two sleeve wings, V-neck.
const BODY = "M22 9 H42 L46 13 V57 A3 3 0 0 1 43 60 H21 A3 3 0 0 1 18 57 V13 Z";
const SLEEVE_L = "M22 9 L18 13 V31 L9 28 L6 16 Z";
const SLEEVE_R = "M42 9 L46 13 V31 L55 28 L58 16 Z";
const NECK = "M26.5 9 H37.5 L32 16.5 Z";

// Torso bounds, used to lay the pattern out inside the clip.
const BODY_X = 18;
const BODY_W = 28;
const BODY_Y = 9;
const BODY_H = 51;

const STRIPE_COUNT = 6;

/**
 * A club's home shirt. Renders the real two-colour kit — stripes for
 * Newcastle/Brighton/Palace, contrast sleeves for Arsenal/Villa, plain for
 * Chelsea/Liverpool — instead of flattening every club to one colour.
 */
export default function TeamJersey({
  kit,
  isGoalkeeper = false,
  className,
  title,
}: TeamJerseyProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `jersey-body-${uid}`;
  const shadeId = `jersey-shade-${uid}`;

  // The keeper kit is a single colour by design, so the pattern is dropped.
  const shirt = isGoalkeeper ? kit.gk : kit.shirt;
  const shirtAlt = isGoalkeeper ? kit.gk : kit.shirtAlt;
  const sleeve = isGoalkeeper ? kit.gk : kit.sleeve;
  const pattern = isGoalkeeper ? "solid" : kit.pattern;

  const stripeWidth = BODY_W / STRIPE_COUNT;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* Torso base */}
      <path d={BODY} fill={shirt} />

      {/* Kit pattern, contained inside the torso */}
      <g clipPath={`url(#${clipId})`}>
        {pattern === "stripes" &&
          Array.from({ length: STRIPE_COUNT }).map((_, i) =>
            i % 2 === 1 ? (
              <rect
                key={i}
                x={BODY_X + i * stripeWidth}
                y={BODY_Y}
                width={stripeWidth}
                height={BODY_H}
                fill={shirtAlt}
              />
            ) : null
          )}

        {pattern === "halves" && (
          <rect
            x={BODY_X + BODY_W / 2}
            y={BODY_Y}
            width={BODY_W / 2}
            height={BODY_H}
            fill={shirtAlt}
          />
        )}

        {pattern === "sash" && (
          <path
            d={`M${BODY_X} ${BODY_Y + 8} L${BODY_X + 9} ${BODY_Y} L${
              BODY_X + BODY_W
            } ${BODY_Y + 30} L${BODY_X + BODY_W} ${BODY_Y + 40} Z`}
            fill={shirtAlt}
          />
        )}

        {/* Soft top-light / bottom-shade so the shirt reads as fabric */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          fill={`url(#${shadeId})`}
        />
      </g>

      {/* Sleeves */}
      <path d={SLEEVE_L} fill={sleeve} />
      <path d={SLEEVE_R} fill={sleeve} />

      {/* Cuffs */}
      <path
        d="M9 28 L6 16 L8.5 15.2 L11.4 27.2 Z"
        fill={kit.trim}
        opacity="0.9"
      />
      <path
        d="M55 28 L58 16 L55.5 15.2 L52.6 27.2 Z"
        fill={kit.trim}
        opacity="0.9"
      />

      {/* Neck */}
      <path d={NECK} fill={kit.trim} />

      {/* Outline keeps white kits (Spurs, Leeds, Fulham) visible on light UI */}
      <g fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1.4">
        <path d={SLEEVE_L} />
        <path d={SLEEVE_R} />
        <path d={BODY} />
      </g>
    </svg>
  );
}
