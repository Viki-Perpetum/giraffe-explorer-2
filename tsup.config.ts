import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/core/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "@supabase/supabase-js",
    "@azure/msal-browser",
    "@azure/msal-react",
    "@tanstack/react-query",
    "lucide-react",
    "zustand",
  ],
});
