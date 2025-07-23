"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { name: "Registracija", href: "#registration" },
  { name: "Nagrade", href: "#prizes" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { theme } = useTheme();

  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    [
      "transparent",
      theme === "dark" ? "rgba(0, 0, 0, 0.95)" : "rgba(245, 245, 220, 0.95)",
    ]
  );

  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ["blur(0px)", "blur(20px)"]
  );

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 transition-all duration-700 theme-transition"
      style={{
        backgroundColor,
        backdropFilter: backdropBlur,
        WebkitBackdropFilter: backdropBlur,
        zIndex: 9999,
      }}
    >
      {/* Animated border-bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{
          opacity: isScrolled ? 1 : 0,
          scaleX: isScrolled ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background:
            "linear-gradient(90deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 1))",
          backgroundSize: "300% 100%",
        }}
      >
        <motion.div
          className="w-full h-full"
          animate={{
            backgroundPosition: isScrolled
              ? ["0% 0%", "100% 0%", "0% 0%"]
              : "0% 0%",
          }}
          transition={{
            duration: 4,
            repeat: isScrolled ? Infinity : 0,
            ease: "linear",
          }}
          style={{
            background: "inherit",
          }}
        />
      </motion.div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className={`relative transition-all duration-500 ${
                isScrolled ? "w-14 h-14" : "w-18 h-18"
              }`}
              whileHover={{
                scale: 1.15,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              {/* Sophisticated glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-600/30 to-red-800/40 force-circle blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Clean logo without background */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src="/images/rf-no-bg.png"
                  alt="Remis Fantasy Logo"
                  width={60}
                  height={60}
                  className={`transition-all duration-500 ${
                    isScrolled ? "w-12 h-12" : "w-16 h-16"
                  } object-contain filter drop-shadow-2xl`}
                  priority
                />
              </div>

              {/* Elegant rotating border */}
              <motion.div
                className="absolute inset-0 force-circle"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(139, 69, 19, 0.6) 90deg, transparent 180deg, rgba(220, 38, 38, 0.4) 270deg, transparent 360deg)",
                  mask: "radial-gradient(circle at center, transparent 65%, black 67%)",
                  WebkitMask:
                    "radial-gradient(circle at center, transparent 65%, black 67%)",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Navigation Links - Right */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="relative group text-theme-text-secondary hover:text-theme-foreground font-semibold transition-all duration-500 text-sm uppercase tracking-widest font-russo theme-transition"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Glowing background on hover */}
                <motion.div
                  className="absolute inset-0 -m-3 bg-gradient-to-r from-red-900/20 via-gray-800/30 to-red-900/20 minimal-radius blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />

                <span className="relative z-10 group-hover:text-shadow-lg">
                  {item.name}
                </span>

                {/* Sophisticated underline */}
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent origin-center"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Border accent on sides */}
                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-red-700 to-transparent"
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileHover={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
                <motion.div
                  className="absolute top-0 bottom-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-red-700 to-transparent"
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileHover={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </motion.button>
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="lg:hidden flex items-center space-x-3">
            <ThemeToggle />
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="relative text-theme-text-secondary hover:text-theme-foreground transition-colors duration-300 p-3 minimal-radius backdrop-blur-sm bg-theme-secondary border border-theme-border theme-transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="lg:hidden overflow-hidden relative"
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ zIndex: 9999 }}
      >
        <div className="backdrop-blur-xl border-t border-theme-border theme-transition shadow-2xl"
             style={{
               background: `var(--theme-background)`,
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
               boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
             }}>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-left text-theme-text-secondary hover:text-theme-foreground font-semibold py-4 px-6 minimal-radius bg-theme-secondary/50 hover:bg-theme-secondary border border-theme-border hover:border-theme-border-strong transition-all duration-400 text-base uppercase tracking-wider backdrop-blur-sm font-russo theme-transition"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    x: isOpen ? 0 : -20,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: isOpen ? index * 0.1 : 0,
                  }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative">
                    {item.name}
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent origin-center"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
