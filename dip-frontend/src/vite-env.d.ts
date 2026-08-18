/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_DISCORD_WEBHOOK_URL?: string;
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_CRED?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
