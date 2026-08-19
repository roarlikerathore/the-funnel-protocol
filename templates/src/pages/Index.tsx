import { useState } from 'react'
import Hero from '@/components/sections/Hero'
import Pain from '@/components/sections/Pain'
import Stats from '@/components/sections/Stats'
import Sessions from '@/components/sections/Sessions'
import WhoFor from '@/components/sections/WhoFor'
import Proof from '@/components/sections/Proof'
import FAQ from '@/components/sections/FAQ'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/Footer'
import RegistrationDialog from '@/components/RegistrationDialog'

/**
 * Order is deliberate: their problem before any claim, proof before the ask,
 * objections handled last so nothing is left to argue with at the CTA.
 */
export default function Index() {
  const [open, setOpen] = useState(false)
  const register = () => setOpen(true)

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Hero onRegister={register} />
      <Pain />
      <Stats />
      <Sessions />
      <WhoFor />
      <Proof />
      <FAQ />
      <FinalCTA onRegister={register} />
      <Footer />
      <RegistrationDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
