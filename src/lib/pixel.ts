/**
 * Meta Pixel layer for the MHP funnel.
 *
 * Three things drive data quality, and all three are handled here:
 *  1. Advanced Matching  - we hand Meta the lead's email / phone / name / city so it can
 *                          match the event to a real Facebook profile. This is the single
 *                          biggest lever on Event Match Quality. Values are normalised here;
 *                          the pixel SHA-256 hashes them in the browser before they leave.
 *  2. external_id        - the affiliate code, a stable id for the same human across events.
 *  3. eventID            - a unique id per event so a future Conversions API send can be
 *                          de-duplicated against the browser event instead of double counting.
 */

import { funnel } from "@/funnel.config";

/** From funnel.config.ts. Empty disables tracking rather than firing to nowhere. */
export const PIXEL_ID = funnel.tracking?.metaPixelId || "";

const MATCH_KEY = "mhp_fb_match";

export interface LeadIdentity {
  email?: string;
  phone?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}

const fbq = (...args: unknown[]) => {
  if (typeof window !== "undefined" && window.fbq) {
    (window.fbq as (...a: unknown[]) => void)(...args);
  }
};

/** Unique id per event, so browser + server events can be de-duplicated later. */
const newEventId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const clean = (v?: string) => (v || "").trim().toLowerCase();

/** Meta wants digits only, including country code: "919876543210". */
const cleanPhone = (phone?: string, countryCode?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const cc = (countryCode || "").replace(/\D/g, "");
  return digits.length > 10 || !cc ? digits : `${cc}${digits}`;
};

/** Build the Advanced Matching object Meta expects (raw values; the pixel hashes them). */
const buildMatch = (id: LeadIdentity) => {
  const match: Record<string, string> = {};
  const em = clean(id.email);
  const ph = cleanPhone(id.phone, id.countryCode);
  const fn = clean(id.firstName);
  const ln = clean(id.lastName);
  if (em) match.em = em;
  if (ph) match.ph = ph;
  if (fn) match.fn = fn;
  if (ln) match.ln = ln;
  if (id.externalId) match.external_id = id.externalId.toLowerCase();
  // Everything on this funnel is India-first; country improves match rate at no cost.
  match.country = "in";
  return match;
};

/**
 * Register who this visitor is. Re-inits the pixel with Advanced Matching so every
 * event fired afterwards (Lead, Purchase, everything) carries the identity.
 * Persisted so later pages in the funnel keep the same match quality.
 */
export const identifyLead = (id: LeadIdentity) => {
  const match = buildMatch(id);
  if (Object.keys(match).length <= 1) return; // country only = nothing useful
  try {
    localStorage.setItem(MATCH_KEY, JSON.stringify(match));
  } catch {}
  fbq("init", PIXEL_ID, match);
};

/** Re-apply stored Advanced Matching on later pages / return visits. */
export const restoreIdentity = () => {
  try {
    const raw = localStorage.getItem(MATCH_KEY);
    if (!raw) return false;
    const match = JSON.parse(raw);
    if (match && typeof match === "object" && Object.keys(match).length) {
      fbq("init", PIXEL_ID, match);
      return true;
    }
  } catch {}
  return false;
};

/** Standard Meta event (Lead, Purchase, ViewContent, InitiateCheckout...). */
export const trackPixel = (event: string, data?: Record<string, unknown>) => {
  fbq("track", event, data || {}, { eventID: newEventId() });
};

/** Custom event: engagement and funnel-shape signals Meta can build audiences from. */
export const trackCustom = (event: string, data?: Record<string, unknown>) => {
  fbq("trackCustom", event, data || {}, { eventID: newEventId() });
};

/** Fire an event at most once per browser session (guards double-counted Purchases). */
export const trackOnce = (
  key: string,
  event: string,
  data?: Record<string, unknown>,
  custom = false,
) => {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {}
  if (custom) trackCustom(event, data);
  else trackPixel(event, data);
};


/**
 * Injects the Meta Pixel snippet. Safe to call more than once, and does nothing
 * when no pixel id is configured, so an unconfigured funnel stays silent rather
 * than firing events into a void.
 */
export const initPixel = () => {
  if (!PIXEL_ID || typeof window === "undefined" || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  // Read through a fresh reference: the snippet above assigns window.fbq, but
  // the early return has already narrowed the original binding to undefined.
  (window as Window).fbq?.("init", PIXEL_ID);
};

/**
 * Fires once per depth per page. Depth is where a page loses people, which is the
 * only reliable way to know which section needs rewriting.
 * Returns a cleanup function, so it can be used directly inside useEffect.
 */
export const trackScrollDepth = (path: string) => {
  if (typeof window === "undefined") return () => {};
  const hit = new Set<number>();
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.round((window.scrollY / scrollable) * 100);
    for (const mark of [25, 50, 75, 100]) {
      if (pct >= mark && !hit.has(mark)) {
        hit.add(mark);
        trackCustom("ScrollDepth", { depth: mark, path });
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
};
