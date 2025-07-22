import HeroSection from '@/components/HeroSection'
import ChampionsShowcase from '@/components/ChampionsShowcase'
import RulesSection from '@/components/RulesSection'
import RegistrationForm from '@/components/RegistrationForm'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ChampionsShowcase />
      <RulesSection />
      <div id="registration">
        <RegistrationForm />
      </div>
    </main>
  )
}
