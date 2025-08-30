"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
    secondary: "#28D5E5",
    gradient: "from-[#F5D056] via-[#28D5E5] to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-[#28D5E5]/5 to-black/20",
    border: "border-[#F5D056]/30",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/20",
  },
  free: {
    primary: "#B114D9",
    gradient: "from-[#B114D9] via-gray-700 to-black",
    accent: "text-[#B114D9]",
    bg: "from-[#B114D9]/10 via-gray-500/5 to-black/20",
    border: "border-[#B114D9]/40",
    icon: "text-[#B114D9]",
    glow: "shadow-[#B114D9]/25",
  },
  standard: {
    primary: "#28D5E5",
    gradient: "from-[#28D5E5] via-gray-600 to-black",
    accent: "text-[#28D5E5]",
    bg: "from-[#28D5E5]/10 via-gray-500/5 to-black/20",
    border: "border-[#28D5E5]/40",
    icon: "text-[#28D5E5]",
    glow: "shadow-[#28D5E5]/25",
  },
  premium: {
    primary: "#F5D056",
    gradient: "from-[#F5D056] via-gray-500 to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-gray-400/5 to-black/20",
    border: "border-[#F5D056]/40",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/25",
  },
  h2h: {
    primary: "#901E1B",
    gradient: "from-[#901E1B] via-gray-700 to-black",
    accent: "text-[#901E1B]",
    bg: "from-[#901E1B]/10 via-gray-600/5 to-black/20",
    border: "border-[#901E1B]/40",
    icon: "text-[#901E1B]",
    glow: "shadow-[#901E1B]/25",
  },
  arsenal: {
    primary: "#DC143C",
    secondary: "#FFFFFF",
    gradient: "from-[#DC143C] via-[#FFFFFF] to-black",
    accent: "text-[#DC143C]",
    bg: "from-[#DC143C]/10 via-[#FFFFFF]/5 to-black/20",
    border: "border-[#DC143C]/40",
    icon: "text-[#DC143C]",
    glow: "shadow-[#DC143C]/25",
  },
  champions: {
    primary: "#003366",
    gradient: "from-[#003366] via-gray-600 to-black",
    accent: "text-[#003366]",
    bg: "from-[#003366]/10 via-gray-500/5 to-black/20",
    border: "border-[#003366]/40",
    icon: "text-[#003366]",
    glow: "shadow-[#003366]/25",
  },
  f1: {
    primary: "#E10600",
    gradient: "from-[#E10600] via-gray-600 to-black",
    accent: "text-[#E10600]",
    bg: "from-[#E10600]/10 via-gray-500/5 to-black/20",
    border: "border-[#E10600]/40",
    icon: "text-[#E10600]",
    glow: "shadow-[#E10600]/25",
  },
};

