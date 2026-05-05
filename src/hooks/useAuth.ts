import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import React from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "global_admin" | "admin" | "team_manager" | "viewer" | "user";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppAccess {
  app_slug: string;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  appRoles: AppRole[];
  appAccess: AppAccess[];
  isLoading: boolean;
  isGlobalAdmin: boolean;
  requiresMfa: boolean;
  /** Whether the user has access to the current app (set via appSlug) */
  hasAccess: boolean;
  /** The user's role for the current app */
  currentAppRole: AppRole | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enrollMfa: () => Promise<{ error: Error | null; id?: string; totp?: { qr_code: string; secret: string } }>;
  verifyMfa: (factorId: string, code: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  /** The slug for the current app (e.g. 'it-panel', 'sales', 'shell').
   *  Used to check app_access table for per-app authorization.
   *  If not set, access checking is skipped (all authenticated users allowed). */
  appSlug?: string;
}

// In prototype-preview builds (GitHub Pages), there is no Supabase backend.
// Skip the auth gate entirely so the page renders directly. Triggered by the
// build workflow setting VITE_PROTOTYPE_MODE=true.
const PROTOTYPE_MODE = import.meta.env.VITE_PROTOTYPE_MODE === "true";

export function AuthProvider({ children, appSlug }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(
    PROTOTYPE_MODE ? ({ id: "preview", email: "preview@perpetum.local" } as User) : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(
    PROTOTYPE_MODE
      ? ({ id: "preview", user_id: "preview", display_name: "Preview", avatar_url: null, created_at: "", updated_at: "" })
      : null
  );
  const [appRoles, setAppRoles] = useState<AppRole[]>(
    PROTOTYPE_MODE ? ["global_admin"] : []
  );
  const [appAccess, setAppAccess] = useState<AppAccess[]>([]);
  const [isLoading, setIsLoading] = useState(!PROTOTYPE_MODE);
  const [requiresMfa, setRequiresMfa] = useState(false);

  const isGlobalAdmin = appRoles.includes("global_admin");

  // Derive current app access
  const currentAppAccess = appSlug
    ? appAccess.find((a) => a.app_slug === appSlug)
    : null;
  const hasAccess = !appSlug || isGlobalAdmin || !!currentAppAccess;
  const currentAppRole = currentAppAccess?.role ?? (isGlobalAdmin ? "global_admin" : null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch global roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;
      setAppRoles(rolesData?.map((r) => r.role as AppRole) || []);

      // Fetch app access
      const { data: accessData, error: accessError } = await supabase
        .from("app_access")
        .select("app_slug, role")
        .eq("user_id", userId);

      if (!accessError && accessData) {
        setAppAccess(accessData.map((a) => ({ app_slug: a.app_slug, role: a.role as AppRole })));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // ── Auth state listener ──────────────────────────────────────────────────

  useEffect(() => {
    // In prototype-preview builds we never talk to Supabase — the synthetic
    // user set in useState is what the rest of the app sees.
    if (PROTOTYPE_MODE) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => fetchProfile(currentSession.user.id), 0);
        } else {
          setProfile(null);
          setAppRoles([]);
          setAppAccess([]);
          setRequiresMfa(false);
        }

        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── MFA ────────────────────────────────────────────────────────────────

  const enrollMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      return { error: error as Error | null, id: data?.id, totp: data?.totp };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyMfa = async (factorId: string, code: string) => {
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ── Auth methods ─────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check MFA requirement
      const { data: assuranceData, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (!assuranceError && assuranceData?.nextLevel === "aal2") {
        setRequiresMfa(true);
        return { error: null };
      }

      setRequiresMfa(false);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch {
      await supabase.auth.signOut({ scope: "local" });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        session,
        profile,
        appRoles,
        appAccess,
        isLoading,
        isGlobalAdmin,
        requiresMfa,
        hasAccess,
        currentAppRole,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        enrollMfa,
        verifyMfa,
      },
    },
    children
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
