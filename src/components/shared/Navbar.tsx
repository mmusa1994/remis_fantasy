"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Home, Crown, CircleDot, Car } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { name: "Početna", href: "/", icon: Home },
  { name: "Premier League", href: "/premier-league", icon: Crown },
  { name: "Champions League", href: "/champions-league", icon: CircleDot },
  { name: "F1 Fantasy", href: "/f1-fantasy", icon: Car },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { theme } = useTheme();

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

  const handleMobileNavClick = () => {
    setIsOpen(false);
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 transition-all duration-700 theme-transition"
      animate={{
        backgroundColor: isScrolled
          ? theme === "dark"
            ? "rgba(0, 0, 0, 0.95)"
            : "rgba(245, 245, 220, 0.95)"
          : theme === "dark"
          ? "rgba(0, 0, 0, 0.90)"
          : "rgba(245, 245, 220, 0.90)",
      }}
      transition={{ duration: 0.3 }}
      style={{
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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-2 relative z-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Left */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="relative w-16 h-16 transition-all duration-500"
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
                  className="w-14 h-14 object-contain filter drop-shadow-2xl transition-all duration-500"
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
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item, index) => (
              <Link key={item.name} href={item.href}>
                <motion.div
                  className="relative group text-theme-text-secondary hover:text-theme-foreground font-semibold transition-all duration-500 text-sm uppercase tracking-widest font-russo theme-transition px-4 py-2 cursor-pointer"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Dynamic background on hover - adapts to theme */}
                  <motion.div
                    className={`absolute inset-0 minimal-radius backdrop-blur-sm ${
                      theme === "light"
                        ? "bg-gradient-to-r from-blue-100/60 via-slate-100/80 to-blue-100/60 shadow-lg"
                        : "bg-gradient-to-r from-red-900/30 via-gray-800/40 to-red-900/30"
                    }`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />

                  {/* Subtle inner glow */}
                  <motion.div
                    className={`absolute inset-0 minimal-radius ${
                      theme === "light"
                        ? "bg-gradient-to-r from-transparent via-blue-200/20 to-transparent"
                        : "bg-gradient-to-r from-transparent via-red-500/10 to-transparent"
                    }`}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />

                  <span className="relative z-10 drop-shadow-sm flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className="w-4 h-4" />
                    </motion.div>
                    {item.name}
                  </span>

                  {/* Sophisticated underline - theme adaptive */}
                  <motion.div
                    className={`absolute -bottom-1 left-2 right-2 h-0.5 ${
                      theme === "light"
                        ? "bg-gradient-to-r from-transparent via-blue-600 to-transparent"
                        : "bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    } origin-center`}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileHover={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Top accent line */}
                  <motion.div
                    className={`absolute -top-1 left-2 right-2 h-0.5 ${
                      theme === "light"
                        ? "bg-gradient-to-r from-transparent via-slate-400/60 to-transparent"
                        : "bg-gradient-to-r from-transparent via-gray-400/40 to-transparent"
                    }`}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileHover={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                  />

                  {/* Corner accents */}
                  <motion.div
                    className={`absolute top-0 left-0 w-1 h-1 ${
                      theme === "light" ? "bg-blue-500" : "bg-red-500"
                    } minimal-radius`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                  />
                  <motion.div
                    className={`absolute top-0 right-0 w-1 h-1 ${
                      theme === "light" ? "bg-blue-500" : "bg-red-500"
                    } minimal-radius`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.25 }}
                  />
                  <motion.div
                    className={`absolute bottom-0 left-0 w-1 h-1 ${
                      theme === "light" ? "bg-blue-500" : "bg-red-500"
                    } minimal-radius`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                  />
                  <motion.div
                    className={`absolute bottom-0 right-0 w-1 h-1 ${
                      theme === "light" ? "bg-blue-500" : "bg-red-500"
                    } minimal-radius`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.35 }}
                  />
                </motion.div>
              </Link>
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-3">
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
        className="md:hidden overflow-hidden relative"
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ zIndex: 9999 }}
      >
        <div
          className="backdrop-blur-xl border-t border-theme-border theme-transition shadow-2xl"
          style={{
            background: `var(--theme-background)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col space-y-3">
              {navItems.map((item, index) => (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    onClick={handleMobileNavClick}
                    className="w-full text-center text-theme-text-secondary hover:text-theme-foreground font-semibold py-4 px-4 minimal-radius bg-theme-secondary/50 hover:bg-theme-secondary border border-theme-border hover:border-theme-border-strong transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-russo theme-transition cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      y: isOpen ? 0 : 20,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isOpen ? index * 0.1 : 0,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative flex items-center justify-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.3, rotate: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <item.icon className="w-5 h-5" />
                      </motion.div>
                      <span>{item.name}</span>
                      <motion.div
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent origin-center"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
