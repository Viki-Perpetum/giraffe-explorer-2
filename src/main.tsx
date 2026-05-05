import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);

// MSAL v3 requires initialize + handleRedirectPromise to finish
// before any interactive login calls
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then(() => {
    createRoot(document.getElementById("root")!).render(
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    );
  }).catch((error) => {
    console.error("MSAL redirect error:", error);
  });
});
