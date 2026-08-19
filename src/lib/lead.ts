/** What we remember about someone who already registered on this device. */
export interface StoredLead {
  firstName: string;
  lastName?: string;
  email: string;
  countryCode?: string;
  whatsapp?: string;
  profile?: string;
  challenge?: string;
  /** Stable per-device id, so a returning visitor is recognised without asking for anything. */
  deviceId?: string;
  /** ISO date of the last registration, used to tell "this event" from "a past event". */
  registeredAt?: string;
}

const LEAD_KEY = "funnel_lead";
const DEVICE_KEY = "funnel_device_id";

/** Device token: random, first-party, no IP and no fingerprinting. */
export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `d_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

export const saveLead = (lead: Omit<StoredLead, "deviceId" | "registeredAt">) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LEAD_KEY,
      JSON.stringify({ ...lead, deviceId: getDeviceId(), registeredAt: new Date().toISOString() }),
    );
  } catch {}
};

export const getStoredLead = (): StoredLead | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const lead = JSON.parse(raw) as StoredLead & { name?: string };
    // Tolerate the older { email, name } shape written by earlier versions.
    const firstName = (lead.firstName || lead.name || "").trim();
    if (!firstName || !lead.email) return null;
    return { ...lead, firstName };
  } catch {
    return null;
  }
};

export const clearStoredLead = () => {
  try {
    localStorage.removeItem(LEAD_KEY);
  } catch {}
};

/** Capitalised first name for display, or null when we do not know them. */
export const getLeadFirstName = (): string | null => {
  const lead = getStoredLead();
  const name = lead?.firstName?.trim();
  if (!name || name.length > 20 || !/^[a-zA-Zऀ-ॿ]/.test(name)) return null;
  return name.charAt(0).toUpperCase() + name.slice(1);
};
