"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/platform-badge";
import { Loader2 } from "lucide-react";
import { Plus, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

interface ConnectedAccount {
  id: string;
  platform: "facebook" | "instagram" | "youtube";
  name: string;
  username: string;
  followers: number | null;
  status: "active" | "inactive";
  connectedAt: string;
  link: string;
}

interface OverviewResponse {
  success?: boolean;
  data?: {
    facebook?: {
      connected?: boolean;
      name?: string;
      handle?: string;
      followers?: number;
      posts?: { reach?: number };
      engagement?: { likes?: number };
      link?: string;
    };
    instagram?: {
      connected?: boolean;
      name?: string;
      handle?: string;
      followers?: number;
      followers_count?: number;
      mediaCount?: number;
      engagement?: { likes?: number; comments?: number };
      link?: string;
    };
    youtube?: {
      connected?: boolean;
      name?: string;
      handle?: string;
      subscribers?: number;
      videoCount?: number;
      viewCount?: number;
      link?: string;
    };
  };
}

// Safe number display
const displayNumber = (value: number | undefined | null, format: 'compact' | 'full' = 'full'): string => {
  if (value === undefined || value === null) return '-';
  if (format === 'compact') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export default function SocialPage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/composio/overview');
      if (response.ok) {
        const data: OverviewResponse = await response.json();
        const accountsData = extractAccounts(data);
        setAccounts(accountsData);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const extractAccounts = (data: OverviewResponse): ConnectedAccount[] => {
    const accounts: ConnectedAccount[] = [];
    const d = data?.data;

    // Facebook
    if (d?.facebook?.connected) {
      accounts.push({
        id: 'facebook',
        platform: 'facebook',
        name: d.facebook.name || 'Facebook Page',
        username: d.facebook.handle || '@kontenval.id',
        followers: d.facebook.followers ?? null,
        status: 'active',
        connectedAt: '2024-04-30',
        link: d.facebook.link || 'https://www.facebook.com/kontenval.id'
      });
    }

    // Instagram - check both followers and followers_count
    if (d?.instagram?.connected) {
      accounts.push({
        id: 'instagram',
        platform: 'instagram',
        name: d.instagram.name || 'Instagram',
        username: d.instagram.handle || '@kontenval.id',
        followers: d.instagram.followers ?? d.instagram.followers_count ?? null,
        status: 'active',
        connectedAt: '2024-04-30',
        link: d.instagram.link || 'https://instagram.com/kontenval.id'
      });
    }

    // YouTube
    if (d?.youtube?.connected) {
      accounts.push({
        id: 'youtube',
        platform: 'youtube',
        name: d.youtube.name || 'YouTube Channel',
        username: d.youtube.handle || '@kontenvalid',
        followers: d.youtube.subscribers ?? null,
        status: 'active',
        connectedAt: '2024-04-30',
        link: d.youtube.link || 'https://youtube.com/@kontenvalid'
      });
    }

    return accounts;
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/composio/overview');
      if (response.ok) {
        const data: OverviewResponse = await response.json();
        const accountsData = extractAccounts(data);
        setAccounts(accountsData);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Social Media</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connected platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-sm text-muted-foreground">
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Accounts</span>
            <Badge variant="success">{accounts.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <PlatformBadge platform={account.platform} />
                  {account.status === "active" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar fallback={account.name.charAt(0)} size="lg" />
                  <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.username}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">
                      {account.followers !== null ? displayNumber(account.followers) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="font-medium">{account.connectedAt}</span>
                  </div>
                </div>
                <a 
                  href={account.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
          
          {accounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No connected accounts found</p>
              <p className="text-sm">Connect your social media accounts in Settings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Available Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "twitter", name: "Twitter/X", color: "from-gray-600 to-gray-900", connected: false },
              { id: "tiktok", name: "TikTok", color: "from-pink-500 to-cyan-400", connected: false },
              { id: "linkedin", name: "LinkedIn", color: "from-blue-600 to-blue-800", connected: false },
            ].map((platform) => (
              <div
                key={platform.id}
                className="p-4 rounded-xl border border-dashed bg-muted/30 text-center"
              >
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${platform.color}`}>
                  <span className="w-3 h-3 rounded-full bg-white/80" />
                </div>
                <p className="font-medium text-foreground">{platform.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {platform.connected ? "Connected" : "Not connected"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connect New Account */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Plus className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect New Platform</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Connect more social media accounts to see all your analytics in one place.
          </p>
          <Button>
            Connect Platform
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}