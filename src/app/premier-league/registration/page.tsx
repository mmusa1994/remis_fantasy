"use client";

import PLRegistrationForm from "@/components/PLRegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";
import { useTranslation } from "react-i18next";

export default function RegistracijaPage() {
  const { t } = useTranslation("common");
  return (
    <RegistrationClosed
      accent="purple"
      message={t("registrationClosed.pl")}
    >
      <PLRegistrationForm />
    </RegistrationClosed>
  );
}
