"use client";

import CLRegistrationFormNew from "@/components/CLRegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";
import { useTranslation } from "react-i18next";

export default function ChampionsLeagueRegistracijaPage() {
  const { t } = useTranslation("common");
  return (
    <RegistrationClosed
      accent="blue"
      message={t("registrationClosed.cl")}
    >
      <CLRegistrationFormNew />
    </RegistrationClosed>
  );
}
