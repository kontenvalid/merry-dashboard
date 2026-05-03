"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorClass = "bg-blue-100 dark:bg-blue-900/30",
  textClass = "text-blue-600 dark:text-blue-400",
  borderClass = "border-blue-200 dark:border-blue-800",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md",
        borderClass
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", colorClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
