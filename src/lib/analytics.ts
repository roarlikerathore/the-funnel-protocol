/**
 * First-party analytics. Meta's pixel reports to Meta; this reports to us, so the
 * Control Room can show page views, opt-in rate, drop-off and sales without asking
 * Meta for anything.
 */
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getStoredLead } from "@/lib/lead";

const SESSION_KEY = "mhp_session";
const SESSION_IDLE_MS = 30 * 60 * 1000;

/** A session ends after 30 minutes of inactivity, the usual analytics convention. */
const getSessionId = (): string => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const s = JSON.parse(raw) as { id: string; last: number };
      if (now - s.last < SESSION_IDLE_MS) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: s.id, last: now }));
        return s.id;
      }
    }
    const id = `s_${Math.random().toString(36).slice(2)}${now.toString(36)}`;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return "s_anon";
  }
};

const deviceType = (): string => {
  const w = typeof window === "undefined" ? 1024 : window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
};

/** UTMs from this visit, or the ones remembered from the visit that started the session. */
const utms = () => {
  const p = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const found: Record<string, string> = {};
  keys.forEach((k) => {
    const v = p.get(k);
    if (v) found[k] = v;
  });
  try {
    if (Object.keys(found).length) {
      sessionStorage.setItem("mhp_utms", JSON.stringify(found));
      return found;
    }
    return JSON.parse(sessionStorage.getItem("mhp_utms") || "{}");
  } catch {
    return found;
  }
};

/** Fire and forget: analytics must never slow a page or break it. */
const insert = (table: string, row: Record<string, unknown>) => {
  try {
    (supabase as any).from(table).insert(row).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    /* ignore */
  }
};

export const recordPageView = (path: string) => {
  const u = utms();
  insert("page_views", {
    visitor_id: getDeviceId(),
    session_id: getSessionId(),
    path,
    referrer: typeof document === "undefined" ? null : document.referrer || null,
    utm_source: u.utm_source || null,
    utm_medium: u.utm_medium || null,
    utm_campaign: u.utm_campaign || null,
    utm_content: u.utm_content || null,
    utm_term: u.utm_term || null,
    device: deviceType(),
  });
};

export type FunnelEvent =
  | "form_opened"
  | "gate_qualified"
  | "gate_disqualified"
  | "step2_completed"
  | "registered"
  | "one_tap_reregister";

export const recordFunnelEvent = (
  event: FunnelEvent,
  meta?: { profile?: string; challenge?: string },
) => {
  insert("funnel_events", {
    visitor_id: getDeviceId(),
    event,
    profile: meta?.profile || null,
    challenge: meta?.challenge || null,
  });
};

const PRODUCTS: Record<string, { product: string; amount: number }> = {
  "/thanksalot": { product: "vip_990", amount: 990 },
  "/thanks": { product: "ip_299", amount: 299 },
};

/**
 * The checkout provider offers no webhook, so a sale is recorded when the buyer lands on
 * the page the provider redirects to only after a successful payment. The unique index on
 * (email, product) means a refresh or a bookmark cannot double count.
 */
export const recordConversionForPath = (path: string) => {
  const hit = PRODUCTS[path];
  if (!hit) return;
  const lead = getStoredLead();
  insert("conversions", {
    email: lead?.email || null,
    visitor_id: getDeviceId(),
    product: hit.product,
    amount: hit.amount,
    currency: "INR",
    source_path: path,
  });
};
