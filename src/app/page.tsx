import RegistrationForm from "@/components/RegistrationForm";
import PrizesGallery from "@/components/PrizesGallery";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      <Navbar />
      <div id="prizes" className="w-full">
        <PrizesGallery />
      </div>
      <div id="registration" className="w-full">
        <RegistrationForm />
      </div>
      <Footer />
    </main>
  );
}
