import { getSiteConfig } from "@/lib/settings";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDay = (y: number, m: number, d: number, offset: number) => {
  const dt = new Date(y, m - 1, d + offset);
  return `${MONTHS[dt.getMonth()]} ${ordinal(dt.getDate())}`;
};

/**
 * Returns a human-friendly range like "May 1st to May 3rd"
 * based on the latest event date saved in site_settings (event_date).
 * Always a 3-day window.
 */
export const fetchEventDatesLabel = async (): Promise<string> => {
  try {
    const { settings } = await getSiteConfig();
    const dateStr: string = settings.event_date || "2026-05-01";
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${formatDay(y, m, d, 0)} to ${formatDay(y, m, d, 2)}`;
  } catch {
    return "May 1st to May 3rd";
  }
};
