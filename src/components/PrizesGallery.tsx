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
import PrizeModal from "./shared/PrizeModal";

interface Prize {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  tier: "intro" | "free" | "standard" | "premium" | "h2h" | "arsenal";
  price?: string;
  features: string[];
}

const prizes: Prize[] = [
  {
    id: 1,
    title: "Dobrodošli u novu sezonu",
    subtitle: "REMIS Fantasy 2025/26",
    image: "/images/new-season/Intro.png",
    description:
      "Spremite se za najuzbudljiviju sezonu fantasy footballa! Nove lige, veće nagrade, bolje iskustvo.",
    tier: "intro",
    features: [
      "Nova sezona kreće",
      "Povećane nagrade",
      "4 različite lige",
      "Najbolja i najzabavnija sezona ikad",
    ],
  },
  {
    id: 2,
    title: "Free Liga",
    subtitle: "Sezona 25/26 - Besplatno!",
    image: "/images/new-season/free.png",
    description:
      "Prošlogodišnji učesnici automatski ubačeni. Najbolji dobija originalni dres!",
    tier: "free",
    price: "Besplatno",
    features: ["1. mjesto: Originalni dres", "Kod za ulazak: 51kkl0"],
  },
  {
    id: 3,
    title: "H2H Liga",
    subtitle: "40 učesnika - Head-to-Head",
    image: "/images/new-season/h2h.png",
    description:
      "Najnepredvidivija liga sa bogatim nagradnim fondom od 720 KM / 368 €.",
    tier: "h2h",
    price: "20 KM / 10 €",
    features: [
      "1. mjesto: 300 KM / 155 € + pehar + medalja + plaketa",
      "2. mjesto: 200 KM / 102 € + medalja + plaketa",
      "3. mjesto: 130 KM / 67 € + medalja + plaketa",
      "4. mjesto: 90 KM / 46 €",
    ],
  },
  {
    id: 4,
    title: "Standard Liga",
    subtitle: "100 učesnika - Klasa i tradicija",
    image: "/images/new-season/standard.png",
    description:
      "Standardna liga s mjesečnim i kup nagradama. Nagradni fond 2.400 KM / 1.228 €.",
    tier: "standard",
    price: "30 KM / 15 €",
    features: [
      "1. mjesto: 500 KM / 255 € + pehar + medalja + plaketa",
      "2. mjesto: 350 KM / 179 € + medalja + plaketa",
      "3. mjesto: 250 KM / 128 € + medalja + plaketa",
      "4. mjesto: 200 KM / 103 €",
      "5. mjesto: 150 KM / 77 €",
      "6. mjesto: 100 KM / 52 €",
      "7. mjesto: 80 KM / 41 €",
      "8.-10. mjesto: Besplatno učešće naredne sezone",
      "Mjesečne nagrade: 75 KM / 38 € (*10)",
      "Kup nagrade: 100 KM / 52 €",
    ],
  },
  {
    id: 5,
    title: "Premium Liga",
    subtitle: "50 učesnika - Vrhunsko iskustvo",
    image: "/images/new-season/premium.png",
    description:
      "Najekskluzivnija liga s najvećim nagradama i posebnim privilegijama. Fond 4.000 KM / 2.050 €.",
    tier: "premium",
    price: "100 KM / 52 €",
    features: [
      "1. mjesto: 1.200 KM / 615 € + pehar + medalja + plaketa",
      "2. mjesto: 700 KM / 358 € + medalja + plaketa",
      "3. mjesto: 400 KM / 205 € + medalja + plaketa",
      "4. mjesto: Originalni dres PL 25/26",
      "5. mjesto: Besplatno učešće naredne sezone",
      "Mjesečne nagrade: 150 KM / 75 € (*10)",
      "Kup nagrade: 200 KM / 100 €",
    ],
  },
  {
    id: 6,
    title: "Specijalna nagrada",
    subtitle: "AUTENTIČNI DRES ARSENALA IZ SEZONE 2003/2004",
    image: "/images/form/arsenal.png",
    description:
      'Original! Ovo je sveti gral svakog fudbalskog fanatika. Dres iz legendarne "Invincibles" sezone - kada su Thierry Henry i Arsenal bez poraza osvojili Premier ligu.',
    tier: "arsenal",
    price: "Dres Thierry Henry 03/04",
    features: [
      "Hall of Fame Premier lige",
      "Henry - ikona igre, genije napada, umjetnik na terenu. Ovaj dres nosi DNK nepobjedivosti. Na aukcijama dostiže vrijednost preko 1.000€, rijetkost koja se ne pušta iz ruku.",
      "Igrač sa najviše poena u jednom kolu (PREMIUM liga) odnosi ovu istorijsku relikviju, zajedno sa certifikatom autentičnosti.",
      "OVO NIJE SAMO NAGRADA. OVO JE LEGENDA.",
      "Ovo je dres kojim ispisujete svoju stranicu u istoriji REMIS Fantasy lige",
      "Budi najbolji. Uđi u legendu. Osvoji dres nepobjedivih.",
    ],
  },
];

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
};

