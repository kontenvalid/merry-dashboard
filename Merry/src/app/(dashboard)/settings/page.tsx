"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, Key, Link2, Shield, Check, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, Globe } from "lucide-react";

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
        {/* Header */}
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
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-xl text-white font-bold">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{session.user?.name}</h2>
              <p className="text-sm text-muted-foreground">{session.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Google OAuth
                </span>
                {isAdmin && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== */}
        {/* 1. COMPOSIO (TOP) */}
        {/* ==================== */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl border border-purple-500/50 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Composio 
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">WAJIB</span>
              </h3>
              <p className="text-sm text-white/80">Gratis - Koneksi social media via MCP</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Platform yang didukung:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">IG</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Instagram</p>
                  <p className="text-[10px] text-white/70">Followers, Posts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">f</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Facebook</p>
                  <p className="text-[10px] text-white/70">Page Stats</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">YT</span>
                </div>
                <div>
                  <p className="text-xs font-medium">YouTube</p>
                  <p className="text-[10px] text-white/70">Subscribers</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">GDrive</p>
                  <p className="text-[10px] text-white/70">Cloud Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">MA</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Meta Ads</p>
                  <p className="text-[10px] text-white/70">Ads Insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPOSIO API KEY INPUT - untuk konek via MCP */}
          <div className="mt-4 p-4 bg-white/10 rounded-xl space-y-3">
            <p className="text-sm font-medium">Composio API Key (MCP):</p>
            <p className="text-xs text-white/70">
              Ini adalah <strong>X Consumer API Key</strong> dari Composio - digunakan untuk koneksi via MCP.
              Bukan untuk Twitter! Buka <a href="https://app.composio.dev/settings/api-keys" target="_blank" className="underline hover:text-white">Composio Settings</a> untuk dapat API key.
            </p>
            <div className="relative">
              <input
                type={showKeys.x_api_key ? "text" : "password"}
                value={apiKeys.x_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, x_api_key: e.target.value })}
                placeholder="Masukkan Composio API Key (X Consumer API Key)..."
                className="w-full p-3 pr-12 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => toggleShowKey("x_api_key")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showKeys.x_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>


          <div className="mt-4 p-4 bg-white/10 rounded-xl">
            <p className="text-sm font-medium mb-2">Cara Setup:</p>
            <ol className="text-sm space-y-1 text-white/90">
              <li>1. Buka <a href="https://app.composio.dev" target="_blank" className="underline font-medium hover:text-white">app.composio.dev</a></li>
              <li>2. Daftar / Login dengan Google account</li>
              <li>3. Klik "Add New Connection" - pilih platform yang ingin dihubungkan</li>
              <li>4. Buka Settings → API Keys - copy <strong>X Consumer API Key</strong></li>
              <li>5. Paste di input field di atas</li>
            </ol>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
            <AlertCircle className="w-4 h-4 text-yellow-300" />
            <span>Composio <strong>gratis</strong> dengan limits tertentu. Untuk production, mungkin perlu upgrade plan.</span>
          </div>
        </div>

        {/* ==================== */}
        {/* 2. ZERNIO (MIDDLE) */}
        {/* ==================== */}
        <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl border border-pink-500/50 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Zernio API 
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">WAJIB</span>
              </h3>
              <p className="text-sm text-white/80">Berbayar - TikTok & Meta Ads</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Platform yang didukung:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">♪</span>
                </div>
                <div>
                  <p className="text-xs font-medium">TikTok</p>
                  <p className="text-[10px] text-white/70">Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">MA</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Meta Ads</p>
                  <p className="text-[10px] text-white/70">Ads Insights</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Zernio API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys.zernio_api_key ? "text" : "password"}
                  value={apiKeys.zernio_api_key}
                  onChange={(e) => setApiKeys({ ...apiKeys, zernio_api_key: e.target.value })}
                  placeholder="Masukkan Zernio API Key..."
                  className="w-full p-3 pr-12 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("zernio_api_key")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showKeys.zernio_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-white/70">
                Daftar di <a href="https://zernio.com" target="_blank" className="underline hover:text-white">zernio.com</a> → Get API Key
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
            <AlertCircle className="w-4 h-4 text-yellow-300" />
            <span>1 API key bisa konek ke <strong>semua platform</strong>. Berbayar jika lebih dari 2 akun.</span>
          </div>
        </div>

        {/* ==================== */}
        {/* 3. META TOKEN (BOTTOM) */}
        {/* ==================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Link2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Meta Graph API Token
                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">OPSIONAL</span>
              </h3>
              <p className="text-sm text-muted-foreground">Alternatif backup untuk Meta Ads (bisa pakai Composio saja)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Meta Access Token
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                  Facebook/Instagram Ads
                </span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.meta_token ? "text" : "password"}
                  value={apiKeys.meta_token}
                  onChange={(e) => setApiKeys({ ...apiKeys, meta_token: e.target.value })}
                  placeholder="Masukkan Meta Access Token..."
                  className="w-full p-3 pr-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("meta_token")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.meta_token ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Diperoleh dari <a href="https://developers.facebook.com/tools/explorer" target="_blank" className="text-blue-600 hover:underline">Graph API Explorer</a>
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300">
                <strong>Opsional:</strong> Jika sudah konek Meta Ads via Composio, token ini tidak diperlukan.
              </span>
            </div>
          </div>
        </div>



        {/* Save Button */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <button
            onClick={saveApiKeys}
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
            {saving ? "Saving..." : saved ? "Saved!" : "Save API Keys"}
          </button>
        </div>

        {/* Quick Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold">Ringkasan Integration</h3>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span><strong>Composio MCP (Gratis):</strong> Instagram, Facebook, YouTube, GDrive, Meta Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span><strong>Zernio (Berbayar):</strong> TikTok, Meta Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span><strong>Meta Token (Opsional):</strong> Backup untuk Meta Ads</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Untuk panduan lengkap, lihat menu <strong>Panduan</strong> di navigation bar.
          </p>
        </div>
      </div>
    </div>
  );
}