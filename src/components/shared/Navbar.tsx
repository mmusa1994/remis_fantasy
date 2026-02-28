"use client";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  BarChart3,
  Activity,
  Trophy,
  UserPlus,
  Camera,
  DollarSign,
  TrendingUp,
  Newspaper,
} from "lucide-react";
import { FaUser, FaGoogle, FaMagic } from "react-icons/fa";
import { TbPresentationAnalytics } from "react-icons/tb";
import ThemeToggle from "../ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSession, signIn } from "next-auth/react";
import { safeLogout } from "@/lib/session-utils";
import { Edit } from "lucide-react";

interface LeagueNavItem {
  id: string;
  name: string;
  href: string;
  logo: string;
  accentColor: string;
  borderClass: string;
  activeTextClass: string;
  subPages: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const Navbar = React.memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    ["blur(0px)", "blur(20px)"],
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
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen]);

  // Fetch manager data when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/manager-id")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setManagerData({
              managerId: data.managerId,
              isVerified: data.isVerified,
              verificationNote: data.verificationNote,
            });
          }
        })
        .catch(console.error);
    } else {
      setManagerData(null);
    }
  }, [session?.user?.id]);

  // Mega dropdown handlers
  const handleMouseEnterNav = useCallback((leagueId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(leagueId);
  }, []);

  const handleMouseLeaveNav = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  const handleMouseEnterDropdown = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  }, []);

  const handleMouseLeaveDropdown = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  // Wait for i18n to be ready
  if (!ready) {
    return (
      <div className="fixed top-0 left-0 right-0 w-full bg-theme-background border-b border-theme-border z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between h-12 md:h-14">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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

  // League nav items with sub-pages for mega dropdown
  const leagueNavItems: LeagueNavItem[] = [
    {
      id: "premier-league",
      name: t("premierLeague", "Premier League"),
      href: "/premier-league/tables",
      logo: "/images/logos/pl-logo.png",
      accentColor: "purple",
      borderClass: "border-t-purple-600",
      activeTextClass: "text-purple-600 dark:text-purple-400",
      subPages: [
        { name: t("tables"), href: "/premier-league/tables", icon: BarChart3 },
        {
          name: t("fplLive"),
          href: "/premier-league/fpl-live",
          icon: Activity,
        },
        {
          name: t("fantasyCommand"),
          href: "/premier-league/team-planner",
          icon: TbPresentationAnalytics,
        },
        {
          name: t("aiTeamAnalysis"),
          href: "/premier-league/ai-team-analysis",
          icon: FaMagic,
        },
        { name: t("prices"), href: "/premier-league/prices", icon: DollarSign },
        {
          name: t("bestDifferentials"),
          href: "/premier-league/best-differentials",
          icon: TrendingUp,
        },
        {
          name: t("teamNews"),
          href: "/premier-league/team-news",
          icon: Newspaper,
        },
        {
          name: t("registration"),
          href: "/premier-league/registration",
          icon: UserPlus,
        },
        { name: t("prizes"), href: "/premier-league/prizes", icon: Trophy },
        { name: t("gallery"), href: "/premier-league/gallery", icon: Camera },
      ],
    },
    {
      id: "champions-league",
      name: t("championsLeague", "Champions League"),
      href: "/champions-league/tables",
      logo: "/images/logos/cl-logo.png",
      accentColor: "blue",
      borderClass: "border-t-blue-700",
      activeTextClass: "text-blue-600 dark:text-blue-400",
      subPages: [
        {
          name: t("tables"),
          href: "/champions-league/tables",
          icon: BarChart3,
        },
        { name: t("prizes"), href: "/champions-league/prizes", icon: Trophy },
        {
          name: t("registration"),
          href: "/champions-league/registration",
          icon: UserPlus,
        },
        { name: t("gallery"), href: "/champions-league/gallery", icon: Camera },
      ],
    },
    {
      id: "f1-fantasy",
      name: t("f1Fantasy", "F1 Fantasy"),
      href: "/f1-fantasy/tables",
      logo: "/images/logos/f1.png",
      accentColor: "red",
      borderClass: "border-t-red-600",
      activeTextClass: "text-red-600 dark:text-red-400",
      subPages: [
        { name: t("tables"), href: "/f1-fantasy/tables", icon: BarChart3 },
        { name: t("prizes"), href: "/f1-fantasy/prizes", icon: Trophy },
        {
          name: t("registration"),
          href: "/f1-fantasy/registration",
          icon: UserPlus,
        },
        { name: t("gallery"), href: "/f1-fantasy/gallery", icon: Camera },
      ],
    },
  ];

  const handleMobileNavClick = () => {
    setIsOpen(false);
  };

  const isActivePath = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("/").slice(0, 3).join("/"));
  };

  const isExactPath = (href: string) => {
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
                ? "border-red-800 shadow-lg"
                : theme === "dark"
                  ? "border-gray-600 hover:border-red-700"
                  : "border-gray-300 hover:border-red-800"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser
                className={`w-5 h-5 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              />
            )}
          </motion.button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`absolute right-0 mt-2 w-64 rounded-lg border shadow-xl z-50 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Info */}
              <div
                className={`px-4 py-3 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
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
                    <p
                      className={`text-sm font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      {session.user.name}
                    </p>
                    <p
                      className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {t("myProfile")}
                  </div>
                </Link>

                <Link
                  href="/premier-league/ai-team-analysis"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <FaMagic className="w-4 h-4" />
                    {t("aiAnalysis")}
                  </div>
                </Link>

                {/* Manager ID Section */}
                <div
                  className={`px-4 py-2 text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium">
                        {t("managerId")}:
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          managerData?.isVerified === false
                            ? theme === "dark"
                              ? "text-yellow-400"
                              : "text-yellow-600"
                            : theme === "dark"
                              ? "text-green-400"
                              : "text-green-600"
                        } truncate`}
                      >
                        {managerData?.managerId || t("notSet")}
                      </span>
                    </div>
                    <Link
                      href="/profile?tab=manager-id"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Edit className="w-3 h-3" />
                      {t("edit")}
                    </Link>
                  </div>
                  {managerData?.verificationNote && (
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      {managerData.verificationNote}
                    </p>
                  )}
                </div>

                <div
                  className={`border-t my-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                />

                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    theme === "dark"
                      ? "text-red-400 hover:bg-red-900/20"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {t("signOut")}
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
              ? "bg-red-800 text-white shadow-lg"
              : theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
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
            className={`absolute right-0 mt-2 w-56 rounded-lg border shadow-xl z-50 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
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
                  theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <FaGoogle className="w-4 h-4 text-red-500" />
                {t("signIn")} with Google
              </button>

              <Link href="/login" onClick={() => setUserMenuOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  {t("signIn")} with Email
                </div>
              </Link>

              <div
                className={`border-t my-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
              />

              <Link href="/signup" onClick={() => setUserMenuOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    theme === "dark"
                      ? "text-red-400 hover:bg-red-900/20"
                      : "text-red-800 hover:bg-red-50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  {t("createAccount")}
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
      className="hidden md:block fixed top-0 left-0 right-0 w-full transition-all duration-700 theme-transition"
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
      {/* Shimmer border-bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div
          className="w-full h-full animate-shimmer-border"
          style={{
            backgroundImage:
              theme === "dark"
                ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.03) 80%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.03) 20%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0.03) 80%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-1 relative z-10">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo - Left */}
          <Link href="/">
            <motion.div
              className="flex items-center cursor-pointer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                className="relative w-10 h-10 transition-all duration-500"
                whileHover={{
                  scale: 1.15,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="/images/rf-logo.svg"
                    alt="Remis Fantasy Logo"
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain transition-all duration-500"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>
          </Link>

          {/* Navigation Links - Right */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* League Nav Items with Mega Dropdown */}
            {leagueNavItems.map((league, index) => {
              const isActive = isActivePath(league.href);
              return (
                <div
                  key={league.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterNav(league.id)}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <Link href={league.href}>
                    <motion.div
                      className={`relative font-semibold transition-all duration-500 text-xs uppercase tracking-widest font-anta theme-transition px-2 lg:px-3 py-1.5 cursor-pointer ${
                        isActive
                          ? league.activeTextClass
                          : "text-theme-text-secondary hover:text-theme-foreground"
                      }`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Image
                          src={league.logo}
                          alt={league.id}
                          width={18}
                          height={18}
                          className="w-[18px] h-[18px] object-contain transition-all duration-300"
                          style={{
                            filter: isActive
                              ? league.accentColor === "purple"
                                ? "brightness(0) saturate(100%) invert(18%) sepia(80%) saturate(5000%) hue-rotate(260deg) brightness(100%)"
                                : league.accentColor === "blue"
                                  ? "brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(3000%) hue-rotate(200deg) brightness(100%)"
                                  : "brightness(0) saturate(100%) invert(15%) sepia(80%) saturate(5000%) hue-rotate(350deg) brightness(100%)"
                              : theme === "dark"
                                ? "brightness(0) invert(1)"
                                : "brightness(0)",
                          }}
                        />
                        {league.name}
                      </span>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className={`absolute -bottom-2 left-0 right-0 h-0.5 origin-center ${
                            league.accentColor === "purple"
                              ? "bg-gradient-to-r from-transparent via-purple-600 to-transparent"
                              : league.accentColor === "blue"
                                ? "bg-gradient-to-r from-transparent via-blue-600 to-transparent"
                                : "bg-gradient-to-r from-transparent via-red-600 to-transparent"
                          }`}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      )}
                    </motion.div>
                  </Link>

                  {/* Mega Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === league.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-lg border-t-2 shadow-xl z-50 ${league.borderClass} ${
                          theme === "dark"
                            ? "bg-gray-900 border border-gray-700"
                            : "bg-white border border-gray-200"
                        }`}
                        style={{
                          minWidth:
                            league.subPages.length > 4 ? "520px" : "260px",
                        }}
                        onMouseEnter={handleMouseEnterDropdown}
                        onMouseLeave={handleMouseLeaveDropdown}
                      >
                        <div
                          className={`p-4 grid gap-1.5 ${league.subPages.length > 4 ? "grid-cols-2 grid-flow-col" : "grid-cols-1"}`}
                          style={
                            league.subPages.length > 4
                              ? {
                                  gridTemplateRows: `repeat(${Math.ceil(league.subPages.length / 2)}, minmax(0, 1fr))`,
                                }
                              : undefined
                          }
                        >
                          {league.subPages.map((page) => {
                            const PageIcon = page.icon;
                            const isPageActive = isExactPath(page.href);
                            return (
                              <Link
                                key={page.href}
                                href={page.href}
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                                    isPageActive
                                      ? `${league.activeTextClass} ${
                                          theme === "dark"
                                            ? league.accentColor === "purple"
                                              ? "bg-purple-500/10"
                                              : league.accentColor === "blue"
                                                ? "bg-blue-500/10"
                                                : "bg-red-500/10"
                                            : league.accentColor === "purple"
                                              ? "bg-purple-50"
                                              : league.accentColor === "blue"
                                                ? "bg-blue-50"
                                                : "bg-red-50"
                                        }`
                                      : theme === "dark"
                                        ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  }`}
                                >
                                  <PageIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium whitespace-nowrap">
                                    {page.name}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
              className="relative text-theme-text-secondary hover:text-theme-foreground transition-colors duration-300 p-3 rounded-lg backdrop-blur-sm bg-theme-secondary border border-theme-border theme-transition"
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
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    theme === "dark" ? "bg-gray-700/50" : "bg-gray-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
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
                      <p
                        className={`text-sm font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {session.user.name}
                      </p>
                      <p
                        className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items - Home */}
              <Link href="/">
                <motion.div
                  onClick={handleMobileNavClick}
                  className={`w-full text-center font-semibold py-4 px-4 rounded-lg bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-anta theme-transition cursor-pointer relative ${
                    pathname === "/"
                      ? "text-theme-foreground border-theme-foreground"
                      : "text-theme-text-secondary hover:text-theme-foreground border-theme-border hover:border-theme-foreground"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    y: isOpen ? 0 : 20,
                  }}
                  transition={{ duration: 0.3, delay: isOpen ? 0 : 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{t("home", "Home")}</span>
                </motion.div>
              </Link>

              {/* League Nav Items */}
              {leagueNavItems.map((league, index) => (
                <Link key={league.id} href={league.href}>
                  <motion.div
                    onClick={handleMobileNavClick}
                    className={`w-full text-center font-semibold py-4 px-4 rounded-lg bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-anta theme-transition cursor-pointer relative ${
                      isActivePath(league.href)
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
                      delay: isOpen ? (index + 1) * 0.1 : 0,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{league.name}</span>
                  </motion.div>
                </Link>
              ))}

              {/* User Actions in Mobile Menu */}
              {status === "authenticated" && session?.user && (
                <>
                  <Link href="/profile">
                    <motion.div
                      onClick={handleMobileNavClick}
                      className="w-full text-center font-semibold py-4 px-4 rounded-lg bg-theme-secondary/50 hover:bg-theme-secondary border transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-anta theme-transition cursor-pointer relative text-theme-text-secondary hover:text-theme-foreground border-theme-border hover:border-theme-foreground"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isOpen ? 1 : 0,
                        y: isOpen ? 0 : 20,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: isOpen ? (leagueNavItems.length + 1) * 0.1 : 0,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex items-center justify-center gap-3">
                        <User className="w-5 h-5" />
                        <span>{t("myProfile")}</span>
                      </div>
                    </motion.div>
                  </Link>

                  <motion.div
                    onClick={() => {
                      safeLogout("/");
                      handleMobileNavClick();
                    }}
                    className={`w-full text-center font-semibold py-4 px-4 rounded-lg transition-all duration-400 text-sm uppercase tracking-wider backdrop-blur-sm font-anta cursor-pointer relative ${
                      theme === "dark"
                        ? "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 text-red-400 hover:text-red-300"
                        : "bg-gray-100/50 hover:bg-gray-200/50 border border-gray-300 hover:border-gray-400 text-red-600 hover:text-red-700"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      y: isOpen ? 0 : 20,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: isOpen ? (leagueNavItems.length + 2) * 0.1 : 0,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative flex items-center justify-center gap-3">
                      <LogOut className="w-5 h-5" />
                      <span>{t("signOut")}</span>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Login options for unauthenticated users */}
              {status === "unauthenticated" && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    theme === "dark" ? "bg-gray-700/50" : "bg-gray-100/50"
                  }`}
                >
                  <p
                    className={`text-center text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {t("signIn")} to access all features
                  </p>

                  <div className="space-y-2">
                    <motion.button
                      onClick={() => {
                        handleGoogleSignIn();
                        handleMobileNavClick();
                      }}
                      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 hover:bg-gray-600 text-gray-300"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
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
                          theme === "dark"
                            ? "border-red-800/50 hover:bg-red-800/10 text-red-400"
                            : "border-red-800/50 hover:bg-red-50 text-red-800"
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
                          theme === "dark"
                            ? "hover:bg-gray-600/50 text-gray-400 hover:text-gray-300"
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">{t("createAccount")}</span>
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
