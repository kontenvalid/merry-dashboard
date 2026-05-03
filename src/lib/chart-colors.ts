"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Chart color palette - vibrant and readable in both modes
export const chartColors = {
  light: {
    background: "hsl(0 0% 100%)",
    card: "hsl(0 0% 100%)",
    border: "hsl(214.3 31.8% 91.4%)",
    text: "hsl(222.2 84% 4.9%)",
    muted: "hsl(215.4 16.3% 46.9%)",
    facebook: "hsl(199 89% 48%)",
    instagram: "hsl(343 79% 55%)",
    youtube: "hsl(0 100% 50%)",
    meta: "hsl(213 94% 67%)",
    success: "hsl(142 71% 45%)",
    warning: "hsl(38 92% 50%)",
    info: "hsl(199 89% 48%)",
    purple: "hsl(270 60% 55%)",
    orange: "hsl(25 95% 55%)",
    pink: "hsl(330 80% 60%)",
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    card: "hsl(222.2 84% 6%)",
    border: "hsl(217.2 32.6% 17.5%)",
    text: "hsl(210 40% 98%)",
    muted: "hsl(215 20.2% 65.1%)",
    facebook: "hsl(199 89% 60%)",
    instagram: "hsl(343 79% 65%)",
    youtube: "hsl(0 100% 60%)",
    meta: "hsl(213 94% 70%)",
    success: "hsl(142 71% 55%)",
    warning: "hsl(38 92% 55%)",
    info: "hsl(199 89% 60%)",
    purple: "hsl(270 60% 65%)",
    orange: "hsl(25 95% 60%)",
    pink: "hsl(330 80% 65%)",
  },
};

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === "dark" ? chartColors.dark : chartColors.light;
  return colors;
}

// Stat card colors
export const statColors = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
  { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
];

// Platform icons and colors
export const platformConfig = {
  facebook: {
    color: "bg-blue-600",
    textColor: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-blue-700",
    chartColor: "hsl(199 89% 48%)",
  },
  instagram: {
    color: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500",
    textColor: "text-pink-600 dark:text-pink-400",
    gradient: "from-purple-500 via-pink-500 to-orange-500",
    chartColor: "hsl(343 79% 55%)",
  },
  youtube: {
    color: "bg-red-600",
    textColor: "text-red-600 dark:text-red-400",
    gradient: "from-red-500 to-red-700",
    chartColor: "hsl(0 100% 50%)",
  },
  meta_ads: {
    color: "bg-blue-700",
    textColor: "text-blue-700 dark:text-blue-300",
    gradient: "from-blue-600 to-blue-800",
    chartColor: "hsl(213 94% 67%)",
  },
};
