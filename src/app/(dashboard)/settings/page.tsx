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
    if (minutes === 60) return 'Hourly (via cron)'
    if (minutes === 180) return 'Every 3 hours'
    if (minutes === 360) return 'Every 6 hours'
    if (minutes === 720) return 'Every 12 hours'
    if (minutes === 1440) return 'Daily'
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
        // Manual setup required
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
              <CardTitle className="flex items-center gap-2">
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
                <div className="space-y-3">
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
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Consumer API Key configured</span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant="success" className="text-xs">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sync:</span>
                      <span className="text-xs">{getSyncIntervalText(syncSettings.syncInterval)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Auto Sync:</span>
                      <span className="text-xs">{syncSettings.autoSync ? 'Enabled' : 'Disabled'}</span>
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

              {/* Connected Platforms Status */}
              <div className="pt-4 border-t space-y-3">
                <p className="font-medium text-sm">Connected Platforms</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Facebook</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Instagram</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">YouTube</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Meta Ads</span>
                    </div>
                    <Badge variant="success" className="text-xs">Active</Badge>
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
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={360}>Every 6 hours</option>
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
