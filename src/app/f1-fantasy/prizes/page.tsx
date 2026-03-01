"use client";

import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import { GiTrophyCup } from "react-icons/gi";
import { MdEmojiEvents } from "react-icons/md";

export default function F1FantasyPrizesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("f1");
  const isDark = theme === "dark";

  const prizes = [
    {
      place: t("prizes.firstTitle"),
      percent: "35%",
      description: t("prizes.firstDesc"),
      color: "#F4CE2A",
      borderColor: "border-[#F4CE2A]",
      bgGlow: "rgba(244,206,42,0.1)",
      icon: <GiTrophyCup className="text-[#F4CE2A] text-3xl" />,
      images: [
        {
          src: "/images/f1/REMIS-FANTASY-removebg-preview 8.png",
          alt: t("prizes.trophyLabel"),
          label: t("prizes.trophyLabel"),
        },
        {
          src: "/images/f1/REMIS-FANTASY-removebg-preview 4.png",
          alt: t("prizes.shirtLabel"),
          label: t("prizes.shirtLabel"),
        },
      ],
    },
    {
      place: t("prizes.secondTitle"),
      percent: "25%",
      description: t("prizes.secondDesc"),
      color: "#C0C0C0",
      borderColor: "border-[#C0C0C0]",
      bgGlow: "rgba(192,192,192,0.08)",
      icon: <MdEmojiEvents className="text-[#C0C0C0] text-3xl" />,
      images: [
        {
          src: "/images/f1/REMIS-FANTASY-removebg-preview 7.png",
          alt: t("prizes.modelCarLabel"),
          label: t("prizes.modelCarLabel"),
        },
      ],
    },
    {
      place: t("prizes.thirdTitle"),
      percent: "15%",
      description: t("prizes.thirdDesc"),
      color: "#B47B36",
      borderColor: "border-[#B47B36]",
      bgGlow: "rgba(180,123,54,0.08)",
      icon: <MdEmojiEvents className="text-[#B47B36] text-3xl" />,
      images: [
        {
          src: "/images/f1/REMIS-FANTASY-removebg-preview 9.png",
          alt: t("prizes.keychainLabel"),
          label: t("prizes.keychainLabel"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-theme-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-anta uppercase tracking-tight text-4xl text-[#FF0000] mb-3">
            {t("prizes.pageTitle")}
          </h1>
          <p
            className={`text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("prizes.pageSubtitle")}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30">
            <span className="font-anta text-[#FF0000] text-lg uppercase tracking-wide">
              {t("prizes.entryFee")}: €10
            </span>
          </div>
        </div>

        {/* Prize Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {prizes.map((prize, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl border-2 ${prize.borderColor} overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isDark ? "bg-gray-900/80" : "bg-white"
              }`}
              style={{
                boxShadow: `0 4px 24px -4px ${prize.bgGlow}`,
              }}
            >
              {/* Top accent stripe */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: prize.color }}
              />

              <div className="p-6">
                {/* Place + Percent */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {prize.icon}
                    <h2
                      className={`font-anta text-xl uppercase tracking-wide ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {prize.place}
                    </h2>
                  </div>
                  <span
                    className="font-anta text-2xl font-bold"
                    style={{ color: prize.color }}
                  >
                    {prize.percent}
                  </span>
                </div>

                {/* Description */}
                <p
                  className={`text-sm mb-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {prize.description}
                </p>

                {/* Prize Images */}
                <div
                  className={`flex items-center justify-center gap-4 ${
                    prize.images.length > 1 ? "flex-row" : ""
                  }`}
                >
                  {prize.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="flex flex-col items-center">
                      <div
                        className={`relative w-32 h-32 rounded-lg overflow-hidden ${
                          isDark ? "bg-gray-800" : "bg-gray-50"
                        } p-2`}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-contain p-1"
                          sizes="128px"
                        />
                      </div>
                      <span
                        className={`mt-2 text-xs font-anta uppercase tracking-wide ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {img.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/f1-fantasy/tables"
            className="px-6 py-3 rounded-lg bg-[#FF0000] text-white font-anta uppercase tracking-wide text-sm hover:bg-[#cc0000] transition-colors"
          >
            {t("prizes.viewTables")}
          </Link>
          <Link
            href="/f1-fantasy/registration"
            className={`px-6 py-3 rounded-lg border-2 border-[#FF0000] text-[#FF0000] font-anta uppercase tracking-wide text-sm hover:bg-[#FF0000]/10 transition-colors`}
          >
            {t("prizes.register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
