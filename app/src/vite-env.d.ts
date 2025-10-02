/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_NETWORK_TYPE: string;
  readonly VITE_DELEGATOR_URL: string;
  readonly VITE_APPLICATION_ID: string;
  readonly VITE_APPLICATION_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
