import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface MFAChallengeProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function MFAChallenge({ onSuccess, onCancel }: MFAChallengeProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeMFA = async () => {
      try {
        setError(null);
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

        if (listError) {
          setError("Failed to load MFA configuration. Please try again.");
          setIsInitializing(false);
          return;
        }

        const totpFactor = factors?.totp?.[0];
        if (!totpFactor) {
          setError("TOTP factor not found. Please re-enroll MFA.");
          setIsInitializing(false);
          return;
        }

        setFactorId(totpFactor.id);

        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });

        if (challengeError) {
          setError("Failed to create MFA challenge. Please try again.");
          setIsInitializing(false);
          return;
        }

        if (challenge) {
          setChallengeId(challenge.id);
        }
        setIsInitializing(false);
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setIsInitializing(false);
      }
    };

    initializeMFA();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    if (!factorId || !challengeId) {
      setError("MFA configuration error. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (verifyError) {
        setError("Invalid code. Please try again.");
        setCode("");
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setCode("");
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  if (isInitializing) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Multi-Factor Authentication</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
        <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Authentication Code</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              disabled={isLoading}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default MFAChallenge;
