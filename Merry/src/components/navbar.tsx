"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Shield,
  Settings,
  Bug,
  LogOut,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ads", label: "Ads Manager", icon: DollarSign },
  { href: "/products", label: "Products", icon: Package },
];

const adminItems = [
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/users", label: "User Management", icon: Users },
  { href: "/roles", label: "Role Management", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/debug", label: "Debug", icon: Bug },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if user is admin (for demo, check email)
  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">Merry Dashboard</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Dropdown */}
          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  showAdminMenu || pathname.startsWith("/users") || pathname.startsWith("/roles")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:block">Admin</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdminMenu && "rotate-180")} />
              </button>

              {showAdminMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border bg-background shadow-lg py-2">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowAdminMenu(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-4" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-accent rounded-lg p-2 transition-colors"
          >
            <Avatar
              src={session?.user?.image || ""}
              fallback={session?.user?.name?.charAt(0) || "U"}
              size="sm"
            />
            <span className="text-sm font-medium hidden sm:block">
              {session?.user?.name?.split(" ")[0] || "User"}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showUserMenu && "rotate-180")} />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-lg border bg-background shadow-lg py-2">
              <div className="px-4 py-3 border-b">
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                <Badge variant={isAdmin ? "destructive" : "secondary"} className="mt-2">
                  {isAdmin ? "Admin" : "Member"}
                </Badge>
              </div>
              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent w-full text-left text-red-500"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="ml-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}