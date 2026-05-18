"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, Key, Link2, Shield, Check, Eye, EyeOff, AlertCircle, Zap, Globe } from "lucide-react";

interface ApiKeys {
  meta_token: string;
  x_api_key: string;
  zernio_api_key: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    meta_token: "",
    x_api_key: "",
    zernio_api_key: "",
  });
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    meta_token: false,
    x_api_key: false,
    zernio_api_key: false,
  });

  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const res = await fetch("/api/user/api-keys");
        if (res.ok) {
          const data = await res.json();
          if (data.keys) {
            setApiKeys({
              meta_token: data.keys.meta_token || "",
              x_api_key: data.keys.x_api_key || "",
              zernio_api_key: data.keys.zernio_api_key || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchApiKeys();
    }
  }, [session]);

  const saveApiKeys = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKeys),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save API keys:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Key className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola API keys untuk integrasi platform media sosial
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            {session.user?.image ? (
              <img src={session.user.image} alt={session.user.name || "User"} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-xl text-white font-bold">{session.user?.name?.charAt(0) || "U"}</span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{session.user?.name}</h2>
              <p className="text-sm text-muted-foreground">{session.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />Google OAuth
                </span>
                {isAdmin && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 1. COMPOSIO (TOP) */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl border border-purple-500/50 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><Zap className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Composio <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">WAJIB</span>
              </h3>
              <p className="text-sm text-white/80">Gratis - Koneksi social media</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Platform: Instagram, Facebook, YouTube, GDrive, Meta Ads</p>
          </div>
          <div className="mt-4 p-4 bg-white/10 rounded-xl text-sm">
            <p className="mb-2">Cara Setup:</p>
            <ol className="space-y-1 text-white/90">
              <li>1. Buka <a href="https://app.composio.dev" target="_blank" className="underline">app.composio.dev</a></li>
              <li>2. Daftar / Login dengan Google</li>
              <li>3. Klik "Add New Connection"</li>
              <li>4. Pilih platform satu per satu</li>
            </ol>
          </div>
        </div>

        {/* 2. ZERNIO (MIDDLE) */}
        <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl border border-pink-500/50 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><Zap className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Zernio API <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">WAJIB</span>
              </h3>
              <p className="text-sm text-white/80">Berbayar - TikTok & Meta Ads</p>
            </div>
          </div>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Zernio API Key</label>
              <div className="relative">
                <input
                  type={showKeys.zernio_api_key ? "text" : "password"}
                  value={apiKeys.zernio_api_key}
                  onChange={(e) => setApiKeys({ ...apiKeys, zernio_api_key: e.target.value })}
                  placeholder="Masukkan Zernio API Key..."
                  className="w-full p-3 pr-12 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 font-mono text-sm"
                />
                <button type="button" onClick={() => toggleShowKey("zernio_api_key")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                  {showKeys.zernio_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-white/70">Daftar di <a href="https://zernio.com" target="_blank" className="underline">zernio.com</a></p>
            </div>
          </div>
        </div>

        {/* 3. META TOKEN (BOTTOM) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Link2 className="w-5 h-5 text-slate-600" /></div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Meta Graph API Token <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">OPSIONAL</span>
              </h3>
              <p className="text-sm text-muted-foreground">Alternatif backup untuk Meta Ads</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Meta Access Token</label>
            <div className="relative">
              <input
                type={showKeys.meta_token ? "text" : "password"}
                value={apiKeys.meta_token}
                onChange={(e) => setApiKeys({ ...apiKeys, meta_token: e.target.value })}
                placeholder="Masukkan Meta Access Token..."
                className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <button type="button" onClick={() => toggleShowKey("meta_token")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showKeys.meta_token ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 4. X API (NEW) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><span className="text-lg font-bold">𝕏</span></div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                X (Twitter) Consumer API <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">OPSIONAL</span>
              </h3>
              <p className="text-sm text-muted-foreground">Integrasi X/Twitter analytics</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">X Consumer API Key</label>
            <div className="relative">
              <input
                type={showKeys.x_api_key ? "text" : "password"}
                value={apiKeys.x_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, x_api_key: e.target.value })}
                placeholder="Masukkan X Consumer API Key..."
                className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <button type="button" onClick={() => toggleShowKey("x_api_key")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showKeys.x_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Diperoleh dari <a href="https://developer.twitter.com" target="_blank" className="text-blue-600 hover:underline">Twitter Developer Portal</a>
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6">
          <button onClick={saveApiKeys} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save API Keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
