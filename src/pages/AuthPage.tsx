import { useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MicrosoftLoginButton } from "@/components/auth/MicrosoftLoginButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Loader2, ArrowRight, Eye, EyeOff, Moon, Sun, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const logoColors = ["#3F61A2", "#569FCD", "#6EC3D0", "#A0C49F", "#E9DA5D"];
const BRAND_TEAL = "#71c4d1";

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = useState("");

  // Theme
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("perpetum-theme") === "dark";
  });

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("perpetum-theme", dark ? "dark" : "light");
  }, [dark]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error, requiresMfa } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast.error("Login failed", { description: error.message });
    } else if (requiresMfa) {
      navigate("/mfa-challenge");
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      toast.error("Signup failed", { description: error.message });
    } else {
      setVerifyEmail(signupEmail);
      setView("verify");
    }

    setIsSubmitting(false);
  };

  if (view === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center animate-fade-in">
          <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: BRAND_TEAL }} />
          <h2 className="text-xl font-bold text-foreground mb-2 font-archivo">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification link to <span className="text-foreground font-medium">{verifyEmail}</span>.
          </p>
          <button
            onClick={() => setView("form")}
            className="text-sm hover:underline"
            style={{ color: BRAND_TEAL }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Theme toggle in top right */}
      <button
        onClick={() => setDark(!dark)}
        className="absolute top-4 right-4 p-2 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted transition-colors"
      >
        {dark ? (
          <Sun className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Moon className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Glassmorphism card with gradient border */}
        <div
          className="relative p-[1px] rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 50%, hsl(var(--secondary)) 100%)'
          }}
        >
          <div className="relative rounded-2xl p-8 shadow-2xl backdrop-blur-xl bg-card">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-1.5 mb-1">
                {logoColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span className="ml-2 text-xl font-semibold text-foreground font-archivo">
                  PerPetum
                </span>
              </div>
              <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                Energy
              </span>
            </div>

            {/* Lock icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_TEAL}20` }}
              >
                <Lock className="w-8 h-8" style={{ color: BRAND_TEAL }} />
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb- h-11 p-1 rounded-lg bg-muted">
                <TabsTrigger
                  value="login"
                  className="rounded-md text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-md text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0 space-y-5">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground font-archivo">
                    Access Control Matrix
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your credentials to access the system
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-muted-foreground text-sm">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@perpetum.energy"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-12 !bg-muted border-0 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-muted-foreground text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-12 !bg-muted border-0 pr-12 text-foreground placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium text-base text-black hover:opacity-90"
                    style={{ backgroundColor: BRAND_TEAL }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Sign In
                    {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0 space-y-5">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground font-archivo">
                    Create Account
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register for access to the system
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-muted-foreground text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jan Peeters"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      className="h-12 !bg-muted border-0 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-muted-foreground text-sm">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@perpetum.energy"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-12 !bg-muted border-0 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-muted-foreground text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={12}
                        className="h-12 !bg-muted border-0 pr-12 text-foreground placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 12 characters.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium text-base text-black hover:opacity-90"
                    style={{ backgroundColor: BRAND_TEAL }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Create Account
                    {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Microsoft SSO */}
            <MicrosoftLoginButton onLoginSuccess={() => navigate("/")} />

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
              This system is confidential and prepared exclusively
              <br />
              for PerPetum Energy employees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
