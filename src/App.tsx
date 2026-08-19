import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { funnel } from './funnel.config'
import Index from './pages/Index'
import PixelTracker from './components/PixelTracker'

// The admin panel is heavy and almost never loaded by a visitor, so it stays
// out of the entry bundle.
const ControlRoom = lazy(() => import('./pages/ControlRoom'))
const Offer = lazy(() => import('./pages/Offer'))
const ThankYou = lazy(() => import('./pages/ThankYou'))
const Legal = lazy(() => import('./pages/Legal'))
const Preferences = lazy(() => import('./pages/Preferences'))
const Closed = lazy(() => import('./pages/Closed'))
const Replay = lazy(() => import('./pages/Replay'))

const Loading = () => <div className="min-h-screen bg-[hsl(var(--background))]" />

export default function App() {
  const hasUpsell = !!funnel.offer.upsell
  const hasDownsell = !!funnel.offer.downsell

  return (
    <BrowserRouter>
      <PixelTracker />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Offer routes exist only when the offer does. Otherwise they redirect
              rather than rendering an empty page. */}
          <Route path="/vip" element={hasUpsell ? <Offer kind="upsell" /> : <Navigate to="/thank-you" replace />} />
          <Route path="/ip"  element={hasDownsell ? <Offer kind="downsell" /> : <Navigate to="/thank-you" replace />} />

          <Route path="/thank-you"  element={<ThankYou bought="none" />} />
          <Route path="/thanks"     element={<ThankYou bought="downsell" />} />
          <Route path="/thanksalot" element={<ThankYou bought="upsell" />} />

          <Route path="/replay1" element={<Replay day={1} />} />
          <Route path="/replay2" element={<Replay day={2} />} />
          <Route path="/replay3" element={<Replay day={3} />} />

          <Route path="/terms"      element={<Legal doc="terms" />} />
          <Route path="/privacy"    element={<Legal doc="privacy" />} />
          <Route path="/refund"     element={<Legal doc="refund" />} />
          <Route path="/disclaimer" element={<Legal doc="disclaimer" />} />

          <Route path="/preferences"  element={<Preferences />} />
          <Route path="/closed"       element={<Closed />} />
          <Route path="/control-room" element={<ControlRoom />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
