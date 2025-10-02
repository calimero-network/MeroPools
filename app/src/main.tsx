import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppMode, CalimeroProvider } from "@calimero-network/calimero-client";
import { Buffer } from "buffer";

// Polyfill Buffer for browser compatibility
globalThis.Buffer = Buffer;

const APPLICATION_ID =
  import.meta.env.VITE_APPLICATION_ID ||
  "J2d8eUpBi4UEmD7FgGwRA7T6WtxcotY3dqEu6arPyc4N";
const APPLICATION_PATH =
  import.meta.env.VITE_APPLICATION_PATH ||
  "https://calimero-only-peers-dev.s3.amazonaws.com/uploads/mero_pools.wasm";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CalimeroProvider
      clientApplicationId={APPLICATION_ID}
      mode={AppMode.MultiContext}
      applicationPath={APPLICATION_PATH}
    >
      <App />
    </CalimeroProvider>
  </StrictMode>
);
