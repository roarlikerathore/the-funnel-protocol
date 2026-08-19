import { useState } from 'react'
import TopBanner from '@/components/TopBanner'
import Hero from '@/components/sections/Hero'
import Pain from '@/components/sections/Pain'
import Stats from '@/components/sections/Stats'
import Methods from '@/components/sections/Methods'
import Sessions from '@/components/sections/Sessions'
import BeforeAfter from '@/components/sections/BeforeAfter'
import WhoFor from '@/components/sections/WhoFor'
import Speaker from '@/components/sections/Speaker'
import Proof from '@/components/sections/Proof'
import Bonuses from '@/components/sections/Bonuses'
import Guarantee from '@/components/sections/Guarantee'
import FAQ from '@/components/sections/FAQ'
import Urgency from '@/components/sections/Urgency'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/Footer'
import RegistrationDialog from '@/components/RegistrationDialog'

/**
 * Order is deliberate, and it is an argument rather than a list:
 *   their problem  ->  what has to change  ->  what happens  ->  who it is for
 *   ->  who is saying it  ->  proof  ->  what is included  ->  objections  ->  the ask
 *
 * Every section hides itself when its config is missing, so a lean funnel and a
 * full one run exactly the same file. That is what makes two funnels built from
 * this template structurally identical while reading completely differently.
 */
export default function Index() {
  const [open, setOpen] = useState(false)
  const register = () => setOpen(true)

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <TopBanner />
      <Hero onRegister={register} />
      <Pain />
      <Stats />
      <Methods />
      <Sessions />
      <BeforeAfter />
      <WhoFor />
      <Speaker />
      <Proof />
      <Bonuses />
      <Guarantee />
      <FAQ />
      <Urgency onRegister={register} />
      <FinalCTA onRegister={register} />
      <Footer />
      <RegistrationDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
