"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { UserPlus, Link2, Trophy } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    titleKey: "hero:howItWorks.step1.title",
    descKey: "hero:howItWorks.step1.description",
    gradient: "from-purple-500 to-violet-600",
    glow: "purple",
    ring: "ring-purple-500/20",
    iconBg: "bg-purple-500",
  },
  {
    step: 2,
    icon: Link2,
    titleKey: "hero:howItWorks.step2.title",
    descKey: "hero:howItWorks.step2.description",
    gradient: "from-blue-500 to-cyan-500",
    glow: "blue",
    ring: "ring-blue-500/20",
    iconBg: "bg-blue-500",
  },
  {
    step: 3,
    icon: Trophy,
    titleKey: "hero:howItWorks.step3.title",
    descKey: "hero:howItWorks.step3.description",
    gradient: "from-emerald-500 to-green-500",
    glow: "green",
    ring: "ring-emerald-500/20",
    iconBg: "bg-emerald-500",
  },
];

const glowColors: Record<string, { dark: string; light: string }> = {
  purple: {
    dark: "rgba(139,92,246,0.15)",
    light: "rgba(139,92,246,0.08)",
  },
  blue: {
    dark: "rgba(59,130,246,0.15)",
    light: "rgba(59,130,246,0.08)",
  },
  green: {
    dark: "rgba(16,185,129,0.15)",
    light: "rgba(16,185,129,0.08)",
  },
};

const lineGradients: Record<string, string> = {
  purple: "from-purple-500 to-blue-500",
  blue: "from-blue-500 to-emerald-500",
};

export default function HowItWorks() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);
  const [lineProgress, setLineProgress] = useState<number[]>([0, 0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger step reveals
          setTimeout(() => setVisibleSteps((p) => [true, p[1], p[2]]), 200);
          setTimeout(() => {
            setLineProgress((p) => [1, p[1]]);
          }, 600);
          setTimeout(() => setVisibleSteps((p) => [p[0], true, p[2]]), 900);
          setTimeout(() => {
            setLineProgress([1, 1]);
          }, 1300);
          setTimeout(() => setVisibleSteps([true, true, true]), 1600);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 px-4" ref={sectionRef}>
      <div className="max-w-5xl mx-auto">
        {/* Section Title */}
        <h2
          className={`text-xl md:text-2xl font-black text-center mb-20 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {t("hero:howItWorks.title")}
        </h2>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Connecting Lines between steps */}
            <div className="absolute top-[44px] left-[16.67%] right-[16.67%] flex">
              {/* Line 1→2 */}
              <div className="flex-1 h-[2px] relative overflow-hidden">
                <div
                  className={`absolute inset-0 ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${lineGradients.purple} transition-all duration-1000 ease-out`}
                  style={{ width: `${lineProgress[0] * 100}%` }}
                />
                {/* Traveling particle */}
                {lineProgress[0] === 1 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400 animate-travel-line-1"
                    style={{
                      boxShadow: `0 0 12px 3px rgba(59,130,246,0.5)`,
                    }}
                  />
                )}
              </div>
              {/* Line 2→3 */}
              <div className="flex-1 h-[2px] relative overflow-hidden">
                <div
                  className={`absolute inset-0 ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${lineGradients.blue} transition-all duration-1000 ease-out`}
                  style={{ width: `${lineProgress[1] * 100}%` }}
                />
                {lineProgress[1] === 1 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 animate-travel-line-2"
                    style={{
                      boxShadow: `0 0 12px 3px rgba(16,185,129,0.5)`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isVisible = visibleSteps[idx];

                return (
                  <div
                    key={step.step}
                    className={`text-center transition-all duration-700 ease-out ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    }`}
                  >
                    {/* Icon Circle */}
                    <div className="relative mx-auto mb-8 w-[88px] h-[88px]">
                      {/* Outer glow ring */}
                      <div
                        className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                          isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
                        }`}
                        style={{
                          background: `radial-gradient(circle, ${
                            glowColors[step.glow][theme === "dark" ? "dark" : "light"]
                          } 0%, transparent 70%)`,
                          transform: isVisible ? "scale(1.8)" : "scale(0.5)",
                        }}
                      />
                      {/* Spinning border ring */}
                      <div
                        className={`absolute inset-0 rounded-full animate-spin-slow ${
                          isVisible ? "opacity-100" : "opacity-0"
                        } transition-opacity duration-500`}
                        style={{
                          animationDuration: "8s",
                          background: `conic-gradient(from 0deg, transparent 0%, ${
                            step.glow === "purple"
                              ? "rgba(139,92,246,0.4)"
                              : step.glow === "blue"
                              ? "rgba(59,130,246,0.4)"
                              : "rgba(16,185,129,0.4)"
                          } 25%, transparent 50%)`,
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
                          WebkitMask:
                            "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
                        }}
                      />
                      {/* Main circle */}
                      <div
                        className={`absolute inset-2 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          theme === "dark"
                            ? "bg-gray-900 border-gray-700"
                            : "bg-white border-gray-200 shadow-lg"
                        } ${isVisible ? "scale-100" : "scale-75"}`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}
                        >
                          <StepIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      {/* Step number badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-xs font-bold shadow-md border-2 ${
                          theme === "dark" ? "border-gray-900" : "border-white"
                        } transition-all duration-500 ${
                          isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                      >
                        {step.step}
                      </div>
                    </div>

                    {/* Text Content */}
                    <div
                      className={`transition-all duration-500 delay-200 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <h3
                        className={`text-base font-bold mb-3 ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {t(step.titleKey)}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed max-w-[260px] mx-auto ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Layout — vertical timeline */}
        <div className="md:hidden">
          <div className="relative pl-12">
            {/* Vertical line */}
            <div
              className={`absolute left-[19px] top-0 bottom-0 w-[2px] ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              {/* Animated fill */}
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-purple-500 via-blue-500 to-emerald-500 transition-all duration-[2s] ease-out"
                style={{
                  height: visibleSteps[2]
                    ? "100%"
                    : visibleSteps[1]
                    ? "66%"
                    : visibleSteps[0]
                    ? "33%"
                    : "0%",
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isVisible = visibleSteps[idx];

                return (
                  <div
                    key={step.step}
                    className={`relative transition-all duration-700 ease-out ${
                      isVisible
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                  >
                    {/* Circle on timeline */}
                    <div className="absolute -left-12 top-0">
                      <div className="relative w-10 h-10">
                        <div
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg transition-all duration-500 ${
                            isVisible ? "scale-100" : "scale-0"
                          }`}
                        >
                          <StepIcon className="w-4 h-4 text-white" />
                        </div>
                        {/* Pulse ring */}
                        {isVisible && (
                          <div
                            className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} animate-ping opacity-20`}
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      className={`p-5 rounded-xl border transition-all duration-500 ${
                        theme === "dark"
                          ? "bg-gray-800/50 border-gray-700/50"
                          : "bg-white/80 border-gray-200 shadow-sm"
                      } ${isVisible ? "shadow-md" : ""}`}
                      style={
                        isVisible
                          ? {
                              boxShadow:
                                theme === "dark"
                                  ? `0 4px 24px -4px ${
                                      glowColors[step.glow].dark
                                    }`
                                  : undefined,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${step.gradient}`}
                        >
                          {step.step}
                        </span>
                        <h3
                          className={`text-base font-bold ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {t(step.titleKey)}
                        </h3>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
