"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal, LogOut, Settings, User } from "lucide-react";

interface DropdownProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DropdownContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

function Dropdown({ trigger, children, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={cn("relative inline-block", className)}>
        {trigger && (
          <div onClick={() => setOpen(!open)} className="cursor-pointer">
            {trigger}
          </div>
        )}
        {open && (
          <div className="absolute right-0 z-50 mt-2 min-w-[8rem] overflow-hidden rounded-lg border bg-card shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="p-1">
              {children}
            </div>
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  danger?: boolean;
}

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ className, icon, danger, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-accent focus:bg-accent",
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </div>
  )
);
DropdownItem.displayName = "DropdownItem";

const DropdownSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  )
);
DropdownSeparator.displayName = "DropdownSeparator";

export { Dropdown, DropdownItem, DropdownSeparator };

// Quick trigger with icon
export function QuickDropdown({ children }: { children: React.ReactNode }) {
  return (
    <Dropdown
      trigger={
        <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
    >
      {children}
    </Dropdown>
  );
}

// User menu dropdown preset
export function UserMenuDropdown({ onSignOut }: { onSignOut?: () => void }) {
  return (
    <Dropdown
      trigger={
        <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
    >
      <DropdownItem icon={<Settings className="w-4 h-4" />}>Settings</DropdownItem>
      <DropdownItem icon={<User className="w-4 h-4" />}>Profile</DropdownItem>
      <DropdownSeparator />
      <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={onSignOut}>
        Sign Out
      </DropdownItem>
    </Dropdown>
  );
}