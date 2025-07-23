import RegistrationForm from "@/components/RegistrationForm";
import PrizesGallery from "@/components/PrizesGallery";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PrizesGallery />
      <div id="registration">
        <RegistrationForm />
      </div>
    </main>
  );
}
