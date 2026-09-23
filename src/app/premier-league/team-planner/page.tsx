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
            title={t("teamPlanner.page.loadingTitle")}
            description={t("teamPlanner.page.loadingDescription")}
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
              <IoMdAnalytics className="w-6 h-6 text-theme-text-secondary" />
              <h1
                className="text-3xl md:text-4xl font-bold text-theme-foreground"
              >
                {t("teamPlanner.title")}
              </h1>
            </div>
            <p
              className="text-lg text-theme-text-secondary"
            >
              {t("teamPlanner.subtitle")}
            </p>
          </div>

          {/* Authentication Required Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto p-8 rounded-lg border bg-theme-card border-theme-border text-center"
          >
            <BiUserPlus className="h-10 w-10 text-theme-text-secondary mx-auto mb-6" />

            <h3
              className="text-xl font-bold mb-4 text-theme-foreground"
            >
              {t("teamPlanner.login.title")}
            </h3>

            <p
              className="text-sm mb-6 text-theme-text-secondary"
            >
              {t("teamPlanner.login.text")}
            </p>

            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/premier-league/team-planner",
                  })
                }
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-theme-border hover:bg-theme-card-secondary rounded-md text-sm font-medium transition-colors"
              >
                <FaGoogle className="text-red-500" />
                {t("teamPlanner.login.google")}
              </button>

              {/* Email Sign In */}
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-theme-foreground text-theme-background hover:opacity-90 rounded-md text-sm font-medium transition-colors"
              >
                <FaEnvelope />
                {t("teamPlanner.login.email")}
              </Link>

              {/* Sign Up */}
              <div
                className="text-xs text-theme-text-secondary"
              >
                {t("teamPlanner.login.noAccount")}{" "}
                <Link
                  href="/signup"
                  className="text-theme-text-secondary hover:text-theme-foreground font-medium"
                >
                  {t("teamPlanner.login.createAccount")}
                </Link>
              </div>
            </div>

            {/* Benefits */}
            <div
              className="mt-6 pt-6 border-t border-theme-border"
            >
              <h4
                className="text-sm font-medium mb-3 text-theme-foreground"
              >
                {t("teamPlanner.login.includes")}
              </h4>
              <ul
                className="text-xs space-y-1 text-theme-text-secondary"
              >
                <li>• {t("teamPlanner.login.featurePlanner")}</li>
                <li>• {t("teamPlanner.login.featureAi")}</li>
                <li>• {t("teamPlanner.login.featurePrices")}</li>
                <li>• {t("teamPlanner.login.featureRecommendations")}</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <FantasyPlanner managerId={managerId} />
    </div>
  );
}