export default function PrizesGallery({
  prizes,
  leagueFilter,
  title = "Nagrade",
  subtitle = "Osvajaj nevjerovatne nagrade tokom sezone!",
}: PrizesGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Filter prizes based on league
  const filteredPrizes = leagueFilter
    ? prizes.filter((prize) => prize.league === leagueFilter || !prize.league)
    : prizes;

  // Auto-play functionality with synchronized timing
  useEffect(() => {
    if (!isAutoPlaying || filteredPrizes.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredPrizes.length);
        setIsAccordionOpen(false);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredPrizes.length]);

  // Reset current index when prizes change
  useEffect(() => {
    setCurrentIndex(0);
  }, [leagueFilter, prizes]);

  // Smooth slide transition helper
  const performSlideTransition = (newIndex: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const nextSlide = () => {
    if (isTransitioning || filteredPrizes.length <= 1) return;
    setIsAutoPlaying(false);
    const newIndex = (currentIndex + 1) % filteredPrizes.length;
    performSlideTransition(newIndex);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (isTransitioning || filteredPrizes.length <= 1) return;
    setIsAutoPlaying(false);
    const newIndex =
      (currentIndex - 1 + filteredPrizes.length) % filteredPrizes.length;
    performSlideTransition(newIndex);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex || filteredPrizes.length <= 1)
      return;
    setIsAutoPlaying(false);
    performSlideTransition(index);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const openModal = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsModalOpen(true);
    setIsAutoPlaying(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrize(null);
    setTimeout(() => setIsAutoPlaying(true), 1000);
  };

  if (filteredPrizes.length === 0) {
    return (
      <div className="w-full py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-theme-heading-primary mb-4">
              {title}
            </h2>
            <p className="text-theme-text-secondary text-sm sm:text-base">
              Nema dostupnih nagrada za ovu ligu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentPrize = filteredPrizes[currentIndex];
  
  if (!currentPrize) {
    return (
      <div className="w-full py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-theme-heading-primary mb-4">
              {title}
            </h2>
            <p className="text-theme-text-secondary text-sm sm:text-base">
              Greška pri učitavanju nagrada.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const colors = tierColors[currentPrize.tier] || tierColors.standard;

  return (
    <div className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
      {/* Background Effects - contained */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-20 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r ${colors.gradient} rounded-full blur-3xl opacity-5 animate-pulse`}
        />
        <div
          className={`absolute bottom-20 right-20 w-48 h-48 sm:w-80 sm:h-80 bg-gradient-to-l ${colors.gradient} rounded-full blur-3xl opacity-5 animate-pulse`}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-theme-heading-primary">
            {title}
          </h2>
          <p className="text-theme-text-secondary text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Main Prize Card */}
        <div className="relative">
          <div
            className={`bg-theme-card border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
              isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
            }`}
            style={{
              borderColor: `${colors.primary}40`,
              boxShadow: `0 10px 30px -5px ${colors.primary}20`,
            }}
          >
            {/* Mobile Layout */}
            <div className="lg:hidden">
              {/* Mobile Image */}
              <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                <Image
                  src={currentPrize.image}
                  alt={currentPrize.title}
                  fill
                  sizes="100vw"
                  className="object-contain p-4 sm:p-6"
                  priority
                  quality={100}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${colors.bg} opacity-10`}
                />
              </div>
              
              {/* Mobile Content */}
              <div className="p-4 sm:p-6">
                {/* Price Badge */}
                {currentPrize.price && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-sm mb-4 shadow-lg border"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                      borderColor: `${colors.primary}40`,
                    }}
                  >
                    <Award className="w-4 h-4" />
                    {currentPrize.price}
                  </div>
                )}

                <h3 className="text-xl sm:text-2xl font-black text-theme-heading-primary mb-2">
                  {currentPrize.title}
                </h3>

                <h4 className={`text-base sm:text-lg ${colors.accent} font-semibold mb-3`}>
                  {currentPrize.subtitle}
                </h4>

                <p className="text-theme-text-secondary text-sm sm:text-base leading-relaxed mb-4">
                  {currentPrize.description}
                </p>

                {/* Features Accordion */}
                <div className="mb-6">
                  <button
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="flex items-center gap-2 text-theme-text-muted hover:text-theme-foreground transition-colors text-sm font-medium mb-2"
                  >
                    {isAccordionOpen ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Sakrij detalje
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Prikaži detalje ({currentPrize.features.length})
                      </>
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isAccordionOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentPrize.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <span className="text-theme-text-secondary leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => openModal(currentPrize)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg border hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                    borderColor: `${colors.primary}40`,
                    color: "#ffffff",
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Pogledaj Detalje
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-5">
              {/* Desktop Image */}
              <div className="lg:col-span-2 relative overflow-hidden min-h-[500px]">
                <Image
                  src={currentPrize.image}
                  alt={currentPrize.title}
                  fill
                  sizes="40vw"
                  className="object-contain p-8"
                  priority
                  quality={100}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-10`}
                />
              </div>

              {/* Desktop Content */}
              <div className="lg:col-span-3 p-8 flex flex-col justify-between">
                <div className="flex-1">
                  {/* Price Badge */}
                  {currentPrize.price && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-sm mb-4 shadow-lg border"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                        borderColor: `${colors.primary}40`,
                      }}
                    >
                      <Award className="w-4 h-4" />
                      {currentPrize.price}
                    </div>
                  )}

                  <h3 className="text-2xl lg:text-3xl font-black text-theme-heading-primary mb-3">
                    {currentPrize.title}
                  </h3>

                  <h4 className={`text-lg lg:text-xl ${colors.accent} font-semibold mb-4`}>
                    {currentPrize.subtitle}
                  </h4>

                  <p className="text-theme-text-secondary text-base leading-relaxed mb-6">
                    {currentPrize.description}
                  </p>

                  {/* Features Accordion */}
                  <div className="mb-6">
                    <button
                      onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                      className="flex items-center gap-2 text-theme-text-muted hover:text-theme-foreground transition-colors text-sm font-medium mb-3"
                    >
                      {isAccordionOpen ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Sakrij detalje
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Prikaži detalje ({currentPrize.features.length})
                        </>
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isAccordionOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {currentPrize.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: colors.primary }}
                            />
                            <span className="text-theme-text-secondary leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => openModal(currentPrize)}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg border hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                    borderColor: `${colors.primary}40`,
                    color: "#ffffff",
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Pogledaj Detalje
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Buttons - Desktop */}
          {filteredPrizes.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                disabled={isTransitioning}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-theme-secondary/80 backdrop-blur-sm rounded-full items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-lg hover:scale-110 disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextSlide}
                disabled={isTransitioning}
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-theme-secondary/80 backdrop-blur-sm rounded-full items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-lg hover:scale-110 disabled:opacity-50"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        {filteredPrizes.length > 1 && (
          <div className="lg:hidden flex justify-center gap-4 mt-6">
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              className="w-12 h-12 bg-theme-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              className="w-12 h-12 bg-theme-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-lg disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Indicators */}
        {filteredPrizes.length > 1 && (
          <div className="flex justify-center gap-2 mt-6 sm:mt-8">
            {filteredPrizes.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 hover:scale-110 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-3"
                    : "w-3 h-3 bg-theme-text-muted/40 hover:bg-theme-text-muted/60"
                }`}
                style={
                  index === currentIndex
                    ? { background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}80)` }
                    : {}
                }
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {filteredPrizes.length > 1 && (
          <div className="w-full max-w-md mx-auto bg-theme-border/20 rounded-full h-1 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ease-linear ${
                isAutoPlaying ? "duration-[5000ms]" : "duration-300"
              }`}
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}80)`,
                width: isAutoPlaying ? "100%" : "0%",
                animation: isAutoPlaying ? "progressFill 5s linear infinite" : "none",
              }}
            />
          </div>
        )}
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