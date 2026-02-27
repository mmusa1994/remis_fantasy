import RegistrationForm from "@/components/RegistrationForm";

export default function RegistracijaPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-16 xs:pb-20 pt-6 xs:pt-8 sm:pt-10 px-2 xs:px-4">
      <RegistrationForm leagueType="premier" />
    </div>
  );
}
