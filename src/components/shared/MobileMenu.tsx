"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession, signIn } from "next-auth/react";
import { safeLogout } from "@/lib/session-utils";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  X,
  User,
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FaGoogle, FaUser } from "react-icons/fa";
import ThemeToggle from "../ThemeToggle";
import LanguageSelector from "./LanguageSelector";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection?: string;
}

const MobileMenu = ({ isOpen, onClose, currentSection }: MobileMenuProps) => {
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const { t } = useTranslation("navigation");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [managerData, setManagerData] = useState<{
    managerId: string | null;
    isVerified: boolean;
    verificationNote: string | null;
  } | null>(null);

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

  // Auto-expand current section
  useEffect(() => {
    if (currentSection && isOpen) {
      setExpandedSection(currentSection);
    }
  }, [currentSection, isOpen]);

  const handleGoogleSignIn = async () => {
    await signIn("google");
    onClose();
  };

  const handleSignOut = async () => {
    await safeLogout("/");
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const premierLeagueItems = [
    { name: t("tables"), href: "/premier-league/tables" },
    { name: t("fplLive"), href: "/premier-league/fpl-live" },
    { name: t("fantasyCommand"), href: "/premier-league/team-planner" },
    { name: t("aiTeamAnalysis"), href: "/premier-league/ai-team-analysis" },
    { name: t("prices"), href: "/premier-league/prices" },
    { name: t("bestDifferentials"), href: "/premier-league/best-differentials" },
    { name: t("teamNews"), href: "/premier-league/team-news" },
    { name: t("prizes"), href: "/premier-league/prizes" },
    { name: t("registration"), href: "/premier-league/registration" },
    { name: t("gallery"), href: "/premier-league/gallery" },
  ];

  const championsLeagueItems = [
    { name: t("tables"), href: "/champions-league/tables" },
    { name: t("prizes"), href: "/champions-league/prizes" },
    { name: t("registration"), href: "/champions-league/registration" },
    { name: t("gallery"), href: "/champions-league/gallery" },
  ];

  const f1FantasyItems = [
    { name: t("tables"), href: "/f1-fantasy/tables" },
    { name: t("prizes"), href: "/f1-fantasy/prizes" },
    { name: t("registration"), href: "/f1-fantasy/registration" },
    { name: t("gallery"), href: "/f1-fantasy/gallery" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9998] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-lg border-t ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-lg font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {t('menu')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 pb-20">
              {/* Settings Section - Theme & Language */}
              <div className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-50"
              }`}>
                <h3 className={`text-sm font-medium mb-3 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {t('settings')}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`text-xs mb-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {t('theme')}
                      </span>
                      <ThemeToggle />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-xs mb-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {t('language')}
                      </span>
                      <LanguageSelector />
                    </div>
                  </div>
                </div>
              </div>
              {/* User Section */}
              {status === "authenticated" && session?.user && (
                <div className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {session.user.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || 'User'} 
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <FaUser className="w-6 h-6 text-red-800 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {session.user.name}
                      </p>
                      <p className={`text-sm truncate ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Manager ID */}
                  {managerData && (
                    <div className={`text-sm mb-3 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span>{t('managerId')}:</span>
                        <span className={`font-mono ${
                          managerData?.isVerified === false 
                            ? (theme === "dark" ? "text-yellow-400" : "text-yellow-600") 
                            : (theme === "dark" ? "text-green-400" : "text-green-600")
                        }`}>
                          {managerData.managerId || t('notSet')}
                        </span>
                      </div>
                      {managerData.verificationNote && (
                        <p className={`text-xs mt-1 ${
                          theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                        }`}>
                          {managerData.verificationNote}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href="/profile" onClick={onClose} className="flex-1">
                      <button className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        theme === "dark"
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}>
                        <User className="w-4 h-4 inline mr-2" />
                        {t('profile')}
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Login Section for unauthenticated users */}
              {status === "unauthenticated" && (
                <div className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                }`}>
                  <p className={`text-center mb-4 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {t('signInToAccess')}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleGoogleSignIn}
                      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <FaGoogle className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{t('continueWithGoogle')}</span>
                    </button>
                    <Link href="/login" onClick={onClose} className="block">
                      <button className={`w-full flex items-center justify-center gap-3 py-2 px-4 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "hover:bg-gray-700 text-gray-400"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}>
                        <LogIn className="w-4 h-4" />
                        <span>{t('signInWithEmail')}</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="space-y-2">
                {/* Premier League Section */}
                <div>
                  <button
                    onClick={() => toggleSection("premier-league")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-purple-900/20 hover:bg-purple-800/30 text-purple-300"
                        : "bg-purple-50 hover:bg-purple-100 text-purple-700"
                    }`}
                  >
                    <span className="font-medium">{t('premierLeague')}</span>
                    {expandedSection === "premier-league" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "premier-league" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1">
                          {premierLeagueItems.map((item) => (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                              <div className={`block w-full text-left p-2 pl-6 rounded-lg text-sm transition-colors ${
                                theme === "dark"
                                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}>
                                {item.name}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Champions League Section */}
                <div>
                  <button
                    onClick={() => toggleSection("champions-league")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-blue-900/20 hover:bg-blue-800/30 text-blue-300"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                    }`}
                  >
                    <span className="font-medium">{t('championsLeague')}</span>
                    {expandedSection === "champions-league" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "champions-league" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1">
                          {championsLeagueItems.map((item) => (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                              <div className={`block w-full text-left p-2 pl-6 rounded-lg text-sm transition-colors ${
                                theme === "dark"
                                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}>
                                {item.name}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* F1 Fantasy Section */}
                <div>
                  <button
                    onClick={() => toggleSection("f1-fantasy")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-red-900/20 hover:bg-red-800/30 text-red-300"
                        : "bg-red-50 hover:bg-red-100 text-red-700"
                    }`}
                  >
                    <span className="font-medium">{t('f1Fantasy')}</span>
                    {expandedSection === "f1-fantasy" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "f1-fantasy" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1">
                          {f1FantasyItems.map((item) => (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                              <div className={`block w-full text-left p-2 pl-6 rounded-lg text-sm transition-colors ${
                                theme === "dark"
                                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}>
                                {item.name}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sign Out Button */}
              {status === "authenticated" && (
                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "bg-red-900/20 hover:bg-red-800/30 text-red-400"
                      : "bg-red-50 hover:bg-red-100 text-red-600"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">{t('signOut')}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;