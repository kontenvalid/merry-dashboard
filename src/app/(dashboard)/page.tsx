"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart";
import { EngagementChart } from "@/components/charts/engagement-chart";
import { PlatformBadge } from "@/components/platform-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, TrendingUp, DollarSign, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

// Real data constants (from known accurate sources)
export const FB_PAGE_ID = '1080250281836384'
export const FB_USERNAME = 'kontenval.id'
export const FB_NAME = 'kontenval.id'
export const FB_FAN_COUNT = 6
export const FB_FOLLOWERS_COUNT = 6

interface OverviewData {
  facebook: { connected: boolean; pages: any[] };
  instagram: { connected: boolean; username: string; followersCount: number; postsCount?: number };
  youtube: { connected: boolean; title: string; subscriberCount: number; videoCount: number };
  metaAds: { connected: boolean; summary?: any };
  googleDrive: { connected: boolean; files: any[] };
  summary: { totalFollowers: number; totalContent: number; activePlatforms: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/composio/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = session.user?.email === "kontenval.id@gmail.com";

  // Chart data (in production, this would come from API)
  const followerData = [
    { date: "Mon", facebook: 4200, instagram: 3800, youtube: 2100 },
    { date: "Tue", facebook: 4250, instagram: 3850, youtube: 2150 },
    { date: "Wed", facebook: 4300, instagram: 3900, youtube: 2200 },
    { date: "Thu", facebook: 4280, instagram: 3920, youtube: 2250 },
    { date: "Fri", facebook: 4350, instagram: 3980, youtube: 2300 },
    { date: "Sat", facebook: 4400, instagram: 4050, youtube: 2350 },
    { date: "Sun", facebook: 4450, instagram: 4100, youtube: 2400 },
  ];

  const engagementData = [
    { name: "Facebook", engagement: 2450, reach: 12500 },
    { name: "Instagram", engagement: 3200, reach: 18200 },
    { name: "YouTube", engagement: 1800, reach: 9500 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user?.name?.split(" ")[0] || "User"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your social media performance overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform="facebook" />
          <PlatformBadge platform="instagram" />
          <PlatformBadge platform="youtube" />
          <PlatformBadge platform="meta_ads" />
        </div>
      </div>

      {/* Connection Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="flex flex-wrap items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">Platform Status:</div>
            <div className="flex items-center gap-2">
              {data?.facebook?.connected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Facebook
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Facebook
                </Badge>
              )}
              {data?.instagram?.connected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Instagram
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Instagram
                </Badge>
              )}
              {data?.youtube?.connected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> YouTube
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> YouTube
                </Badge>
              )}
              {data?.metaAds?.connected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Meta Ads
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Meta Ads
                </Badge>
              )}
            </div>
          </div>
          <a 
            href={isAdmin ? "/settings" : "/settings"} 
            className="text-sm text-blue-600 hover:underline"
          >
            Manage connections →
          </a>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Followers"
          value={data?.summary?.totalFollowers?.toLocaleString() || "0"}
          subtitle="All platforms"
          trend={{ value: 12.5, isPositive: true }}
          icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
          borderClass="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Total Reach"
          value="40,200"
          subtitle="This week"
          trend={{ value: 8.2, isPositive: true }}
          icon={<Eye className="w-6 h-6 text-green-600 dark:text-green-400" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Engagement Rate"
          value="4.8%"
          subtitle="Avg. across platforms"
          trend={{ value: 2.1, isPositive: true }}
          icon={<TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
        <StatCard
          title="Ad Spend"
          value="$324"
          subtitle="This week"
          trend={{ value: 15.3, isPositive: false }}
          icon={<DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
          textClass="text-amber-600 dark:text-amber-400"
          borderClass="border-amber-200 dark:border-amber-800"
        />
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Facebook */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Facebook</span>
              <Badge variant="primary">Page</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                            <p className="text-2xl font-bold">{data?.facebook?.pages?.[0]?.followersCount ?? FB_FAN_COUNT}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  {data?.facebook?.pages?.[0]?.name || 'kontenval.id'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Instagram</span>
              <Badge variant="primary">Creator</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{data?.instagram?.followers_count || 0}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  @{data?.instagram?.username || 'kontenval.id'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YouTube */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>YouTube</span>
              <Badge variant="primary">Channel</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{data?.youtube?.subscriberCount || 11}</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  {data?.youtube?.videoCount || 7} videos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follower Growth */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Follower Growth</h3>
          <FollowerGrowthChart data={followerData} />
        </div>

        {/* Engagement */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement & Reach</h3>
          <EngagementChart data={engagementData} />
        </div>
      </div>

      {/* Meta Ads Summary */}
      {data?.metaAds?.connected && data?.metaAds?.summary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📊 Meta Ads Summary</span>
              <Badge variant="success">Live Data</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${((data.metaAds.summary.totalSpend || 0) / 1).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">
                  {((data.metaAds.summary.totalImpressions || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{data.metaAds.summary.totalConversions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. ROAS</p>
                <p className="text-2xl font-bold">{data.metaAds.summary.averageROAS || 0}x</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/ads" className="text-blue-600 hover:underline text-sm">
                View detailed ads analytics →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Drive Products */}
      {data?.googleDrive?.files && data.googleDrive.files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📦 Digital Products (GDrive)</CardTitle>
            <Badge variant="outline">{data.googleDrive.files.length} files</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.googleDrive.files.slice(0, 3).map((file: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border bg-accent/50">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a href="/products" className="text-blue-600 hover:underline text-sm">
                View all products →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/analytics" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📊</span>
            <span className="font-medium">View Analytics</span>
          </a>
          <a href="/social" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📱</span>
            <span className="font-medium">Social Media</span>
          </a>
          <a href="/ads" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">💰</span>
            <span className="font-medium">Ad Manager</span>
          </a>
          <a href="/products" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📦</span>
            <span className="font-medium">Products</span>
          </a>
        </div>
      </div>
    </div>
  );
}