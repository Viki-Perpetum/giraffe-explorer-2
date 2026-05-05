import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("perpetum-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("perpetum-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5",
        dark ? "bg-sidebar-accent" : "bg-sidebar-accent/60"
      )}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full bg-sidebar-primary flex items-center justify-center transition-transform duration-300",
          dark ? "translate-x-6" : "translate-x-0"
        )}
      >
        {dark ? (
          <Moon className="w-3 h-3 text-primary-foreground" />
        ) : (
          <Sun className="w-3 h-3 text-primary-foreground" />
        )}
      </div>
    </button>
  );
}
