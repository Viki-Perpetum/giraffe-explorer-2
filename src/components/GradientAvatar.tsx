import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-brand-blue to-teal",
  "from-teal to-brand-green",
  "from-brand-blue to-brand-green",
  "from-yellow-accent to-orange-accent",
  "from-domain-marketing to-brand-blue",
  "from-domain-finance to-teal",
  "from-orange-accent to-destructive",
  "from-cyan to-brand-blue",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

interface GradientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function GradientAvatar({ name, size = "sm", className }: GradientAvatarProps) {
  const idx = hashString(name) % GRADIENTS.length;
  const initials = name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white shadow-sm",
        GRADIENTS[idx],
        sizeClasses[size],
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}
