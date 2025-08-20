"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-theme-card-secondary py-16 theme-transition">
      {/* Animated border-top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background:
            "linear-gradient(90deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 1))",
          backgroundSize: "300% 100%",
        }}
      >
        <motion.div
          className="w-full h-full"
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background: "inherit",
          }}
        />
      </motion.div>

      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/3 w-96 h-32 bg-gradient-to-r from-gray-800/5 via-slate-700/3 to-gray-900/5 minimal-radius blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-80 h-28 bg-gradient-to-l from-slate-800/5 via-gray-800/3 to-slate-900/5 minimal-radius blur-3xl"></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="relative w-20 h-20 group cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              {/* Elegant glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gray-600/20 via-slate-500/15 to-gray-700/20 force-circle blur-xl group-hover:from-red-900/30 group-hover:via-gray-600/25 group-hover:to-red-800/30 transition-all duration-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src="/images/rf-no-bg.png"
                  alt="Remis Fantasy Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Rotating border */}
              <motion.div
                className="absolute inset-0 force-circle opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(139, 69, 19, 0.4) 90deg, transparent 180deg, rgba(220, 38, 38, 0.3) 270deg, transparent 360deg)",
                  mask: "radial-gradient(circle at center, transparent 65%, black 67%)",
                  WebkitMask:
                    "radial-gradient(circle at center, transparent 65%, black 67%)",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Main Description */}
          <motion.div
            className="mb-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h3
              className="text-2xl md:text-3xl font-black text-theme-heading-primary mb-4 leading-tight theme-transition"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.span className="text-theme-heading-primary theme-transition">
                REMIS Fantasy
              </motion.span>
            </motion.h3>
            
            <motion.p
              className="text-theme-text-secondary text-lg md:text-xl leading-relaxed font-medium max-w-2xl mx-auto theme-transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Godinama gradimo tradiciju i povjerenje u fantasy football zajednici.
              <br />
              Vaša strast, naše iskustvo - savršena kombinacija za nezaboravnu sezonu.
            </motion.p>
          </motion.div>

          {/* Stats/Values */}
          <motion.div
            className="grid grid-cols-2 gap-12 mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { number: "9+", label: "Godina" },
              { number: "100%", label: "Povjerenje" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <div className="text-2xl md:text-3xl font-black text-theme-heading-primary mb-1 theme-transition">
                  {stat.number}
                </div>
                <div className="text-theme-text-muted text-sm md:text-base font-medium theme-transition">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Copyright and Admin */}
          <motion.div
            className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-800/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="text-theme-text-muted text-sm md:text-base font-medium theme-transition">
              © 2025{" "}
              <span className="font-bold text-theme-foreground theme-transition">
                REMIS Fantasy
              </span>{" "}
              by{" "}
              <span className="font-semibold text-theme-text-secondary hover:text-theme-foreground transition-colors cursor-default theme-transition">
                Muhamed Musa
              </span>
            </div>

            <Link href="/admin" className="group">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 minimal-radius bg-theme-secondary border border-theme-border text-theme-text-muted hover:text-theme-text-secondary hover:bg-theme-accent hover:border-theme-border-strong transition-all duration-300 text-sm opacity-40 hover:opacity-100 backdrop-blur-sm theme-transition"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden md:inline font-medium">Admin Panel</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Subtle corner accents */}
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-800/10 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-gray-800/10 to-transparent opacity-50"></div>
    </footer>
  );
}