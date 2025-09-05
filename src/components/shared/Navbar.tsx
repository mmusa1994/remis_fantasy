"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, User, LogIn, LogOut } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { FaUser, FaGoogle, FaCreditCard } from "react-icons/fa";
import ThemeToggle from "../ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSession, signIn } from "next-auth/react";
import { safeLogout } from "@/lib/session-utils";
import { Edit } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getNavItems = (t: any): NavItem[] => [
  { name: t("home", "Home"), href: "/", icon: Home },
  {
    name: t("premierLeague", "Premier League"),
    href: "/premier-league/tabele",
    icon: SiPremierleague,
  },
  {
    name: t("championsLeague", "Champions League"),
    href: "/champions-league/tabele",
    icon: PiSoccerBall,
  },
  {
    name: t("f1Fantasy", "F1 Fantasy"),
    href: "/f1-fantasy/tabele",
    icon: GiF1Car,
  },
];

const Navbar = React.memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [managerData, setManagerData] = useState<{
    managerId: string | null;
    isVerified: boolean;
    verificationNote: string | null;
  } | null>(null);
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const { t, ready } = useTranslation("navigation");
  const { data: session, status } = useSession();
  const pathname = usePathname();

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Fetch manager data when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/manager-id')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setManagerData({
              managerId: data.managerId,
              isVerified: data.isVerified,
              verificationNote: data.verificationNote
            });
          }
        })
        .catch(console.error);
    } else {
      setManagerData(null);
    }
  }, [session?.user?.id]);

  // Wait for i18n to be ready
  if (!ready) {
    return (
      <div className="fixed top-0 left-0 right-0 w-full bg-theme-background border-b border-theme-border z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = getNavItems(t);

  const handleMobileNavClick = () => {
    setIsOpen(false);
  };

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await safeLogout("/");
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: pathname });
  };

  // UserMenu Component
  const UserMenu = () => {
    if (status === "loading") {
      return (
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      );
    }

    if (status === "authenticated" && session?.user) {
      return (
        <div className="relative">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen(!userMenuOpen);
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-300 ${
              userMenuOpen 
                ? 'border-red-800 shadow-lg' 
                : theme === 'dark' 
                  ? 'border-gray-600 hover:border-red-700' 
                  : 'border-gray-300 hover:border-red-800'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {session.user.image ? (
              <Image 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
            )}
          </motion.button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl z-50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Info */}
              <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {session.user.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-red-800 dark:text-red-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {session.user.name}
                    </p>
                    <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <User className="w-4 h-4" />
                    {t('myProfile')}
                  </div>
                </Link>

                <Link href="/billing-plans" onClick={() => setUserMenuOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <FaCreditCard className="w-4 h-4 text-red-800" />
                    {t('billingPlans')}
                  </div>
                </Link>
                
                <Link href="/premier-league/ai-team-analysis" onClick={() => setUserMenuOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <FaUser className="w-4 h-4" />
                    {t('aiAnalysis')}
                  </div>
                </Link>

                {/* Manager ID Section */}
                <div className={`px-4 py-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium">Manager ID:</span>
                      <span className={`text-xs font-mono ${
                        managerData?.isVerified === false 
                          ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') 
                          : (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                      } truncate`}>
                        {managerData?.managerId || 'Not set'}
                      </span>
                    </div>
                    <Link 
                      href="/profile?tab=manager-id" 
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Link>
                  </div>
                  {managerData?.verificationNote && (
                    <p className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      {managerData.verificationNote}
                    </p>
                  )}
                </div>

                <div className={`border-t my-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
                
                <button 
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      );
    }

    // Not authenticated - show unified login button
    return (
      <div className="relative">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setUserMenuOpen(!userMenuOpen);
          }}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
            userMenuOpen 
              ? 'bg-red-800 text-white shadow-lg' 
              : theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogIn className="w-5 h-5" />
        </motion.button>

        {/* Login Options Dropdown */}
        {userMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-2">
              <button
                onClick={() => {
                  handleGoogleSignIn();
                  setUserMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaGoogle className="w-4 h-4 text-red-500" />
                {t('signIn')} with Google
              </button>
              
              <Link href="/login" onClick={() => setUserMenuOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <LogIn className="w-4 h-4" />
                  {t('signIn')} with Email
                </div>
              </Link>

              <div className={`border-t my-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
              
              <Link href="/signup" onClick={() => setUserMenuOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  theme === 'dark' 
                    ? 'text-red-400 hover:bg-red-900/20' 
                    : 'text-red-800 hover:bg-red-50'
                }`}>
                  <User className="w-4 h-4" />
                  {t('createAccount')}
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 w-full transition-all duration-700 theme-transition"
      animate={{
        backgroundColor: isScrolled
          ? theme === "dark"
            ? "rgba(0, 0, 0, 0.95)"
            : "rgba(255, 255, 255, 0.95)"
          : theme === "dark"
          ? "rgba(0, 0, 0, 0.90)"
          : "rgba(255, 255, 255, 0.90)",
      }}
      transition={{ duration: 0.3 }}
      style={{
        backdropFilter: backdropBlur,
        WebkitBackdropFilter: backdropBlur,
        zIndex: 9999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* Animated border-bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 navbar-border-animated ${
          isScrolled ? "visible" : ""
        }`}
        style={{
          backgroundImage:
            theme === "dark"
              ? "linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 1))"
              : "linear-gradient(90deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 1))",
          backgroundSize: "300% 100%",
        }}
      />

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
            {navItems.map((item, index) => {
              const isActive = isActiveLink(item.href);
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    className={`relative group font-semibold transition-all duration-500 text-sm uppercase tracking-widest font-russo theme-transition px-4 py-2 cursor-pointer ${
                      isActive
                        ? "text-red-800 dark:text-red-400"
                        : "text-theme-text-secondary hover:text-red-800 dark:hover:text-red-400"
                    }`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Dynamic background on hover - purple tint */}
                    <motion.div
                      className={`absolute inset-0 minimal-radius backdrop-blur-sm ${
                        theme === "light"
                          ? "bg-red-800/10 shadow-lg"
                          : "bg-red-700/10"
                      }`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />

                    {/* Subtle inner glow - purple */}
                    <motion.div
                      className="absolute inset-0 minimal-radius bg-gradient-to-r from-transparent via-red-800/5 to-transparent"
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

                    {/* Active page indicator - purple line */}
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-2 left-0 right-0 h-0.5 origin-center bg-gradient-to-r from-transparent via-red-800 to-transparent"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    )}

                    {/* Sophisticated underline - purple */}
                    {!isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-2 right-2 h-0.5 origin-center bg-gradient-to-r from-transparent via-red-800/60 to-transparent"
                        initial={{ scaleX: 0, opacity: 0 }}
                        whileHover={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    )}

                    {/* Top accent line */}
                    <motion.div
                      className={`absolute -top-1 left-2 right-2 h-0.5 ${
                        theme === "light"
                          ? "bg-gradient-to-r from-transparent via-black/40 to-transparent"
                          : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      }`}
                      initial={{ scaleX: 0, opacity: 0 }}
                      whileHover={{ scaleX: 1, opacity: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.1,
                        ease: "easeOut",
                      }}
                    />

                    {/* Corner accents */}
                    <motion.div
                      className={`absolute top-0 left-0 w-1 h-1 minimal-radius ${
                        theme === "light" ? "bg-black" : "bg-white"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    />
                    <motion.div
                      className={`absolute top-0 right-0 w-1 h-1 minimal-radius ${
                        theme === "light" ? "bg-black" : "bg-white"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.25 }}
                    />
                    <motion.div
                      className={`absolute bottom-0 left-0 w-1 h-1 minimal-radius ${
                        theme === "light" ? "bg-black" : "bg-white"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                    />
                    <motion.div
                      className={`absolute bottom-0 right-0 w-1 h-1 minimal-radius ${
                        theme === "light" ? "bg-black" : "bg-white"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.35 }}
                    />
                  </motion.div>
                </Link>
              );
            })}

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <UserMenu />
          </div>

          {/* Mobile Menu Button, Language Selector, Theme Toggle and User Menu */}
          <div className="md:hidden flex items-center space-x-3">
            <LanguageSelector />
            <ThemeToggle />
            <UserMenu />
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
              {/* User Info in Mobile Menu */}
              {status === "authenticated" && session?.user && (
                <div className={`p-4 rounded-lg mb-4 ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {session.user.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || 'User'} 
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <FaUser className="w-5 h-5 text-red-800 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {session.user.name}
                      </p>
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              {navItems.map((item, index) => {
                const isActive = isActiveLink(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      onClick={handleMobileNavClick}
                      className={`w-full text-center font-semibold py-4 px-4 minimal-radius bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-russo theme-transition cursor-pointer relative ${
                        isActive
                          ? "text-theme-foreground border-theme-foreground"
                          : "text-theme-text-secondary hover:text-theme-foreground border-theme-border hover:border-theme-foreground"
                      }`}
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
                      </div>
                    </motion.div>
                  </Link>
                );
              })}

              {/* User Actions in Mobile Menu */}
              {status === "authenticated" && session?.user && (
                <>
                  <Link href="/profile">
                    <motion.div
                      onClick={handleMobileNavClick}
                      className={`w-full text-center font-semibold py-4 px-4 minimal-radius bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-russo theme-transition cursor-pointer relative text-theme-text-secondary hover:text-theme-foreground border-theme-border hover:border-theme-foreground`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isOpen ? 1 : 0,
                        y: isOpen ? 0 : 20,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: isOpen ? (navItems.length + 1) * 0.1 : 0,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex items-center justify-center gap-3">
                        <User className="w-5 h-5" />
                        <span>{t('myProfile')}</span>
                      </div>
                    </motion.div>
                  </Link>

                  <Link href="/billing-plans">
                    <motion.div
                      onClick={handleMobileNavClick}
                      className={`w-full text-center font-semibold py-4 px-4 minimal-radius bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-russo theme-transition cursor-pointer relative text-theme-text-secondary hover:text-theme-foreground border-theme-border hover:border-theme-foreground`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isOpen ? 1 : 0,
                        y: isOpen ? 0 : 20,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: isOpen ? (navItems.length + 2) * 0.1 : 0,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex items-center justify-center gap-3">
                        <FaCreditCard className="w-5 h-5 text-red-800" />
                        <span>{t('billingPlans')}</span>
                      </div>
                    </motion.div>
                  </Link>

                  <motion.div
                    onClick={() => {
                      safeLogout("/");
                      handleMobileNavClick();
                    }}
                    className={`w-full text-center font-semibold py-4 px-4 minimal-radius bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-russo cursor-pointer relative text-red-500 hover:text-red-400`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      y: isOpen ? 0 : 20,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isOpen ? (navItems.length + 3) * 0.1 : 0,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative flex items-center justify-center gap-3">
                      <LogOut className="w-5 h-5" />
                      <span>{t('signOut')}</span>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Login options for unauthenticated users */}
              {status === "unauthenticated" && (
                <div className={`p-4 rounded-lg mb-4 ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
                }`}>
                  <p className={`text-center text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('signIn')} to access all features
                  </p>
                  
                  <div className="space-y-2">
                    <motion.button
                      onClick={() => {
                        handleGoogleSignIn();
                        handleMobileNavClick();
                      }}
                      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'border-gray-600 hover:bg-gray-600 text-gray-300'
                          : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaGoogle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Google</span>
                    </motion.button>

                    <Link href="/login">
                      <motion.div
                        onClick={handleMobileNavClick}
                        className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'border-red-800/50 hover:bg-red-800/10 text-red-400'
                            : 'border-red-800/50 hover:bg-red-50 text-red-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogIn className="w-4 h-4" />
                        <span className="text-sm font-medium">Email</span>
                      </motion.div>
                    </Link>

                    <Link href="/signup">
                      <motion.div
                        onClick={handleMobileNavClick}
                        className={`w-full flex items-center justify-center gap-3 py-2 px-4 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-600/50 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">{t('createAccount')}</span>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
});

export default Navbar;
