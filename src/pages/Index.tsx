import { useState } from 'react'
import { funnel } from '@/funnel.config'
import TopBanner from '@/components/TopBanner'
import StickyBar from '@/components/StickyBar'
import Hero from '@/components/sections/Hero'
import Pain from '@/components/sections/Pain'
import Stats from '@/components/sections/Stats'
import VideoBlock from '@/components/sections/VideoBlock'
import Methods from '@/components/sections/Methods'
import Sessions from '@/components/sections/Sessions'
import BeforeAfter from '@/components/sections/BeforeAfter'
import Benefits from '@/components/sections/Benefits'
import WhoFor from '@/components/sections/WhoFor'
import Speaker from '@/components/sections/Speaker'
import Proof from '@/components/sections/Proof'
import Bonuses from '@/components/sections/Bonuses'
import ValueStack from '@/components/sections/ValueStack'
import Guarantee from '@/components/sections/Guarantee'
import FAQ from '@/components/sections/FAQ'
import Urgency from '@/components/sections/Urgency'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/Footer'
import RegistrationDialog from '@/components/RegistrationDialog'

/**
 * Order is an argument, not a list:
 *   their problem -> proof -> what has to change -> what happens -> who it is for
 *   -> who is saying it -> what it is worth -> objections -> the ask
 *
 * THE FOLD. With sections.foldBelowHero on, everything under the hero starts
 * collapsed behind one button. Someone already convinced registers from the hero
 * and never scrolls. Someone who needs convincing chooses to open it. Nobody is
 * dragged past arguments they did not ask for, and the page stops feeling endless.
 *
 * Every section hides itself when its config is missing, so a lean funnel and a
 * full one run this same file.
 */
export default function Index() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(!funnel.sections.foldBelowHero)
  const register = () => setOpen(true)

  const body = (
    <>
      <Pain />
      <Stats />
      <VideoBlock which="landing" title="What you will learn" />
      <Methods />
      <Sessions />
      <BeforeAfter />
      <Benefits />
      <WhoFor />
      <Speaker />
      <Proof />
      <Bonuses />
      <ValueStack onRegister={register} />
      <Guarantee />
      <FAQ />
      <Urgency onRegister={register} />
    </>
  )

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <TopBanner />
      <Hero onRegister={register} />

      {expanded ? body : (
        <div className="px-4 pb-16 text-center">
          <button onClick={() => setExpanded(true)}
            className="rounded-xl border-2 border-[hsl(var(--accent))] px-8 py-4 font-bold
                       text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent)/0.1)]">
            Show me what is covered &darr;
          </button>
          <p className="mt-3 text-sm text-[hsl(var(--muted))]">
            Already decided? Use the button above and skip all of this.
          </p>
        </div>
      )}

      <FinalCTA onRegister={register} />
      <Footer />

      {/* Only follows people who chose to read on. */}
      {expanded && <StickyBar onRegister={register} />}

      <RegistrationDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
