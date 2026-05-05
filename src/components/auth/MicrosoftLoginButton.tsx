import React, { useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";

interface MicrosoftLoginButtonProps {
  onLoginSuccess?: () => void;
  className?: string;
}

export const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({
  onLoginSuccess,
  className = "",
}) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response) {
        onLoginSuccess?.();
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with Microsoft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await instance.logoutPopup();
    } catch (err) {
      console.error("Logout failed:", err);
      setError(err instanceof Error ? err.message : "Failed to sign out from Microsoft");
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = accounts.length > 0 ? accounts[0].name : "User";

  if (isAuthenticated && accounts.length > 0) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <span className="text-sm font-medium text-foreground">{displayName}</span>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            "Sign out"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${className}`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6v-11.4H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
            </svg>
            <span>Sign in with Microsoft</span>
          </>
        )}
      </button>
      {error && (
        <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default MicrosoftLoginButton;
