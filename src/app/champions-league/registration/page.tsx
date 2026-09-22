"use client";

import CLRegistrationFormNew from "@/components/CLRegistrationForm";
import RegistrationClosed from "@/components/RegistrationClosed";

export default function ChampionsLeagueRegistracijaPage() {
  return (
    <RegistrationClosed
      accent="blue"
      message="Prijave za Champions League sezonu 2026/27 su zatvorene. Hvala svima koji su se prijavili — sretno u takmičenju!"
    >
      <CLRegistrationFormNew />
    </RegistrationClosed>
  );
}
