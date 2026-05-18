"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, User, Palette, Bell, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  notifications: boolean;
}

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "Indonesia (WIB) - UTC+7" },
  { value: "Asia/Makassar", label: "Indonesia (WITA) - UTC+8" },
  { value: "Asia/Jayapura", label: "Indonesia (WIT) - UTC+9" },
  { value: "UTC", label: "UTC" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    language: "en",
    timezone: "Asia/Jakarta",
    notifications: true,
  });

  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings({
              theme: data.settings.theme || "system",
              language: data.settings.language || "en",
              timezone: data.settings.timezone || "Asia/Jakarta",
              notifications: data.settings.notifications ?? true,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSettings();
    }
  }, [session]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        if (settings.theme !== "system") {
          document.documentElement.classList.toggle("dark", settings.theme === "dark");
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{session.user?.name}</h2>
              <p className="text-muted-foreground">{session.user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {isAdmin && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Google OAuth
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground">Customize how the dashboard looks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {["light", "dark", "system"].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSettings({ ...settings, theme })}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center",
                      settings.theme === theme
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <span className="text-lg mb-1 block">
                      {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
                    </span>
                    <span className="text-sm capitalize">{theme}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about your social media</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                settings.notifications ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  settings.notifications ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Connected Account */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">Connected Account</h3>
              <p className="text-sm text-muted-foreground">Your login method</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-6 h-6"
            />
            <div className="flex-1">
              <p className="font-medium">Google Account</p>
              <p className="text-sm text-muted-foreground">{session.user?.email}</p>
            </div>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Connected
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">Admin Panel</h3>
                <p className="text-sm text-muted-foreground">Manage users and system settings</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a
                href="/users"
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">View and manage users</p>
              </a>
              <a
                href="/debug"
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <p className="font-medium">Debug Panel</p>
                <p className="text-sm text-muted-foreground">System diagnostics</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}