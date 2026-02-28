"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Eye } from "lucide-react";
import PrizeModal from "./PrizeModal";

export interface Prize {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  tier:
    | "intro"
    | "free"
    | "standard"
    | "premium"
    | "h2h"
    | "arsenal"
    | "champions"
    | "f1";
  league?: "premier" | "champions" | "f1";
  price?: string;
  features: string[];
}

interface PrizesGalleryProps {
  prizes: Prize[];
  leagueFilter?: "premier" | "champions" | "f1";
  title?: string;
  subtitle?: string;
}

const tierColors = {
  intro: {
    primary: "#F5D056",
    accent: "text-[#F5D056]",
  },
  free: {
    primary: "#B114D9",
    accent: "text-[#B114D9]",
  },
  standard: {
    primary: "#28D5E5",
    accent: "text-[#28D5E5]",
  },
  premium: {
    primary: "#F5D056",
    accent: "text-[#F5D056]",
  },
  h2h: {
    primary: "#901E1B",
    accent: "text-[#901E1B]",
  },
  arsenal: {
    primary: "#DC143C",
    accent: "text-[#DC143C]",
  },
  champions: {
    primary: "#003366",
    accent: "text-[#003366]",
  },
  f1: {
    primary: "#E10600",
    accent: "text-[#E10600]",
  },
};

export default function PrizesGallery({
  prizes,
  leagueFilter,
  title = "Nagrade",
  subtitle = "Osvajaj nevjerovatne nagrade tokom sezone!",
}: PrizesGalleryProps) {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter prizes based on league
  const filteredPrizes = leagueFilter
    ? prizes.filter((prize) => prize.league === leagueFilter || !prize.league)
    : prizes;

  const openModal = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrize(null);
  };

  if (filteredPrizes.length === 0) {
    return (
      <div className="w-full py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-theme-heading-primary mb-4">
            {title}
          </h2>
          <p className="text-theme-text-secondary">
            Nema dostupnih nagrada za ovu ligu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="text-center mb-8 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 text-theme-heading-primary">
          {title}
        </h2>
        <p className="text-theme-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Prizes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {filteredPrizes.map((prize) => {
          const colors = tierColors[prize.tier] || tierColors.standard;
          
          return (
            <div
              key={prize.id}
              className="bg-theme-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              style={{
                borderColor: `${colors.primary}30`,
                boxShadow: `0 4px 12px -2px ${colors.primary}10`,
              }}
            >
              {/* Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={prize.image}
                  alt={prize.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain p-4"
                  quality={80}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Price Badge */}
                {prize.price && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-white font-bold text-xs mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60)`,
                    }}
                  >
                    <Award className="w-3 h-3" />
                    {prize.price}
                  </div>
                )}

                <h3 className="text-lg font-black text-theme-heading-primary mb-2">
                  {prize.title}
                </h3>

                <h4 className={`text-sm ${colors.accent} font-semibold mb-2`}>
                  {prize.subtitle}
                </h4>

                <p className="text-theme-text-secondary text-sm leading-relaxed mb-3">
                  {prize.description}
                </p>

                {/* Features List */}
                <div className="mb-4">
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {prize.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div
                          className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <span className="text-theme-text-secondary leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                    {prize.features.length > 3 && (
                      <div className="text-xs text-theme-text-muted mt-1">
                        +{prize.features.length - 3} više
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => openModal(prize)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all duration-300 hover:shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60)`,
                    color: "#ffffff",
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Pogledaj Detalje
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prize Details Modal */}
      <PrizeModal
        prize={selectedPrize}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}