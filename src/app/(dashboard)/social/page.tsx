"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/platform-badge";
import { useState } from "react";
import { Plus, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

// Mock connected accounts
const connectedAccounts = [
  {
    id: "1",
    platform: "facebook" as const,
    name: "Satria Ady Chandra",
    username: "@satriaadyc",
    followers: "4,450",
    status: "active" as const,
    connectedAt: "2024-04-30",
  },
  {
    id: "2",
    platform: "instagram" as const,
    name: "kontenval.id",
    username: "@kontenval.id",
    followers: "4,100",
    status: "active" as const,
    connectedAt: "2024-04-30",
  },
  {
    id: "3",
    platform: "youtube" as const,
    name: "kontenval id",
    username: "@kontenvalid",
    followers: "2,400",
    status: "active" as const,
    connectedAt: "2024-04-30",
  },
];

const availablePlatforms = [
  { id: "twitter", name: "Twitter/X", icon: "🐦", status: "not-connected" },
  { id: "tiktok", name: "TikTok", icon: "🎵", status: "not-connected" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", status: "not-available" },
];

export default function SocialPage() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

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
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Accounts</span>
            <Badge variant="success">{connectedAccounts.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedAccounts.map((account) => (
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
                    <span className="font-medium">{account.followers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="text-muted-foreground">{account.connectedAt}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Insights
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Platform */}
      <Card>
        <CardHeader>
          <CardTitle>Connect More Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlatforms.map((platform) => (
              <div
                key={platform.id}
                className="p-4 rounded-xl border border-dashed text-center opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="text-4xl mb-3">{platform.icon}</div>
                <p className="font-medium mb-1">{platform.name}</p>
                <Badge variant={platform.status === "not-connected" ? "warning" : "secondary"}>
                  {platform.status === "not-connected" ? "Available" : platform.status}
                </Badge>
                {platform.status === "not-connected" ? (
                  <Button size="sm" className="w-full mt-3">
                    <Plus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {platform.status === "not-available"
                      ? "Not available in Composio"
                      : "Coming soon"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-muted-foreground mb-1">Total Followers</p>
          <p className="text-3xl font-bold">10,950</p>
          <p className="text-sm text-green-600">↑ 12.5% this week</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground mb-1">Active Platforms</p>
          <p className="text-3xl font-bold">3</p>
          <p className="text-sm text-muted-foreground">Facebook, Instagram, YouTube</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground mb-1">Last Synced</p>
          <p className="text-3xl font-bold">Just now</p>
          <p className="text-sm text-muted-foreground">Auto-sync every hour</p>
        </Card>
      </div>
    </div>
  );
}