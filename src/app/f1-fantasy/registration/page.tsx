"use client";

import F1RegistrationForm from "@/components/F1RegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";

export default function F1FantasyRegistrationPage() {
  return (
    <RegistrationClosed
      accent="red"
      message="Registracija za F1 Fantasy sezonu 2026 je zatvorena. Pratite nas za više informacija."
    >
      <F1RegistrationForm />
    </RegistrationClosed>
  );
}
