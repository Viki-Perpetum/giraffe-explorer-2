import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

const BRAND_TEAL = "#71c4d1";

export default function NoAccess() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center animate-fade-in space-y-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${BRAND_TEAL}20` }}
        >
          <ShieldX className="w-10 h-10" style={{ color: BRAND_TEAL }} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            {profile?.display_name
              ? `Hi ${profile.display_name}, you`
              : "You"}{" "}
            don't have permission to access this application.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            Contact your administrator to request access, or return to the{" "}
            <a href="/" className="font-medium underline" style={{ color: BRAND_TEAL }}>
              main portal
            </a>.
          </p>
        </div>

        <Button variant="outline" onClick={signOut} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}