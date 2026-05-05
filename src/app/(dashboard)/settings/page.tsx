"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  User, Mail, Shield, Bell, Palette, 
  Globe, Clock, Key, Save, CheckCircle,
  Eye, EyeOff, AlertCircle, KeyRound, Link2, RefreshCw, ExternalLink
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [generatingMcp, setGeneratingMcp] = useState(false);

  // Composio API Key state
  const [consumerApiKey, setConsumerApiKey] = useState("")
  const [consumerApiKeySet, setConsumerApiKeySet] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Meta Access Token state
  const [metaAccessToken, setMetaAccessToken] = useState("")
  const [metaAccessTokenSet, setMetaAccessTokenSet] = useState(false)
  const [showMetaToken, setShowMetaToken] = useState(false)
  const [testingMetaToken, setTestingMetaToken] = useState(false)
  const [metaTokenStatus, setMetaTokenStatus] = useState<{valid: boolean; expires_at?: string; error?: string} | null>(null)
  
  const [mcpUrl, setMcpUrl] = useState<string | null>(null)
  const [mcpHeaders, setMcpHeaders] = useState<Record<string, string>>({})
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [showMcpUrl, setShowMcpUrl] = useState(false)

  const [profile, setProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
  });

  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 60,
  });

  // Check if admin
  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  // Helper to get sync interval display text
  const getSyncIntervalText = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    if (minutes === 60) return 'Every hour'
    if (minutes === 360) return 'Every 6 hours'
    if (minutes === 720) return 'Every 12 hours'
    if (minutes === 1440) return 'Daily (24 hours)'
    return `${minutes} minutes`
  };

  // Fetch Consumer API Key status from server
  const fetchConsumerApiKeyStatus = async () => {
    try {
      const res = await fetch('/api/composio/consumer-key');
      if (res.ok) {
        const data = await res.json();
        setConsumerApiKeySet(data.hasKey || false);
        
        // If key exists, also try to get MCP URL
        if (data.hasKey) {
          fetchMcpUrl();
        }
      }
    } catch (err) {
      console.error('Consumer API key status error:', err);
    }
  };

  // Fetch MCP URL if API key exists
  const fetchMcpUrl = async () => {
    try {
      const res = await fetch('/api/composio/mcp-url');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.mcpUrl) {
          setMcpUrl(data.mcpUrl);
          setMcpHeaders(data.mcpHeaders || {});
        }
      }
    } catch (err) {
      console.error('MCP URL fetch error:', err);
    }
  };

  // Save Consumer API Key
  const saveConsumerApiKey = async () => {
    if (!consumerApiKey.trim()) {
      setError("Please enter your Consumer API Key");
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      const res = await fetch('/api/composio/consumer-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumerApiKey: consumerApiKey.trim() })
      });

      if (res.ok) {
        setConsumerApiKeySet(true);
        setSaved(true);
        
        // Generate MCP URL after saving API key
        await generateMcpUrl();
        
        // Also update sync settings
        await handleSave();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save API key');
      }
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  // Remove Consumer API Key
  const removeConsumerApiKey = async () => {
    try {
      setSaving(true);
      
      const res = await fetch('/api/composio/consumer-key', {
        method: 'DELETE'
      });

      if (res.ok) {
        setConsumerApiKeySet(false);
        setConsumerApiKey("");
        setMcpUrl(null);
        setMcpHeaders({});
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  // Connect to Composio with consumer API key as header
  const connectToComposio = async () => {
    if (!consumerApiKey.trim()) {
      setError("Please enter your x-consumer-api-key first")
      return
    }

    try {
      setConnecting(true)
      setError("")
      setConnectionResult(null)

      // Call our API with the consumer API key
      // The API will use this to connect to Composio MCP
      const res = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumerApiKey: consumerApiKey.trim() })
      })

      const data = await res.json()

      if (data.success) {
        setConnectionResult(data)
        
        // If we got an MCP URL, save it
        if (data.mcpUrl) {
          setMcpUrl(data.mcpUrl)
          setMcpHeaders(data.headers || {})
        }
        
        // If there's a redirect URL, open it
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank')
        }
        
        setSaved(true)
        setTimeout(() => setSaved(false), 5000)
      } else {
        setError(data.message || data.error || 'Failed to connect')
        if (data.instructions) {
          setError(`${data.message}. ${data.instructions.step1}`)
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setConnecting(false)
    }
  };

  // Generate MCP URL after API key is saved
  const generateMcpUrl = async () => {
    try {
      setGeneratingMcp(true);
      setError("");
      
      const res = await fetch('/api/composio/mcp-url');
      const data = await res.json();
      
      if (data.success && data.mcpUrl) {
        setMcpUrl(data.mcpUrl);
        setMcpHeaders(data.mcpHeaders || {});
        setSaved(true);
      } else if (data.fallback) {
        setError('Please setup MCP server manually at platform.composio.dev');
        setSaved(true);
      } else {
        setError(data.error || 'Failed to generate MCP URL');
      }
    } catch (err) {
      setError('Failed to generate MCP URL');
    } finally {
      setGeneratingMcp(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Test and Save Meta Access Token
  const testMetaToken = async () => {
    if (!metaAccessToken.trim()) {
      setError("Please enter your Meta access token");
      return;
    }

    try {
      setTestingMetaToken(true);
      setError("");

      // Verify token with Meta/Facebook debug API
      const debugRes = await fetch(
        `https://graph.facebook.com/v18.0/debug_token?input_token=${metaAccessToken}&access_token=${metaAccessToken}`
      );
      const debugData = await debugRes.json();

      if (debugData.data?.is_valid) {
        // Token is valid - calculate expiry date
        const expiresAt = debugData.data.expires_at;
        const expiryDate = new Date(expiresAt * 1000).toLocaleDateString();
        
        setMetaTokenStatus({ valid: true, expires_at: expiryDate });
        setMetaAccessTokenSet(true);
        setSaved(true);
        
        // Save to server
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metaAccessToken: metaAccessToken.trim() })
        });
        
        setTimeout(() => setSaved(false), 3000);
      } else {
        setMetaTokenStatus({ 
          valid: false, 
          error: debugData.error?.message || 'Token is invalid or expired' 
        });
        setError('Meta token is invalid or expired');
      }
    } catch (err) {
      setMetaTokenStatus({ valid: false, error: 'Failed to verify token' });
      setError('Failed to verify Meta token');
    } finally {
      setTestingMetaToken(false);
    }
  };

  // Check API key status on mount
  useEffect(() => {
    if (session?.user) {
      fetchConsumerApiKeyStatus();
    }
  }, [session]);

  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setConsumerApiKeySet(!!data.settings.composioApiKey);
            setSyncSettings({
              autoSync: data.settings.autoSync ?? true,
              syncInterval: data.settings.syncInterval ?? 60,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Composio API key is now handled server-side via environment variable
          ...syncSettings,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaving(false);
      setError("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and dashboard settings
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Integrations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Composio API Key */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <KeyRound className="w-5 h-5 text-blue-600" />
                Composio Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your Composio Consumer API Key to enable social media monitoring and Meta Ads integration.
                You can find this key in your Composio dashboard under Settings → API Keys.
              </p>
              
              {!consumerApiKeySet ? (
                // Input mode - user enters API key
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Consumer API Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your x-consumer-api-key"
                        value={consumerApiKey}
                        onChange={(e) => setConsumerApiKey(e.target.value)}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={connectToComposio}
                    disabled={connecting || !consumerApiKey.trim()}
                    className="w-full"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {connecting ? 'Connecting...' : 'Connect to Composio'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your API key will be sent as x-consumer-api-key header
                  </p>
                </div>
              ) : (
                // Connected mode - show status, MCP URL and headers
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-foreground">Consumer API Key configured</span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant="success" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sync Interval:</span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">{getSyncIntervalText(syncSettings.syncInterval)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Auto Sync:</span>
                      <span className={`text-xs font-medium ${syncSettings.autoSync ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {syncSettings.autoSync ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Composio Status:</span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">● Active</span>
                    </div>
                  </div>
                  
                  {/* Connection Result / MCP URL Section */}
                  {connectionResult && connectionResult.mcpUrl ? (
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Your MCP URL (use with header below)
                      </p>
                      <div className="relative">
                        <Input
                          type={showMcpUrl ? "text" : "password"}
                          value={connectionResult.mcpUrl}
                          readOnly
                          className="pr-10 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMcpUrl(!showMcpUrl)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showMcpUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Headers for MCP client - CRITICAL */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          ⚠️ Required Header for MCP Connection:
                        </p>
                        <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                          <div><span className="text-muted-foreground">x-consumer-api-key:</span> <span className="text-foreground font-bold">{consumerApiKey.substring(0, 10)}...{consumerApiKey.substring(consumerApiKey.length - 4)}</span></div>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Include this header when connecting via Claude Desktop, Cursor, or Codex
                        </p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={connectToComposio}
                        disabled={connecting}
                        className="w-full"
                      >
                        <RefreshCw className={`w-3 h-3 mr-2 ${connecting ? 'animate-spin' : ''}`} />
                        Reconnect to Composio
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t pt-3">
                      <Button 
                        onClick={connectToComposio}
                        disabled={connecting}
                        className="w-full"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {connecting ? 'Connecting to Composio...' : 'Get MCP URL'}
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setConsumerApiKeySet(false)}
                      className="flex-1"
                    >
                      Update Key
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={removeConsumerApiKey}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Sync Info */}
              <div className="pt-3 border-t">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Data syncs every hour via cron job. For real-time updates, you'll need Composio Triggers configured.</span>
                </div>
              </div>

              {/* Meta Access Token */}
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Key className="w-5 h-5 text-purple-600" />
                    Meta Ads Access Token (Direct Graph API)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your Meta (Facebook) User Access Token to fetch real ad data. 
                    Get a long-lived token (60 days) from Graph API Explorer.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">How to get your token:</p>
                    <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="underline">Graph API Explorer</a></li>
                      <li>Select app "Merry App" and generate token</li>
                      <li>Add permissions: ads_management, ads_read, pages_read_engagement</li>
                      <li>Exchange short-lived token to long-lived</li>
                      <li>Copy and paste the long-lived token below</li>
                    </ol>
                    <p className="text-xs text-blue-500 mt-2">
                      Your token: EAAYO8KU9nKg...ZDZD (59 days remaining)
                    </p>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type={showMetaToken ? "text" : "password"}
                      placeholder="Paste your long-lived Meta access token here"
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMetaToken(!showMetaToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={testMetaToken}
                      disabled={testingMetaToken || !metaAccessToken.trim()}
                      variant="outline"
                    >
                      {testingMetaToken ? 'Testing...' : 'Test & Save Token'}
                    </Button>
                  </div>
                  
                  {/* Token Status */}
                  {metaTokenStatus && (
                    <div className={`p-3 rounded-lg ${metaTokenStatus.valid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                      {metaTokenStatus.valid ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Token valid! Expires: {metaTokenStatus.expires_at}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{metaTokenStatus.error || 'Invalid token'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Current token status */}
                  {metaAccessTokenSet && !metaAccessToken && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Meta token configured</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connected Platforms Status */}
              <div className="pt-4 border-t space-y-3">
                <p className="font-medium text-sm text-foreground">Connected Platforms</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Facebook - Blue */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">Facebook</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  {/* Instagram - Pink gradient */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                      <span className="text-sm text-pink-700 dark:text-pink-300">Instagram</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  {/* YouTube - Red */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-300">YouTube</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  {/* Meta Ads via Graph API - Purple */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-purple-700 dark:text-purple-300">Meta Ads (Graph API)</span>
                    </div>
                    <Badge variant="success" className="text-xs">Direct</Badge>
                  </div>
                  {/* Meta Ads via Composio - Amber */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">Meta Ads (Composio)</span>
                    </div>
                    <Badge variant="warning" className="text-xs">Reconnect</Badge>
                  </div>
                </div>
                
                {/* Connection Info */}
                <div className="bg-muted/30 dark:bg-muted/10 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Connection Methods:</p>
                  <ul className="space-y-1">
                    <li><span className="text-purple-600">●</span> <strong>Graph API Direct:</strong> User token (59 days) → real-time data</li>
                    <li><span className="text-amber-600">●</span> <strong>Composio:</strong> Via app.composio.dev integration</li>
                  </ul>
                </div>
              </div>

              {/* Meta Ads Long-Lived Token Instructions */}
              <div className="pt-4 border-t">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Meta Ads Token Expired
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                    Meta Ads requires a long-lived access token (60 days) to stay connected. 
                    Here's how to get one that lasts longer:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Option 1: Exchange for Long-Lived Token (Recommended)</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Go to <a href="https://business.facebook.com" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">business.facebook.com</a></li>
                      <li>Navigate to Settings → Business Settings</li>
                      <li>Select your app under Users → Assets</li>
                      <li>Click "Generate Token" for your ad account</li>
                      <li>Use Graph API to extend token: <code className="text-xs bg-muted px-1 rounded">GET /oauth/access_token?grant_type=fb_exchange_token&fb_exchange_token=SHORT_LIVED_TOKEN&client_id=APP_ID&client_secret=APP_SECRET</code></li>
                    </ol>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700">
                    <p className="font-medium text-sm mb-2">Option 2: Use Composio Native Integration</p>
                    <p className="text-xs text-muted-foreground">
                      In Composio dashboard, reconnect Meta Ads using OAuth flow. 
                      Composio handles token refresh automatically if you have a paid plan.
                    </p>
                    <a 
                      href="https://dashboard.composio.dev/YOUR_WORKSPACE/~/connect/apps/metaads" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      Open Composio Meta Ads <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Replace YOUR_WORKSPACE with your Composio workspace name
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700">
                    <p className="font-medium text-sm mb-2">Option 3: Permanent System User Token</p>
                    <p className="text-xs text-muted-foreground">
                      For production, create a Meta System User with permanent access to ad accounts. 
                      This doesn't expire but requires Business Verification.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCwIcon className="w-5 h-5" />
                Auto Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data from all connected platforms
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={syncSettings.autoSync}
                  onChange={(e) => setSyncSettings({...syncSettings, autoSync: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
              {syncSettings.autoSync && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Sync Interval</label>
                  <select 
                    className="w-full p-2 rounded-lg border bg-background"
                    value={syncSettings.syncInterval}
                    onChange={(e) => setSyncSettings({...syncSettings, syncInterval: Number(e.target.value)})}
                  >
                    <option value={60}>Every hour</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Daily (24 hours)</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar 
                  src={session?.user?.image || ""} 
                  fallback={session?.user?.name?.charAt(0) || "U"}
                  size="xl"
                />
                <div>
                  <p className="font-semibold">{session?.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Photo
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <Input 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input 
                    value={profile.email}
                    placeholder="your@email.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email managed via Google OAuth
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.email}
                  onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.push}
                  onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Receive weekly performance summary</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.weekly}
                  onChange={(e) => setNotifications({...notifications, weekly: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Managed via Google OAuth</p>
                </div>
                <Badge variant="secondary">Not Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Managed via Google OAuth</p>
                </div>
                <Badge variant="secondary">Not Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Google Account</p>
                  <p className="text-sm text-muted-foreground">Connected via OAuth</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Settings */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <select className="w-full p-2 rounded-lg border bg-background">
                  <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <select className="w-full p-2 rounded-lg border bg-background">
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Role</span>
                <Badge variant={isAdmin ? "destructive" : "secondary"}>
                  {isAdmin ? "Admin" : "Member"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Auth Method</span>
                <Badge variant="secondary">Google OAuth</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Access</span>
                <Badge variant="success">Full</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 sticky bottom-4">
        {saved && (
          <span className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Saved!
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Simple RefreshCw icon component
function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
      />
    </svg>
  );
}
