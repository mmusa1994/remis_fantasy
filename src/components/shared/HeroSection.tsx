"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface CTAButton {
  text: string;
  href: string;
}

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaButtons: {
    primary: CTAButton;
    secondary: CTAButton;
  };
}

interface HeroSectionProps {
  content: HeroContent;
  backgroundImage?: string;
  logoPath?: string;
  primaryColor?: string;
  className?: string;
}

export default function HeroSection({
  content,
  backgroundImage,
  logoPath,
  primaryColor = "purple",
  className = "",
}: HeroSectionProps) {
  const { theme } = useTheme();

  const getThemeColors = (color: string) => {
    switch (color) {
      case "purple":
        return {
          light: {
            primary:
              "bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700",
            secondary:
              "bg-transparent hover:bg-purple-50 border-purple-600 text-purple-600 hover:text-purple-700",
            accent: "text-purple-600",
            gradient: "from-purple-500/20 via-transparent to-purple-500/20",
          },
          dark: {
            primary:
              "bg-purple-500 hover:bg-purple-600 border-purple-500 hover:border-purple-600",
            secondary:
              "bg-transparent hover:bg-purple-500/10 border-purple-400 text-purple-400 hover:text-purple-300",
            accent: "text-purple-400",
            gradient: "from-purple-500/30 via-transparent to-purple-500/30",
          },
        };
      case "blue":
        return {
          light: {
            primary:
              "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700",
            secondary:
              "bg-transparent hover:bg-blue-50 border-blue-600 text-blue-600 hover:text-blue-700",
            accent: "text-blue-600",
            gradient: "from-blue-500/20 via-transparent to-blue-500/20",
          },
          dark: {
            primary:
              "bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600",
            secondary:
              "bg-transparent hover:bg-blue-500/10 border-blue-400 text-blue-400 hover:text-blue-300",
            accent: "text-blue-400",
            gradient: "from-blue-500/30 via-transparent to-blue-500/30",
          },
        };
      case "red":
        return {
          light: {
            primary:
              "bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700",
            secondary:
              "bg-transparent hover:bg-red-50 border-red-600 text-red-600 hover:text-red-700",
            accent: "text-red-600",
            gradient: "from-red-500/20 via-transparent to-red-500/20",
          },
          dark: {
            primary:
              "bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600",
            secondary:
              "bg-transparent hover:bg-red-500/10 border-red-400 text-red-400 hover:text-red-300",
            accent: "text-red-400",
            gradient: "from-red-500/30 via-transparent to-red-500/30",
          },
        };
      default:
        return {
          light: {
            primary:
              "bg-gray-600 hover:bg-gray-700 border-gray-600 hover:border-gray-700",
            secondary:
              "bg-transparent hover:bg-gray-50 border-gray-600 text-gray-600 hover:text-gray-700",
            accent: "text-gray-600",
            gradient: "from-gray-500/20 via-transparent to-gray-500/20",
          },
          dark: {
            primary:
              "bg-gray-500 hover:bg-gray-600 border-gray-500 hover:border-gray-600",
            secondary:
              "bg-transparent hover:bg-gray-500/10 border-gray-400 text-gray-400 hover:text-gray-300",
            accent: "text-gray-400",
            gradient: "from-gray-500/30 via-transparent to-gray-500/30",
          },
        };
    }
  };

  const colors = getThemeColors(primaryColor);
  const themeColors = theme === "dark" ? colors.dark : colors.light;

  return (
    <div
      className={`relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden py-8 md:py-12 ${className}`}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            className="object-cover opacity-20 "
            priority
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${themeColors.gradient} z-10`}
      />

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo */}
        {logoPath && (
          <motion.div
            className="mb-6 md:mb-8 flex justify-center "
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-20 h-20 md:w-24 md:h-24">
              <Image
                src={logoPath}
                alt={`${content.title} logo`}
                fill
                className={`object-contain drop-shadow-2xl ${
                  theme === "dark" ? "" : "bg-black"
                }`}
                priority
              />
            </div>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-theme-foreground mb-2 md:mb-4 drop-shadow-lg`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {content.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          className={`text-lg md:text-xl lg:text-2xl font-semibold ${themeColors.accent} mb-4 md:mb-6 drop-shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {content.subtitle}
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-sm md:text-base lg:text-lg text-theme-text-secondary max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed drop-shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {content.description}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href={content.ctaButtons.primary.href}>
            <motion.button
              className={`px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-white border-2 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base ${themeColors.primary}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {content.ctaButtons.primary.text}
            </motion.button>
          </Link>

          <Link href={content.ctaButtons.secondary.href}>
            <motion.button
              className={`px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold border-2 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base ${themeColors.secondary}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {content.ctaButtons.secondary.text}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
