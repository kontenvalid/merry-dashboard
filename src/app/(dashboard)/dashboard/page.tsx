"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Users, Eye, Heart, TrendingUp, DollarSign, BarChart3, RefreshCw } from "lucide-react";

interface DashboardData {
  facebook: {
    followers: number;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  instagram: {
    followers: number;
    posts: number;
    likes: number;
    comments: number;
    reach: number;
  };
  youtube: {
    followers: number;
    posts: number;
    likes: number;
    comments: number;
    views: number;
  };
  metaAds: {
    totalSpend: number;
    totalCampaigns: number;
    campaigns: any[];
  };
  googleDrive: {
    fileCount: number;
  };
}

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Check and fetch data from database
  const fetchData = async () => {
    try {
      const [overviewRes, adsRes] = await Promise.all([
        fetch('/api/composio/overview'),
        fetch('/api/composio/metaads')
      ]);

      let dashboardData: DashboardData = {
        facebook: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0 },
        instagram: { followers: 0, posts: 0, likes: 0, comments: 0, reach: 0 },
        youtube: { followers: 0, posts: 0, likes: 0, comments: 0, views: 0 },
        metaAds: { totalSpend: 0, totalCampaigns: 0, campaigns: [] },
        googleDrive: { fileCount: 0 }
      };

      if (overviewRes.ok) {
        const overview = await overviewRes.json()
        const d = overview.data || {}
        const timestamp = overview.timestamp

        dashboardData.facebook = {
          followers: d.facebook?.followers || 0,
          posts: d.facebook?.posts || 0,
          likes: d.facebook?.engagement?.likes || d.facebook?.likes || 0,
          comments: d.facebook?.engagement?.comments || d.facebook?.comments || 0,
          shares: d.facebook?.engagement?.shares || d.facebook?.shares || 0,
          reach: d.facebook?.reach || d.facebook?.posts_stats?.reach || 0
        }

        dashboardData.instagram = {
          followers: d.instagram?.followers || d.instagram?.followers_count || 0,
          posts: d.instagram?.posts || d.instagram?.mediaCount || 0,
          likes: d.instagram?.engagement?.likes || d.instagram?.likes || 0,
          comments: d.instagram?.engagement?.comments || d.instagram?.comments || 0,
          reach: d.instagram?.reach || d.instagram?.posts_stats?.reach || 0
        }

        dashboardData.youtube = {
          followers: d.youtube?.subscribers || d.youtube?.followers || 0,
          posts: d.youtube?.videoCount || d.youtube?.posts || 0,
          likes: d.youtube?.engagement?.likes || 0,
          comments: d.youtube?.engagement?.comments || 0,
          views: d.youtube?.views || d.youtube?.viewCount || 0
        }

        dashboardData.googleDrive = {
          fileCount: d.googleDrive?.fileCount || 0
        }

        if (timestamp) setLastSync(timestamp)
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json()
        dashboardData.metaAds = {
          totalSpend: adsData.summary?.totalSpend || 0,
          totalCampaigns: adsData.summary?.totalCampaigns || 0,
          campaigns: adsData.campaigns || []
        }
      }

      setData(dashboardData)
      
      // Check if we have any data
      const totalFollowers = dashboardData.facebook.followers + dashboardData.instagram.followers + dashboardData.youtube.followers
      setHasData(totalFollowers > 0 || dashboardData.metaAds.totalSpend > 0 || dashboardData.googleDrive.fileCount > 0)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Trigger sync when no data
  const triggerSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    try {
      const response = await fetch('/api/cron/sync')
      if (response.ok) {
        // Refresh data after sync
        await fetchData()
        setLastSync(new Date().toISOString())
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch data on mount, trigger sync if empty
  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  // Auto-sync if no data exists
  useEffect(() => {
    if (!loading && !hasData && session && !syncing) {
      console.log('No data found, triggering sync...')
      triggerSync()
    }
  }, [loading, hasData, session])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalFollowers = (data?.facebook.followers || 0) + (data?.instagram.followers || 0) + (data?.youtube.followers || 0)
  const totalEngagement = 
    (data?.facebook.likes || 0) + (data?.facebook.comments || 0) + (data?.facebook.shares || 0) +
    (data?.instagram.likes || 0) + (data?.instagram.comments || 0) +
    (data?.youtube.likes || 0) + (data?.youtube.comments || 0)
  const totalReach = (data?.facebook.reach || 0) + (data?.instagram.reach || 0)
  const youtubeViews = data?.youtube.views || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Social Media Analytics
            {lastSync && (
              <span className="ml-2 text-xs">
                • Last synced: {new Date(lastSync).toLocaleString('id-ID')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {syncing && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </span>
          )}
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total Followers</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalFollowers)}</p>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>FB: {formatNumber(data?.facebook.followers)}</span>
            <span>IG: {formatNumber(data?.instagram.followers)}</span>
            <span>YT: {formatNumber(data?.youtube.followers)}</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Total Reach</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalReach)}</p>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-muted-foreground">Total Engagement</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalEngagement)}</p>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span className="text-sm text-muted-foreground">YouTube Views</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(youtubeViews)}</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Facebook */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">f</div>
            <div>
              <p className="font-semibold">Facebook</p>
              <p className="text-xs text-muted-foreground">@kontenval.id</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook.posts)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook.reach)}</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.facebook.likes)}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.facebook.comments)}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.facebook.shares)}</p>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xs">IG</div>
            <div>
              <p className="font-semibold">Instagram</p>
              <p className="text-xs text-muted-foreground">@kontenval.id</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.instagram.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.instagram.posts)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.instagram.reach)}</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.instagram.likes)}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.instagram.comments)}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">-</p>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
          </div>
        </div>

        {/* YouTube */}
        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-5 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">YT</div>
            <div>
              <p className="font-semibold">YouTube</p>
              <p className="text-xs text-muted-foreground">@kontenvalid</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube.followers)}</p>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube.posts)}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube.views)}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-red-200 dark:border-red-800">
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.youtube.likes)}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data?.youtube.comments)}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">-</p>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Ads & Google Drive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meta Ads */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Meta Ads</h3>
            </div>
            <button
              onClick={() => router.push('/ads')}
              className="text-sm text-blue-500 hover:underline"
            >
              View Details →
            </button>
          </div>
          {(data?.metaAds?.totalCampaigns ?? 0) > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.metaAds?.totalSpend)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data?.metaAds?.totalCampaigns}
                  </p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data?.metaAds?.campaigns?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Ads</p>
                </div>
              </div>
              {data?.metaAds?.campaigns?.slice(0, 3).map((campaign: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-secondary last:border-0">
                  <div>
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.accountName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${formatNumber(campaign.spend)}</p>
                    <p className="text-xs text-muted-foreground">{campaign.status}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No Meta Ads data available
            </p>
          )}
        </div>

        {/* Google Drive */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 17.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zM8 12c-.83 0-1.5.67-1.5 1.5S7.17 15 8 15s1.5-.67 1.5-1.5S8.83 12 8 12zm8-4.5c0 2.14-1.73 3.87-3.87 3.87H6.87C4.73 11.37 3 13.1 3 15.24V5.5C3 3.36 4.73 1.63 6.87 1.63h6.5C15.27 1.63 17 3.36 17 5.5v2.25z"/>
              </svg>
              <h3 className="font-semibold">Google Drive</h3>
            </div>
          </div>
          {(data?.googleDrive?.fileCount ?? 0) > 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{data?.googleDrive?.fileCount}</p>
              <p className="text-sm text-muted-foreground">files synced</p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No files synced
            </p>
          )}
        </div>
      </div>

      {/* Empty State - Trigger Sync */}
      {!hasData && !syncing && (
        <div className="text-center py-8 bg-card rounded-xl border">
          <p className="text-lg font-medium mb-2">Ready to sync your data</p>
          <p className="text-muted-foreground mb-4">
            Click the refresh button to fetch data from your connected accounts
          </p>
          <button
            onClick={triggerSync}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Sync
          </button>
        </div>
      )}
    </div>
  );
}