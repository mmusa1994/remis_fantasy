"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { FaFootballBall, FaGoogle, FaEnvelope } from "react-icons/fa";
import { IoMdAnalytics } from "react-icons/io";
import { BiUserPlus } from "react-icons/bi";
import { motion } from "framer-motion";
import Link from "next/link";
import LoadingCard from "@/components/shared/LoadingCard";
import FantasyPlanner from "@/components/fpl/FantasyPlanner";

export default function TeamPlannerPage() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t, ready, i18n } = useTranslation("fpl");
  const searchParams = useSearchParams();
  const initialManagerId = searchParams?.get("managerId") || null;
  
  const [managerId, setManagerId] = useState<string | null>(initialManagerId);
  const [authRequired, setAuthRequired] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setAuthRequired(false);
    } else if (status === "unauthenticated") {
      setAuthRequired(true);
    }
  }, [status, session]);

  if (!ready || status === "loading") {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title="Loading Fantasy Planner..."
            description="Preparing your team management tools..."
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
  }

  // Show authentication required screen
  if (authRequired) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <IoMdAnalytics className="w-8 h-8 text-green-500" />
              <h1
                className={`text-3xl md:text-4xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {i18n.language === 'bs' ? 'Fantasy Komandni Centar' : 'Fantasy Command Center'}
              </h1>
            </div>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {i18n.language === 'bs' 
                ? 'Planiraj buduće transfere, čipove, izmjene itd.'
                : 'Plan future transfers, chips, changes, etc.'
              }
            </p>
          </div>

          {/* Authentication Required Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-md mx-auto p-8 rounded-lg border ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/50 border-gray-200"
            } text-center`}
          >
            <BiUserPlus className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-6" />

            <h3
              className={`text-xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {i18n.language === 'bs' ? 'Prijava Potrebna' : 'Login Required'}
            </h3>

            <p
              className={`text-sm mb-6 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {i18n.language === 'bs' 
                ? 'Prijavite se da biste pristupili Fantasy Komandnom Centru'
                : 'Sign in to access the Fantasy Command Center'
              }
            </p>

            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/premier-league/team-planner",
                  })
                }
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 border ${
                  theme === "dark"
                    ? "border-gray-700 hover:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-50"
                } rounded-md text-sm font-medium transition-colors`}
              >
                <FaGoogle className="text-red-500" />
                {i18n.language === 'bs' ? 'Prijavite se sa Google' : 'Sign in with Google'}
              </button>

              {/* Email Sign In */}
              <Link
                href="/login"
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors`}
              >
                <FaEnvelope />
                {i18n.language === 'bs' ? 'Prijavite se sa Email' : 'Sign in with Email'}
              </Link>

              {/* Sign Up */}
              <div
                className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {i18n.language === 'bs' ? 'Nemate račun?' : "Don't have an account?"}{" "}
                <Link
                  href="/signup"
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  {i18n.language === 'bs' ? 'Kreirajte besplatan račun' : 'Create free account'}
                </Link>
              </div>
            </div>

            {/* Benefits */}
            <div
              className={`mt-6 pt-6 border-t ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h4
                className={`text-sm font-medium mb-3 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {i18n.language === 'bs' ? 'Besplatan račun uključuje:' : 'Free account includes:'}
              </h4>
              <ul
                className={`text-xs space-y-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>• {i18n.language === 'bs' ? 'Transfer planner sa live podacima' : 'Transfer planner with live data'}</li>
                <li>• {i18n.language === 'bs' ? 'AI analiza tima (1x sedmično)' : 'AI team analysis (1x weekly)'}</li>
                <li>• {i18n.language === 'bs' ? 'Praćenje cijene i forme igrača' : 'Player price and form tracking'}</li>
                <li>• {i18n.language === 'bs' ? 'Personalizovane preporuke' : 'Personalized recommendations'}</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FantasyPlanner managerId={managerId} />
    </div>
  );
}