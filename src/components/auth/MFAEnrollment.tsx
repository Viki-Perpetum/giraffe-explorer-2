import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface MFAEnrollmentProps {
  onSuccess?: () => void;
}

export function MFAEnrollment({ onSuccess }: MFAEnrollmentProps) {
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    totp: { qr_code: string; secret: string };
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const enrollMfa = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });

        if (enrollError) throw enrollError;
        if (data) setEnrollmentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to enroll MFA");
      } finally {
        setIsLoading(false);
      }
    };

    enrollMfa();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentData) {
      setError("Enrollment data not found");
      return;
    }

    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollmentData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      if (data) {
        setSuccess(true);
        setVerificationCode("");
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (enrollmentData?.totp.secret) {
      navigator.clipboard.writeText(enrollmentData.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="text-green-600">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">MFA Enabled Successfully</h2>
          <p className="text-gray-600">Your authenticator app is now set up for this account.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Enable Two-Factor Authentication</h2>

      {isLoading && !enrollmentData ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : error && !enrollmentData ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2" variant="outline" size="sm">
            Retry
          </Button>
        </div>
      ) : enrollmentData ? (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Step 1: Scan QR Code</Label>
            <p className="text-sm text-gray-600 mb-3">
              Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) to scan this QR code:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
              <img src={enrollmentData.totp.qr_code} alt="Scan with authenticator app" className="w-48 h-48" />
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Step 2: Manual Entry (if needed)</Label>
            <p className="text-sm text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm break-all select-all">
                {enrollmentData.totp.secret}
              </code>
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="whitespace-nowrap">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-base font-semibold mb-2 block">Step 3: Verify Code</Label>
              <p className="text-sm text-gray-600 mb-3">Enter the 6-digit code from your authenticator app:</p>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </Button>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              <strong>Important:</strong> Save your backup codes in a secure location. You'll need them
              if you lose access to your authenticator app.
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export default MFAEnrollment;
