/**
 * @perpetum/core — Shared components, hooks, and utilities for all PerPetum apps.
 *
 * This barrel export defines what gets published as the npm package.
 * When you add a new shared component, export it here.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────
export { AuthProvider, useAuth } from "../hooks/useAuth";
export type { AppRole, Profile, AppAccess } from "../hooks/useAuth";
export { MFAChallenge } from "../components/auth/MFAChallenge";
export { MFAEnrollment } from "../components/auth/MFAEnrollment";
export { MicrosoftLoginButton } from "../components/auth/MicrosoftLoginButton";
export { msalConfig, loginRequest, graphConfig } from "../authConfig";

// ── Layout ───────────────────────────────────────────────────────────────────
export { default as MainLayout } from "../components/MainLayout";
export { AppSidebar } from "../components/AppSidebar";
export { Breadcrumbs } from "../components/Breadcrumbs";

// ── UI Components ────────────────────────────────────────────────────────────
export { GradientAvatar } from "../components/GradientAvatar";
export { GradientMesh } from "../components/GradientMesh";
export { ThemeToggle } from "../components/ThemeToggle";

// ── Utilities ────────────────────────────────────────────────────────────────
export { cn } from "../lib/utils";

// ── Supabase ─────────────────────────────────────────────────────────────────
export { supabase } from "../integrations/supabase/client";

// ── Hooks ────────────────────────────────────────────────────────────────────
export { useIsMobile } from "../hooks/use-mobile";
