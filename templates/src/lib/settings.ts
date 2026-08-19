/**
 * One shared fetch of site_settings + page_toggles for the whole app.
 *
 * Before this, a single landing page view fired seven queries: useEventDate ran in five
 * separate components, Index fetched the same two keys again, and usePageToggle hit
 * page_toggles. All for values that change roughly once a month. That is what was eating
 * the database IO budget.
 *
 * Now: one request per browser session, shared by every caller, with a short
 * sessionStorage cache so a reload does not refetch either.
 */
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  settings: Record<string, string>;
  toggles: Record<string, boolean>;
}

const CACHE_KEY = "mhp_config";
const TTL_MS = 5 * 60 * 1000;

let inflight: Promise<SiteConfig> | null = null;

const readCache = (): SiteConfig | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > TTL_MS) return null;
    return data as SiteConfig;
  } catch {
    return null;
  }
};

const writeCache = (data: SiteConfig) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* private mode, ignore */
  }
};

/** Every caller shares the same promise, so concurrent components never duplicate the request. */
export const getSiteConfig = (): Promise<SiteConfig> => {
  const cached = readCache();
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = (async () => {
    const empty: SiteConfig = { settings: {}, toggles: {} };
    try {
      const [s, t] = await Promise.all([
        (supabase as any).from("site_settings").select("setting_key, setting_value"),
        (supabase as any).from("page_toggles").select("page_key, is_active"),
      ]);
      const config: SiteConfig = { settings: {}, toggles: {} };
      (s.data || []).forEach((r: any) => { config.settings[r.setting_key] = r.setting_value; });
      (t.data || []).forEach((r: any) => { config.toggles[r.page_key] = r.is_active; });
      writeCache(config);
      return config;
    } catch {
      return empty;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

/** Call after saving in the Control Room so the next read is fresh. */
export const clearSiteConfigCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
  inflight = null;
};
