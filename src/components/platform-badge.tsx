"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { chartColors } from "@/lib/chart-colors";

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    facebook: { label: "Facebook", bg: "bg-blue-600", text: "text-white" },
    instagram: { label: "Instagram", bg: "bg-pink-600", text: "text-white" }, // Use solid color for better light mode contrast
    youtube: { label: "YouTube", bg: "bg-red-600", text: "text-white" },
    meta_ads: { label: "Meta Ads", bg: "bg-blue-700", text: "text-white" },
  };

  const platformConfig = config[platform] || { label: platform, bg: "bg-gray-600", text: "text-white" };

  const { label, bg, text } = platformConfig;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", bg, text, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}

export function useColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  return {
    isDark,
    background: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
    text: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    muted: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
    card: isDark ? "hsl(222.2 84% 6%)" : "hsl(0 0% 100%)",
    border: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)",
    primary: isDark ? "hsl(217.2 91.2% 59.8%)" : "hsl(221.2 83.2% 53.3%)",
    colors: isDark ? chartColors.dark : chartColors.light,
  };
}