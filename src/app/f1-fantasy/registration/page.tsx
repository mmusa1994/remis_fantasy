"use client";

import F1RegistrationForm from "@/components/F1RegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";
import { useTranslation } from "react-i18next";

export default function F1FantasyRegistrationPage() {
  const { t } = useTranslation("common");
  return (
    <RegistrationClosed
      accent="red"
      message={t("registrationClosed.f1")}
    >
      <F1RegistrationForm />
    </RegistrationClosed>
  );
}
