import { funnel } from "@/funnel.config";
import { supabase } from "@/integrations/supabase/client";

const REF_STORAGE_KEY = "funnel_ref_code";
const SELF_AFFILIATE_KEY = "funnel_my_affiliate";

/** Generate a short 6-char code (uppercase alphanumeric, ambiguity-free) */
export const generateAffiliateCode = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/** Read ?ref= from URL on landing and persist to localStorage */
export const captureIncomingRef = () => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && /^[A-Z0-9]{4,12}$/i.test(ref)) {
    localStorage.setItem(REF_STORAGE_KEY, ref.toUpperCase());
  }
};

export const getStoredRef = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REF_STORAGE_KEY);
};

export const clearStoredRef = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REF_STORAGE_KEY);
};

export interface AffiliateRecord {
  id: string;
  code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  country_code: string | null;
  whatsapp: string | null;
}

const normalizeName = (s?: string | null) => (s || "").trim().toLowerCase();
const normalizeEmail = (s?: string | null) => (s || "").trim().toLowerCase();
const normalizePhone = (s?: string | null) => (s || "").replace(/[\s-]/g, "");

/** Find an existing affiliate by exact (first_name + email + whatsapp) match */
export const findExistingAffiliate = async (data: {
  first_name: string;
  email?: string;
  whatsapp?: string;
}): Promise<AffiliateRecord | null> => {
  const fn = normalizeName(data.first_name);
  const em = normalizeEmail(data.email);
  const wa = normalizePhone(data.whatsapp);
  if (!fn || !em || !wa) return null;
  const { data: rows } = await (supabase as any)
    .from("affiliates")
    .select("id, code, first_name, last_name, email, country_code, whatsapp")
    .ilike("email", em);
  if (!rows || !rows.length) return null;
  const match = (rows as AffiliateRecord[]).find(
    (r) =>
      normalizeName(r.first_name) === fn &&
      normalizePhone(r.whatsapp) === wa
  );
  return match || null;
};

/** Lenient lookup for the /win login: matches on email + (first name OR whatsapp).
 *  This allows users to log back into their referral dashboard with the basic
 *  details they registered with, even if one field has a small typo. */
export const findAffiliateForLogin = async (data: {
  first_name?: string;
  email: string;
  whatsapp?: string;
}): Promise<AffiliateRecord | null> => {
  const fn = normalizeName(data.first_name);
  const em = normalizeEmail(data.email);
  const wa = normalizePhone(data.whatsapp);
  if (!em) return null;
  const { data: rows } = await (supabase as any)
    .from("affiliates")
    .select("id, code, first_name, last_name, email, country_code, whatsapp")
    .ilike("email", em);
  if (!rows || !rows.length) return null;
  const list = rows as AffiliateRecord[];
  // Prefer exact triple match
  const exact = list.find(
    (r) =>
      normalizeName(r.first_name) === fn &&
      normalizePhone(r.whatsapp) === wa
  );
  if (exact) return exact;
  // Fall back to email + (name OR whatsapp)
  const partial = list.find(
    (r) =>
      (fn && normalizeName(r.first_name) === fn) ||
      (wa && normalizePhone(r.whatsapp) === wa)
  );
  return partial || list[0];
};

/** Find an existing affiliate by email only (case-insensitive). */
export const findAffiliateByEmail = async (
  email?: string
): Promise<AffiliateRecord | null> => {
  const em = normalizeEmail(email);
  if (!em) return null;
  const { data: rows } = await (supabase as any)
    .from("affiliates")
    .select("id, code, first_name, last_name, email, country_code, whatsapp")
    .ilike("email", em)
    .limit(1);
  if (!rows || !rows.length) return null;
  return (rows as AffiliateRecord[])[0];
};

/** Save the current registered person as an affiliate.
 *  If a record already exists with the same email, update the name / whatsapp
 *  on that record (people often re-register with updated contact details) and
 *  return the SAME affiliate code so they keep their existing referrals. */
export const createAffiliate = async (data: {
  first_name: string;
  last_name?: string;
  email?: string;
  country_code?: string;
  whatsapp?: string;
}): Promise<AffiliateRecord | null> => {
  // Re-registration with same email -> update profile, keep affiliate code
  const existing = await findAffiliateByEmail(data.email);
  if (existing) {
    const updates: Record<string, any> = {};
    if (data.first_name && data.first_name !== existing.first_name) updates.first_name = data.first_name;
    if (data.last_name !== undefined && data.last_name !== existing.last_name) updates.last_name = data.last_name;
    if (data.country_code !== undefined && data.country_code !== existing.country_code) updates.country_code = data.country_code;
    if (data.whatsapp !== undefined && data.whatsapp !== existing.whatsapp) updates.whatsapp = data.whatsapp;
    if (Object.keys(updates).length) {
      const { data: updated } = await (supabase as any)
        .from("affiliates")
        .update(updates)
        .eq("id", existing.id)
        .select("id, code, first_name, last_name, email, country_code, whatsapp")
        .single();
      if (updated) return updated as AffiliateRecord;
    }
    return existing;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = generateAffiliateCode();
    const { data: row, error } = await (supabase as any)
      .from("affiliates")
      .insert({ ...data, code })
      .select()
      .single();
    if (!error && row) return row as AffiliateRecord;
    if (error && error.code === "23505" && `${error.message}`.includes("affiliates_code")) continue;
    if (error && error.code === "23505") {
      const again = await findAffiliateByEmail(data.email);
      if (again) return again;
      continue;
    }
    if (error) {
      console.error("createAffiliate error", error);
      return null;
    }
  }
  return null;
};

/** Log a referral (someone signed up using ref_code) */
export const logReferral = async (refCode: string, person: {
  first_name?: string;
  last_name?: string;
  email?: string;
  whatsapp?: string;
}) => {
  await (supabase as any).from("referrals").insert({
    ref_code: refCode.toUpperCase(),
    referred_first_name: person.first_name,
    referred_last_name: person.last_name,
    referred_email: person.email,
    referred_whatsapp: person.whatsapp,
  });
};

/** Save my own affiliate record locally so /thanks & /thank-you can pick it up */
export const saveMyAffiliate = (rec: AffiliateRecord) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELF_AFFILIATE_KEY, JSON.stringify(rec));
};

export const getMyAffiliate = (): AffiliateRecord | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SELF_AFFILIATE_KEY);
    return raw ? (JSON.parse(raw) as AffiliateRecord) : null;
  } catch {
    return null;
  }
};

/** Look up affiliate by code (used when ?ref= is on /thanks URL) */
export const fetchAffiliateByCode = async (code: string): Promise<AffiliateRecord | null> => {
  const { data } = await (supabase as any)
    .from("affiliates")
    .select("id, code, first_name, last_name, email, country_code, whatsapp")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return (data as AffiliateRecord) || null;
};

/** Count referrals for a code */
export const countReferrals = async (code: string): Promise<number> => {
  const { count } = await (supabase as any)
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("ref_code", code.toUpperCase());
  return count || 0;
};

export const buildReferralLink = (code: string): string => {
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : `https://${funnel.brand.domain}`;
  return `${origin}/?ref=${code}`;
};
