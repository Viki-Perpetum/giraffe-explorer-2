import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GradientAvatar } from "@/components/GradientAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import perpetumLogo from "@/assets/perpetum-logo-white.svg";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
];

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <img src={perpetumLogo} alt="PerPetum Energy" className="h-7" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-primary-foreground border-l-[3px] border-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary-foreground hover:translate-x-0.5"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-5 py-3 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-[11px] font-semibold text-sidebar-muted tracking-wider uppercase">Theme</span>
        <ThemeToggle />
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <GradientAvatar name={displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-foreground truncate">
              {displayName}
            </p>
            <button
              onClick={handleSignOut}
              className="text-xs text-sidebar-muted hover:text-sidebar-primary transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground lg:hidden shadow-card-hover"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[220px] flex-shrink-0 transition-transform duration-200",
          "bg-sidebar border-r border-sidebar-border",
          "lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 text-sidebar-foreground lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
