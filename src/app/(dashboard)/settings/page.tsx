"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, Key, Link2, Shield, Check, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ meta_token: "", x_api_key: "", zernio_api_key: "" });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({ meta_token: false, x_api_key: false, zernio_api_key: false });

  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const res = await fetch("/api/user/api-keys");
        if (res.ok) {
          const data = await res.json();
          if (data.keys) setApiKeys(data.keys);
        }
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchApiKeys();
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

  const toggleShowKey = (field: string) => setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));

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
          <h1 className="text-3xl font-bold flex items-center gap-3"><Key className="w-8 h-8" />Settings</h1>
          <p className="text-muted-foreground mt-1">Kelola API keys untuk integrasi platform media sosial</p>
        </div>

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
                {isAdmin && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">Admin</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">API Keys</h3>
              <p className="text-sm text-muted-foreground">Input API keys untuk platform yang ingin diintegrasikan</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Meta Graph API Token
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">Facebook/Instagram Ads</span>
              </label>
              <div className="relative">
                <input type={showKeys.meta_token ? "text" : "password"} value={apiKeys.meta_token} onChange={(e) => setApiKeys({ ...apiKeys, meta_token: e.target.value })} placeholder="Masukkan Meta Access Token..." className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm" />
                <button type="button" onClick={() => toggleShowKey("meta_token")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showKeys.meta_token ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Diperoleh dari <a href="https://developers.facebook.com/tools/explorer" target="_blank" className="text-blue-600 hover:underline">Graph API Explorer</a></p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                X (Twitter) Consumer API Key
                <span className="text-xs bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">Twitter/X</span>
              </label>
              <div className="relative">
                <input type={showKeys.x_api_key ? "text" : "password"} value={apiKeys.x_api_key} onChange={(e) => setApiKeys({ ...apiKeys, x_api_key: e.target.value })} placeholder="Masukkan X API Key..." className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm" />
                <button type="button" onClick={() => toggleShowKey("x_api_key")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showKeys.x_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Diperoleh dari <a href="https://developer.twitter.com" target="_blank" className="text-blue-600 hover:underline">Twitter Developer Portal</a></p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Zernio API Key
                <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded">TikTok</span>
              </label>
              <div className="relative">
                <input type={showKeys.zernio_api_key ? "text" : "password"} value={apiKeys.zernio_api_key} onChange={(e) => setApiKeys({ ...apiKeys, zernio_api_key: e.target.value })} placeholder="Masukkan Zernio API Key..." className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm" />
                <button type="button" onClick={() => toggleShowKey("zernio_api_key")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showKeys.zernio_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Alternatif untuk koneksi TikTok. Dapatkan dari <a href="https://zernio.com" target="_blank" className="text-blue-600 hover:underline">zernio.com</a></p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button onClick={saveApiKeys} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save API Keys"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Status Koneksi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={cn("p-3 rounded-lg border text-center", apiKeys.meta_token ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-slate-200 dark:border-slate-700")}>
              <span className={cn("text-lg font-semibold", apiKeys.meta_token ? "text-green-600 dark:text-green-400" : "text-slate-500")}>{apiKeys.meta_token ? "✓" : "✗"}</span>
              <p className="text-sm">Meta</p>
            </div>
            <div className={cn("p-3 rounded-lg border text-center", apiKeys.x_api_key ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-slate-200 dark:border-slate-700")}>
              <span className={cn("text-lg font-semibold", apiKeys.x_api_key ? "text-green-600 dark:text-green-400" : "text-slate-500")}>{apiKeys.x_api_key ? "✓" : "✗"}</span>
              <p className="text-sm">X / Twitter</p>
            </div>
            <div className={cn("p-3 rounded-lg border text-center", apiKeys.zernio_api_key ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-slate-200 dark:border-slate-700")}>
              <span className={cn("text-lg font-semibold", apiKeys.zernio_api_key ? "text-green-600 dark:text-green-400" : "text-slate-500")}>{apiKeys.zernio_api_key ? "✓" : "✗"}</span>
              <p className="text-sm">Zernio (TikTok)</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold">Cara Mendapatkan API Keys</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Untuk panduan lengkap, lihat menu <strong>Panduan</strong> di navigation bar.</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Meta:</strong> Facebook Developers → Graph API Explorer → Generate Token</li>
            <li>• <strong>X/Twitter:</strong> Developer Portal → Project → Keys & Tokens</li>
            <li>• <strong>Zernio:</strong> Daftar di <a href="https://zernio.com" target="_blank" className="text-blue-600 hover:underline">zernio.com</a> → Get API Key</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
