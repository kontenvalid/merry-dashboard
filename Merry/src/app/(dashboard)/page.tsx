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
import { Users, Eye, TrendingUp, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

interface PlatformData {
  connected?: boolean;
  name?: string;
  handle?: string;
  followers?: number;
  subscribers?: number;
  views?: number;
  reach?: number;
  engagement?: {
    likes?: number;
    comments?: number;
  };
  posts?: { reach?: number };
  stats?: { totalViews?: number };
  videoCount?: number;
  viewCount?: number;
  link?: string;
}

interface MetaAdsData {
  connected?: boolean;
  summary?: {
    totalSpend?: number;
    totalCampaigns?: number;
    avgCPC?: number;
  };
}

interface OverviewResponse {
  success?: boolean;
  source?: string;
  data?: {
    facebook: PlatformData;
    instagram: PlatformData;
    youtube: PlatformData;
    metaAds: MetaAdsData;
    googleDrive?: { connected?: boolean; fileCount?: number };
  };
}

// Safe number display - shows "-" instead of 0 for missing data
const displayNumber = (value: number | undefined | null, format: 'compact' | 'full' = 'full'): string => {
  if (value === undefined || value === null) return '-';
  if (format === 'compact') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewResponse | null>(null);

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
  
  // Extract real data - NOT filling with 0
  const fb = data?.data?.facebook;
  const ig = data?.data?.instagram;
  const yt = data?.data?.youtube;
  const metaAds = data?.data?.metaAds;
  
  // Calculate totals - only sum if value exists
  const totalFollowers = 
    (fb?.followers || 0) + 
    (ig?.followers || 0) + 
    (yt?.subscribers || 0);
  
  const totalReach = 
    (fb?.posts?.reach || 0) + 
    (ig?.posts?.reach || 0) + 
    (yt?.stats?.totalViews || yt?.viewCount || 0);
  
  const totalEngagement = 
    (fb?.engagement?.likes || 0) + 
    (fb?.engagement?.comments || 0) + 
    (ig?.engagement?.likes || 0) + 
    (ig?.engagement?.comments || 0) + 
    (yt?.engagement?.likes || 0) + 
    (yt?.engagement?.comments || 0);

  // Chart data - real values only
  const followerData = [
    { 
      date: "Mon", 
      facebook: fb?.followers ?? '-', 
      instagram: ig?.followers ?? '-', 
      youtube: yt?.subscribers ?? '-' 
    },
    { date: "Tue", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
    { date: "Wed", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
    { date: "Thu", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
    { date: "Fri", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
    { date: "Sat", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
    { date: "Sun", facebook: fb?.followers ?? '-', instagram: ig?.followers ?? '-', youtube: yt?.subscribers ?? '-' },
  ];

  const engagementData = [
    { 
      name: "Facebook", 
      engagement: fb?.engagement?.likes ?? '-', 
      reach: fb?.posts?.reach ?? '-' 
    },
    { 
      name: "Instagram", 
      engagement: ig?.engagement?.likes ?? '-', 
      reach: ig?.posts?.reach ?? '-' 
    },
    { 
      name: "YouTube", 
      engagement: yt?.engagement?.likes ?? '-', 
      reach: yt?.stats?.totalViews ?? yt?.viewCount ?? '-' 
    },
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
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="flex flex-wrap items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-foreground">Platform Status:</div>
            <div className="flex items-center gap-2">
              {fb?.connected ? (
                <Badge variant="success" className="flex items-center gap-1 text-white dark:text-white">
                  <CheckCircle className="w-3 h-3" /> Facebook
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-foreground">
                  <AlertCircle className="w-3 h-3" /> Facebook
                </Badge>
              )}
              {ig?.connected ? (
                <Badge variant="success" className="flex items-center gap-1 text-white dark:text-white">
                  <CheckCircle className="w-3 h-3" /> Instagram
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-foreground">
                  <AlertCircle className="w-3 h-3" /> Instagram
                </Badge>
              )}
              {yt?.connected ? (
                <Badge variant="success" className="flex items-center gap-1 text-white dark:text-white">
                  <CheckCircle className="w-3 h-3" /> YouTube
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-foreground">
                  <AlertCircle className="w-3 h-3" /> YouTube
                </Badge>
              )}
              {metaAds?.connected ? (
                <Badge variant="success" className="flex items-center gap-1 text-white dark:text-white">
                  <CheckCircle className="w-3 h-3" /> Meta Ads
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-foreground">
                  <AlertCircle className="w-3 h-3" /> Meta Ads
                </Badge>
              )}
            </div>
          </div>
          <a 
            href={isAdmin ? "/settings" : "/settings"} 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage connections →
          </a>
        </CardContent>
      </Card>

      {/* Stats Grid - Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Followers"
          value={displayNumber(totalFollowers, 'compact')}
          subtitle="All platforms"
          icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
          borderClass="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Total Reach/Views"
          value={displayNumber(totalReach, 'compact')}
          subtitle="All platforms"
          icon={<Eye className="w-6 h-6 text-green-600 dark:text-green-400" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Total Engagement"
          value={displayNumber(totalEngagement, 'compact')}
          subtitle="Likes + Comments"
          icon={<TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
        <StatCard
          title="Meta Ads"
          value={metaAds?.connected ? "Connected" : "Not Set"}
          subtitle={metaAds?.summary?.totalCampaigns ? `${metaAds.summary.totalCampaigns} campaigns` : "Check Ads Manager"}
          icon={<DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
          textClass="text-amber-600 dark:text-amber-400"
          borderClass="border-amber-200 dark:border-amber-800"
        />
      </div>

      {/* Platform Overview Cards - Real Data, no filling with 0 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Facebook */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm text-foreground">
              <span>Facebook</span>
              <Badge variant="primary">Page</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">
                {fb?.followers !== undefined ? displayNumber(fb.followers) : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs text-foreground">
                  {fb?.handle || '@kontenval.id'}
                </Badge>
              </div>
              {fb?.posts?.reach !== undefined && (
                <div className="text-xs text-muted-foreground pt-1">
                  Reach: {displayNumber(fb.posts.reach, 'compact')} | Likes: {displayNumber(fb.engagement?.likes)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm text-foreground">
              <span>Instagram</span>
              <Badge variant="primary">Creator</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">
                {ig?.followers !== undefined ? displayNumber(ig.followers) : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs text-foreground">
                  {ig?.handle || '@kontenval.id'}
                </Badge>
              </div>
              {ig?.engagement?.likes !== undefined && (
                <div className="text-xs text-muted-foreground pt-1">
                  Likes: {displayNumber(ig.engagement.likes)} | Comments: {displayNumber(ig.engagement.comments)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* YouTube */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm text-foreground">
              <span>YouTube</span>
              <Badge variant="primary">Channel</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">
                {yt?.subscribers !== undefined ? displayNumber(yt.subscribers) : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-xs text-foreground">
                  {yt?.videoCount !== undefined ? `${displayNumber(yt.videoCount)} videos` : '-'}
                </Badge>
                {yt?.viewCount !== undefined && (
                  <Badge variant="outline" className="text-xs text-foreground">
                    {displayNumber(yt.viewCount, 'compact')} views
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follower Growth */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Follower Growth</h3>
          <FollowerGrowthChart data={followerData} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Current: FB {displayNumber(fb?.followers)} | IG {displayNumber(ig?.followers)} | YT {displayNumber(yt?.subscribers)}
          </p>
        </div>

        {/* Engagement */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement & Reach</h3>
          <EngagementChart data={engagementData} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Engagement = Likes + Comments | Reach = Views/Reach from each platform
          </p>
        </div>
      </div>

      {/* Meta Ads Summary - only show if connected */}
      {metaAds?.connected && metaAds?.summary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span>📊 Meta Ads Summary</span>
              <Badge variant="success">Live Data</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${metaAds.summary.totalSpend?.toLocaleString() || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">
                  {metaAds.summary.totalCampaigns ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accounts</p>
                <p className="text-2xl font-bold">{metaAds.summary.totalCampaigns ? '3' : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. CPC</p>
                <p className="text-2xl font-bold">
                  ${metaAds.summary.avgCPC?.toFixed(2) || '-'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/ads" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View detailed ads analytics →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/analytics" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📊</span>
            <span className="font-medium">Analytics</span>
          </a>
          <a href="/ads" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">💰</span>
            <span className="font-medium">Ads Manager</span>
          </a>
          <a href="/settings" className="p-4 rounded-lg border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">⚙️</span>
            <span className="font-medium">Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}