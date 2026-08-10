/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DISCORD_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_DISCORD_SOCKET_URL?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
