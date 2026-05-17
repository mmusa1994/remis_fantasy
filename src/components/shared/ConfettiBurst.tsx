"use client";

import { useEffect, useState } from "react";

// Brief, lightweight confetti burst — used after a successful save in the
// predictor. Pure CSS particles (no canvas / no library) so it stays cheap
// on low-end mobiles. Each particle has a randomized angle + delay so the
// burst feels alive.

type Particle = {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  color: string;
  size: number;
  shape: "circle" | "square" | "triangle";
};

const COLORS = [
  "#f59e0b", // amber 500
  "#fbbf24", // amber 400
  "#10b981", // emerald 500
  "#06b6d4", // cyan 500
  "#a78bfa", // violet 400
  "#ec4899", // pink 500
  "#fde047", // yellow 300
  "#fb923c", // orange 400
];

function buildParticles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    out.push({
      id: i,
      angle,
      distance: 80 + Math.random() * 140,
      delay: Math.random() * 0.12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      shape: (["circle", "square", "triangle"] as const)[
        Math.floor(Math.random() * 3)
      ],
    });
  }
  return out;
}

export default function ConfettiBurst({
  trigger,
  count = 28,
  onDone,
  vibrate = true,
}: {
  /** Bump this value to start a new burst. */
  trigger: number;
  count?: number;
  onDone?: () => void;
  vibrate?: boolean;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setParticles(buildParticles(count));
    setVisible(true);
    // Haptic feedback on supported devices (Android Chrome, etc.).
    if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([12, 30, 18]);
      } catch {
        /* ignore */
      }
    }
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1300);
    return () => clearTimeout(timer);
  }, [trigger, count, vibrate, onDone]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="relative w-0 h-0">
        {particles.map((p) => {
          const x = Math.cos(p.angle) * p.distance;
          const y = Math.sin(p.angle) * p.distance;
          return (
            <span
              key={p.id}
              className="absolute top-0 left-0 confetti-particle"
              style={{
                width: p.size,
                height: p.size,
                background: p.shape === "triangle" ? "transparent" : p.color,
                borderRadius:
                  p.shape === "circle"
                    ? "50%"
                    : p.shape === "square"
                      ? "3px"
                      : 0,
                borderLeft:
                  p.shape === "triangle"
                    ? `${p.size / 2}px solid transparent`
                    : undefined,
                borderRight:
                  p.shape === "triangle"
                    ? `${p.size / 2}px solid transparent`
                    : undefined,
                borderBottom:
                  p.shape === "triangle"
                    ? `${p.size}px solid ${p.color}`
                    : undefined,
                ["--cx" as any]: `${x}px`,
                ["--cy" as any]: `${y}px`,
                animationDelay: `${p.delay}s`,
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        .confetti-particle {
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: confetti-fly 1.1s ease-out forwards;
        }
        @keyframes confetti-fly {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--cx)),
                calc(-50% + var(--cy) + 40px)
              )
              scale(1) rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-particle {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
