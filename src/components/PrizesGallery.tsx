"use client";

import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
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
      "🚀 Nova sezona kreće",
      "💎 Povećane nagrade",
      "🏆 4 različite lige",
      "⚡ Najbolja i najzabavnija sezona ikad",
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
    features: ["🥇 1. mesto: Originalni dres", "Kod za ulazak: 51kkl0"],
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
      "🥇🏆 1. mesto: 300 KM / 155 € + pehar + medalja + plaketa",
      "🥈 2. mesto: 200 KM / 102 € + medalja + plaketa",
      "🥉 3. mesto: 130 KM / 67 € + medalja + plaketa",
      "4. mesto: 90 KM / 46 €",
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
      "🥇🏆 1. mesto: 500 KM / 255 € + pehar + medalja + plaketa",
      "🥈 2. mesto: 350 KM / 179 € + medalja + plaketa",
      "🥉 3. mesto: 250 KM / 128 € + medalja + plaketa",
      "4. mesto: 200 KM / 103 €",
      "5. mesto: 150 KM / 77 €",
      "6. mesto: 100 KM / 52 €",
      "7. mesto: 80 KM / 41 €",
      "8.-10. mesto: Besplatno učešće naredne sezone",
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
      "🥇🏆 1. mesto: 1.200 KM / 615 € + pehar + medalja + plaketa",
      "🥈 2. mesto: 700 KM / 358 € + medalja + plaketa",
      "🥉 3. mesto: 400 KM / 205 € + medalja + plaketa",
      "4. mesto: Originalni dres PL 25/26",
      "5. mesto: Besplatno učešće naredne sezone",
      "Mjesečne nagrade: 150 KM / 75 € (*10)",
      "Kup nagrade: 200 KM / 100 €",
    ],
  },
  {
    id: 6,
    title: "Specijalna nagrada",
    subtitle: "🏆 AUTENTIČNI DRES ARSENALA IZ SEZONE 2003/2004 🏆",
    image: "/images/form/arsenal.png",
    description:
      'Original! Ovo je sveti gral svakog fudbalskog fanatika. Dres iz legendarne "Invincibles" sezone - kada su Thierry Henry i Arsenal bez poraza osvojili Premier ligu.',
    tier: "arsenal",
    price: "Dres Thierry Henry 03/04",
    features: [
      "👑 Hall of Fame Premier lige",
      "Henry - ikona igre, genije napada, umjetnik na terenu. Ovaj dres nosi DNK nepobjedivosti. Na aukcijama dostiže vrijednost preko 1.000€, rijetkost koja se ne pušta iz ruku.",
      "Igrač sa najviše poena u jednom kolu (PREMIUM liga) odnosi ovu istorijsku relikviju, zajedno sa certifikatom autentičnosti.",
      "📜 OVO NIJE SAMO NAGRADA. OVO JE LEGENDA.",
      "Ovo je dres kojim ispisujete svoju stranicu u istoriji REMIS Fantasy lige",
      "⚔️ Budi najbolji. Uđi u legendu. Osvoji dres nepobjedivih.",
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
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const x = useMotionValue(0);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % prizes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
      scale: 0.8,
    }),
  };

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % prizes.length);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + prizes.length) % prizes.length);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsAccordionOpen(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 100) {
      prevSlide();
    } else if (info.offset.x < -100) {
      nextSlide();
    }
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
      {/* Epic Background Effects */}
      <div className="absolute inset-0">
        {/* Animated orbs - Dynamic colors based on current prize */}
        <motion.div
          className={`absolute top-20 left-20 w-96 h-96 bg-gradient-to-r ${colors.gradient} minimal-radius blur-3xl opacity-15`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-l ${colors.gradient} minimal-radius blur-3xl opacity-10`}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
            rotate: [360, 270, 180, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        {[...Array(50)].map((_, i) => {
          // Use deterministic values based on index to avoid hydration mismatch
          const leftPos = (i * 7.23 + 13.7) % 100;
          const topPos = (i * 11.47 + 27.3) % 100;
          const duration = 3 + (i % 4);

          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white minimal-radius opacity-30"
              style={{
                left: `${leftPos}%`,
                top: `${topPos}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                delay: (i * 0.1) % 5,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Grid pattern */}
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
        {/* Epic Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12 mt-8"
        >
          <motion.h2
            className="text-3xl md:text-6xl font-black mb-4 leading-none font-russo"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 120,
            }}
          >
            <motion.span className="text-theme-heading-primary drop-shadow-2xl theme-transition">
              Nagrade za 25/26 sezonu!
            </motion.span>
          </motion.h2>

          <motion.p
            className="text-theme-text-secondary text-base md:text-lg w-full max-w-4xl mx-auto leading-relaxed font-medium theme-transition"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
            }}
          >
            Svaka mjesec donosi pobjednika, a možete osvojiti i vrijednu nagradu
            osvajanjem kupa.
            <br />
            Detalje potražite u sekciji ispod!
          </motion.p>
        </motion.div>

        {/* Main Carousel Container */}
        <div className="relative w-full max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <motion.button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-theme-secondary/70 backdrop-blur-xl minimal-radius flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-2xl theme-transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>

          <motion.button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-theme-secondary/70 backdrop-blur-xl minimal-radius flex items-center justify-center text-theme-foreground hover:bg-theme-accent transition-all duration-300 border border-theme-border shadow-2xl theme-transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>

          {/* Carousel Container */}
          <div className="relative h-[500px] md:h-[580px] overflow-hidden border border-gray-800/50">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 },
                  rotateY: { duration: 0.6 },
                  scale: { duration: 0.4 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                whileDrag={{ cursor: "grabbing" }}
              >
                {/* Main Prize Card */}
                <motion.div
                  className="relative w-full h-full bg-black/98 shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: `0 20px 40px -8px ${colors.primary}20, inset 0 0 0 1px ${colors.primary}40`,
                  }}
                  whileHover={{
                    boxShadow: `0 25px 50px -10px ${colors.primary}30, inset 0 0 0 1px ${colors.primary}60`,
                    transition: { duration: 0.4 },
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
                          <motion.div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-sm mb-3 shadow-lg border"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                              borderColor: `${colors.primary}40`,
                              boxShadow: `0 4px 14px 0 ${colors.primary}25`,
                            }}
                            whileHover={{
                              boxShadow: `0 6px 20px 0 ${colors.primary}35`,
                              transition: { duration: 0.3 },
                            }}
                          >
                            <Award className="w-4 h-4" />
                            {currentPrize.price}
                          </motion.div>
                        )}

                        <motion.h3
                          className="text-xl lg:text-3xl font-black text-theme-heading-primary mb-2 leading-tight theme-transition"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          {currentPrize.title}
                        </motion.h3>

                        <motion.h4
                          className={`text-base lg:text-xl ${colors.accent} font-semibold mb-3`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          {currentPrize.subtitle}
                        </motion.h4>

                        <motion.p
                          className="text-theme-text-secondary text-sm lg:text-base leading-relaxed mb-4 theme-transition"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          {currentPrize.description}
                        </motion.p>

                        {/* Features Preview/Accordion */}
                        <motion.div
                          className="mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                        >
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
                          <motion.button
                            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                            className="flex items-center gap-2 text-theme-text-muted hover:text-theme-foreground transition-colors text-sm font-medium mb-2 theme-transition"
                            whileTap={{ scale: 0.95 }}
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
                          </motion.button>

                          {/* Accordion Content */}
                          <AnimatePresence>
                            {isAccordionOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 max-h-32 lg:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                  {currentPrize.features.map(
                                    (feature, index) => (
                                      <motion.div
                                        key={index}
                                        className="flex items-start gap-3 text-xs lg:text-sm"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          duration: 0.4,
                                          delay: index * 0.05,
                                        }}
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
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* Bottom - Always Visible Button */}
                      <motion.div
                        className="flex-shrink-0 pt-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                      >
                        <motion.button
                          onClick={() => openModal(currentPrize)}
                          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 minimal-radius font-bold text-sm transition-all duration-300 shadow-lg border"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                            borderColor: `${colors.primary}40`,
                            boxShadow: `0 4px 14px 0 ${colors.primary}25`,
                            color: "#ffffff",
                          }}
                          whileHover={{
                            boxShadow: `0 6px 20px 0 ${colors.primary}35`,
                            scale: 1.02,
                            transition: { duration: 0.3 },
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye className="w-4 h-4" />
                          Pogledaj Detalje
                        </motion.button>
                      </motion.div>
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
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {prizes.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative overflow-hidden minimal-radius transition-all duration-300 ${
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
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 minimal-radius"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 minimal-radius h-1 mt-4 overflow-hidden">
            <motion.div
              className="h-full minimal-radius"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}80, #000000)`,
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              key={currentIndex}
              transition={{
                duration: isAutoPlaying ? 5 : 0,
                ease: "linear",
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
