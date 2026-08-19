/**
 * Fires the pixel and records analytics on every route change.
 *
 * Purchase is deliberately NOT fired here: it belongs on the page the payment
 * provider redirects to, guarded so a refresh cannot count the sale twice.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initPixel, trackPixel, restoreIdentity, trackScrollDepth } from '@/lib/pixel'
import { recordPageView } from '@/lib/analytics'

export default function PixelTracker() {
  const { pathname } = useLocation()

  useEffect(() => { initPixel(); restoreIdentity() }, [])

  useEffect(() => {
    trackPixel('PageView')
    recordPageView(pathname)
  }, [pathname])

  // Scroll depth tells you where a page loses people, which is the only way to
  // know which section to rewrite.
  useEffect(() => trackScrollDepth(pathname), [pathname])

  return null
}
