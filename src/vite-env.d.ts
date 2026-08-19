/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
interface ImportMeta { readonly env: ImportMetaEnv }

/** Injected by the Meta Pixel snippet, so it is not on Window by default. */
interface Window { fbq?: (...args: unknown[]) => void }
