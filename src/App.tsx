import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/MainLayout";
import AuthPage from "@/pages/AuthPage";
import NoAccess from "@/pages/NoAccess";
import NotFound from "./pages/NotFound";
import { MFAChallenge } from "@/components/auth/MFAChallenge";
// CLAUDE_INSERT_IMPORTS

const queryClient = new QueryClient();

// ── CONFIGURE THIS PER APP ──────────────────────────────────────────────────
// Set to your app's slug from the `apps` table (e.g. 'it-panel', 'sales', 'finance')
// Set to undefined to skip per-app access checking (e.g. for The Shell)
const APP_SLUG: string | undefined = undefined;
// ─────────────────────────────────────────────────────────────────────────────

function MFAChallengePage() {
  const { requiresMfa } = useAuth();

  if (!requiresMfa) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <MFAChallenge
        onSuccess={() => window.location.replace("/")}
        onCancel={() => window.location.replace("/auth")}
      />
    </div>
  );
}

function ProtectedRoutes() {
  const { user, isLoading, requiresMfa, hasAccess } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requiresMfa) return <Navigate to="/mfa-challenge" replace />;
  if (!hasAccess) return <Navigate to="/no-access" replace />;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* CLAUDE_INSERT_ROUTES */}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider appSlug={APP_SLUG}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/mfa-challenge" element={<MFAChallengePage />} />
            <Route path="/no-access" element={<NoAccess />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;