export default function PrizesGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality with synchronized timing
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % prizes.length);
        setIsAccordionOpen(false);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

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
    if (isTransitioning) return;
    setIsAutoPlaying(false);
    const newIndex = (currentIndex + 1) % prizes.length;
    performSlideTransition(newIndex);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsAutoPlaying(false);
    const newIndex = (currentIndex - 1 + prizes.length) % prizes.length;
    performSlideTransition(newIndex);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
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

  const currentPrize = prizes[currentIndex];
  const colors = tierColors[currentPrize.tier];

  return (
    <section
      id="prizes"
      className="relative w-full min-h-screen bg-theme-background py-20 overflow-hidden theme-transition"
    >
      {/* Optimized Background Effects */}
      <div className="absolute inset-0 particles-bg">
        {/* Lightweight animated orbs */}
        <div
          className={`absolute top-20 left-20 w-96 h-96 bg-gradient-to-r ${colors.gradient} minimal-radius blur-3xl opacity-15 animate-pulse-gentle gpu-accelerated`}
        />
        <div
          className={`absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-l ${colors.gradient} minimal-radius blur-3xl opacity-10 animate-float-slow gpu-accelerated`}
        />

        {/* Simplified grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 15l10 15-10 15-10-15z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 mt-8 animate-fade-in-up">
          <h2 className="text-3xl md:text-6xl font-black mb-4 leading-none font-russo animate-scale-in animate-delay-200">
            <span className="text-theme-heading-primary drop-shadow-2xl theme-transition">
              Nagrade za 25/26 sezonu!
            </span>
          </h2>

          <p className="text-theme-text-secondary text-base md:text-lg w-full max-w-4xl mx-auto leading-relaxed font-medium theme-transition animate-fade-in animate-delay-500">
            Svaka mjesec donosi pobjednika, a možete osvojiti i vrijednu nagradu
            osvajanjem kupa.
            <br />
            Detalje potražite u sekciji ispod!
          </p>
        </div>

        {/* Main Carousel Container */}
        <div className="relative w-full max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-theme-secondary/70 backdrop-blur-xl minimal-radius flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-500 ease-in-out border border-theme-border shadow-2xl theme-transition hover:scale-105 focus-ring disabled:opacity-50"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-theme-secondary/70 backdrop-blur-xl minimal-radius flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-500 ease-in-out border border-theme-border shadow-2xl theme-transition hover:scale-105 focus-ring disabled:opacity-50"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Carousel Container */}
          <div className="relative h-[500px] md:h-[580px] overflow-hidden border border-gray-800/50">
            <div
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {/* Main Prize Card */}
              <div
                className="relative w-full h-full bg-black/98 shadow-2xl overflow-hidden hover-glow gpu-accelerated"
                style={{
                  boxShadow: `0 20px 40px -8px ${colors.primary}20, inset 0 0 0 1px ${colors.primary}40`,
                }}
              >
                {/* Background gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5`}
                ></div>

                {/* Content Grid */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 h-full">
                  {/* Left Side - Image */}
                  <div className="hidden lg:block lg:col-span-2 relative overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={currentPrize.image}
                        alt={currentPrize.title}
                        fill
                        sizes="(max-width: 1024px) 0vw, 40vw"
                        className="object-contain p-4"
                        priority
                        quality={100}
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-20`}
                      ></div>
                    </div>
                  </div>

                  {/* Right Side - Content */}
                  <div className="col-span-1 lg:col-span-3 p-4 lg:p-8 flex flex-col justify-between min-h-full">
                    {/* Top Content */}
                    <div className="flex-1">
                      {/* Price Badge */}
                      {currentPrize.price && (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-sm mb-3 shadow-lg border animate-scale-in"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                            borderColor: `${colors.primary}40`,
                            boxShadow: `0 4px 14px 0 ${colors.primary}25`,
                          }}
                        >
                          <Award className="w-4 h-4" />
                          {currentPrize.price}
                        </div>
                      )}

                      <h3 className="text-xl lg:text-3xl font-black text-theme-heading-primary mb-2 leading-tight theme-transition animate-slide-in-left">
                        {currentPrize.title}
                      </h3>

                      <h4
                        className={`text-base lg:text-xl ${colors.accent} font-semibold mb-3 animate-slide-in-left animate-delay-100`}
                      >
                        {currentPrize.subtitle}
                      </h4>

                      <p className="text-theme-text-secondary text-sm lg:text-base leading-relaxed mb-4 theme-transition animate-fade-in animate-delay-200">
                        {currentPrize.description}
                      </p>

                      {/* Features Preview/Accordion */}
                      <div className="mb-4 animate-fade-in animate-delay-300">
                        {/* Quick Summary */}
                        <div className="text-theme-text-muted text-sm mb-3 theme-transition">
                          {currentPrize.tier === "h2h" &&
                            "Turnirski format sa direktnim sukobima"}
                          {currentPrize.tier === "standard" &&
                            "Klasična liga sa mjesečnim nagradama"}
                          {currentPrize.tier === "premium" &&
                            "VIP liga sa najvećim nagradama"}
                          {currentPrize.tier === "free" &&
                            "Besplatno učešće za veterane"}
                          {currentPrize.tier === "intro" &&
                            "Dobrodošli u novu sezonu"}
                          {currentPrize.tier === "arsenal" &&
                            "Legendarna nagrada za najbolje"}
                        </div>

                        {/* Accordion Toggle */}
                        <button
                          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                          className="flex items-center gap-2 text-theme-text-muted hover:text-theme-foreground transition-all duration-300 ease-in-out text-sm font-medium mb-2 theme-transition hover:scale-105 focus-ring"
                        >
                          {isAccordionOpen ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Sakrij nagrade
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Prikaži nagrade ({currentPrize.features.length})
                            </>
                          )}
                        </button>

                        {/* Accordion Content */}
                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            isAccordionOpen
                              ? "max-h-96 opacity-100 transform translate-y-0"
                              : "max-h-0 opacity-0 transform -translate-y-2"
                          }`}
                        >
                          <div className="space-y-2 max-h-32 lg:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            {currentPrize.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 text-xs lg:text-sm animate-slide-in-left"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div
                                  className="w-1.5 h-1.5 minimal-radius mt-1.5 flex-shrink-0"
                                  style={{
                                    backgroundColor: colors.primary,
                                  }}
                                ></div>
                                <span className="text-theme-text-secondary font-medium leading-relaxed theme-transition">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom - Always Visible Button */}
                    <div className="flex-shrink-0 pt-2 animate-fade-in animate-delay-400">
                      <button
                        onClick={() => openModal(currentPrize)}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 minimal-radius font-bold text-sm transition-all duration-300 shadow-lg border hover-scale focus-ring"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                          borderColor: `${colors.primary}40`,
                          boxShadow: `0 4px 14px 0 ${colors.primary}25`,
                          color: "#ffffff",
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Pogledaj Detalje
                      </button>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div
                  className="absolute top-0 left-0 w-16 h-16 opacity-20 rounded-br-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}30, transparent)`,
                  }}
                ></div>
                <div
                  className="absolute bottom-0 right-0 w-16 h-16 opacity-20 rounded-tl-lg"
                  style={{
                    background: `linear-gradient(315deg, ${colors.primary}30, transparent)`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {prizes.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative overflow-hidden minimal-radius transition-all duration-500 ease-in-out hover:scale-110 focus-ring ${
                  index === currentIndex
                    ? "w-12 h-4"
                    : "w-4 h-4 bg-gray-600 hover:bg-gray-500"
                }`}
                style={
                  index === currentIndex
                    ? {
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}80, #000000)`,
                      }
                    : {}
                }
              >
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-white/20 minimal-radius animate-slide-x" />
                )}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 minimal-radius h-1 mt-4 overflow-hidden">
            <div
              className={`h-full minimal-radius transition-all ease-linear ${
                isAutoPlaying ? "duration-[5000ms]" : "duration-300"
              }`}
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}80, #000000)`,
                width: isAutoPlaying ? "100%" : "0%",
                animation: isAutoPlaying
                  ? "progressFill 5s linear infinite"
                  : "none",
              }}
            />
          </div>
        </div>

        {/* Prize Details Modal */}
        <PrizeModal
          prize={selectedPrize}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </section>
  );
}
