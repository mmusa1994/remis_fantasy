"use client";

import PLRegistrationForm from "@/components/PLRegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";

export default function RegistracijaPage() {
  return (
    <RegistrationClosed
      accent="purple"
      message="Prijave za Premier League sezonu 2026/27 su zatvorene. Hvala svima koji su se prijavili — sretno u takmičenju!"
    >
      <PLRegistrationForm />
    </RegistrationClosed>
  );
}
