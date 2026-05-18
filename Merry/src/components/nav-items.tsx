import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
} from "lucide-react";

// 2024-05-18: Added Panduan menu and simplified Settings to only contain API keys

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ads", label: "Ads Manager", icon: DollarSign },
  { href: "/panduan", label: "Panduan", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const adminItems = [
  { href: "/users", label: "User Management", icon: Settings },
  { href: "/roles", label: "Role Management", icon: Settings },
  { href: "/debug", label: "Debug", icon: Settings },
];