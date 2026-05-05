"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }> | React.ReactNode;
  iconClass?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  textClass?: string;
  borderClass?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass = "w-6 h-6",
  trend,
  colorClass = "bg-blue-100 dark:bg-blue-900/30",
  textClass = "text-blue-600 dark:text-blue-400",
  borderClass = "border-blue-200 dark:border-blue-800",
}: StatCardProps) {
  // Check if icon is a React element (old format with JSX) or component (new format)
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's a React element (like <DollarSign />), render it directly
    if (typeof icon === 'object' && icon !== null && 'type' in icon) {
      return icon;
    }
    
    // If it's a function (LucideIcon component), call it with className
    if (typeof icon === 'function') {
      const IconComponent = icon as ComponentType<{ className?: string }>;
      return <IconComponent className={cn(iconClass, textClass)} />;
    }
    
    return null;
  };

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
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", colorClass)}>
          {renderIcon()}
        </div>
      </div>
    </div>
  );
}