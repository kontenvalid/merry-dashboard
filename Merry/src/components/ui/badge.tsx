import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "primary";
}

const variantClasses = {
  // Light mode
  default: "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground",
  primary: "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground dark:bg-secondary dark:text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground",
  outline: "border border-input bg-transparent text-foreground dark:border-muted-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
