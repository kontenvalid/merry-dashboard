"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, Users, Eye, Heart, TrendingUp, DollarSign, BarChart3, RefreshCw } from "lucide-react";

interface DashboardData {
  facebook: { followers: number; posts: number; likes: number; comments: number; shares: number; reach: number };
  instagram: { followers: number; posts: number; likes: number; comments: number; reach: number };
  youtube: { followers: number; posts: number; likes: number; comments: number; views: number };
  metaAds: { totalSpend: number; totalCampaigns: number; campaigns: any[] };
  googleDrive: { fileCount: number };
}

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return '0';
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
  const [syncStatus, setSyncStatus] = useState<string>('');
  const hasSynced = useRef(false);

  // Main sync function
  const performSync = async () => {
    if (syncing || hasSynced.current) return;
    
    setSyncing(true);
    setSyncStatus('Syncing data...');
    console.log('🔄 Starting sync...');
    
    try {
      // Call sync API
      const syncResponse = await fetch('/api/cron/sync');
      const syncResult = await syncResponse.json();
      
      console.log('Sync result:', syncResult);
      setSyncStatus(syncResult.success 
        ? `Synced: ${syncResult.socialMedia?.length || 0} platforms` 
        : `Sync failed: ${syncResult.error || 'Unknown error'}`);
      
      // Small delay to ensure data is written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch fresh data from overview
      const overviewRes = await fetch('/api/composio/overview');
      if (overviewRes.ok) {
        const overview = await overviewRes.json();
        console.log('Overview data:', overview);
        
        const d = overview.data || {};
        setLastSync(overview.timestamp);
        
        setData({
          facebook: {
            followers: d.facebook?.followers || 0,
            posts: d.facebook?.posts || 0,
            likes: d.facebook?.engagement?.likes || d.facebook?.likes || 0,
            comments: d.facebook?.engagement?.comments || d.facebook?.comments || 0,
            shares: d.facebook?.engagement?.shares || d.facebook?.shares || 0,
            reach: d.facebook?.reach || d.facebook?.posts_stats?.reach || 0
          },
          instagram: {
            followers: d.instagram?.followers || d.instagram?.followers_count || 0,
            posts: d.instagram?.posts || d.instagram?.mediaCount || 0,
            likes: d.instagram?.engagement?.likes || d.instagram?.likes || 0,
            comments: d.instagram?.engagement?.comments || d.instagram?.comments || 0,
            reach: d.instagram?.reach || d.instagram?.posts_stats?.reach || 0
          },
          youtube: {
            followers: d.youtube?.subscribers || d.youtube?.followers || 0,
            posts: d.youtube?.videoCount || d.youtube?.posts || 0,
            likes: d.youtube?.engagement?.likes || 0,
            comments: d.youtube?.engagement?.comments || 0,
            views: d.youtube?.views || d.youtube?.viewCount || 0
          },
          metaAds: {
            totalSpend: d.metaAds?.summary?.totalSpend || 0,
            totalCampaigns: d.metaAds?.summary?.totalCampaigns || 0,
            campaigns: d.metaAds?.campaigns || []
          },
          googleDrive: {
            fileCount: d.googleDrive?.fileCount || 0
          }
        });
      }
      
      // Also fetch Meta Ads
      const adsRes = await fetch('/api/composio/metaads');
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        if (adsData.summary?.totalSpend > 0) {
          setData(prev => prev ? {
            ...prev,
            metaAds: {
              totalSpend: adsData.summary.totalSpend,
              totalCampaigns: adsData.summary.totalCampaigns,
              campaigns: adsData.campaigns || []
            }
          } : prev);
        }
      }
      
      hasSynced.current = true;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('Sync error: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // Fetch initial data (from DB)
  const fetchFromDB = async () => {
    try {
      const [overviewRes, adsRes] = await Promise.all([
        fetch('/api/composio/overview'),
        fetch('/api/composio/metaads')
      ]);

      if (overviewRes.ok) {
        const overview = await overviewRes.json();
        const d = overview.data || {};
        
        if (overview.timestamp) setLastSync(overview.timestamp);
        
        const fbFollowers = d.facebook?.followers || 0;
        const igFollowers = d.instagram?.followers || d.instagram?.followers_count || 0;
        const ytFollowers = d.youtube?.subscribers || d.youtube?.followers || 0;
        
        setData({
          facebook: {
            followers: fbFollowers,
            posts: d.facebook?.posts || 0,
            likes: d.facebook?.engagement?.likes || d.facebook?.likes || 0,
            comments: d.facebook?.engagement?.comments || d.facebook?.comments || 0,
            shares: d.facebook?.engagement?.shares || d.facebook?.shares || 0,
            reach: d.facebook?.reach || d.facebook?.posts_stats?.reach || 0
          },
          instagram: {
            followers: igFollowers,
            posts: d.instagram?.posts || d.instagram?.mediaCount || 0,
            likes: d.instagram?.engagement?.likes || d.instagram?.likes || 0,
            comments: d.instagram?.engagement?.comments || d.instagram?.comments || 0,
            reach: d.instagram?.reach || d.instagram?.posts_stats?.reach || 0
          },
          youtube: {
            followers: ytFollowers,
            posts: d.youtube?.videoCount || d.youtube?.posts || 0,
            likes: d.youtube?.engagement?.likes || 0,
            comments: d.youtube?.engagement?.comments || 0,
            views: d.youtube?.views || d.youtube?.viewCount || 0
          },
          metaAds: {
            totalSpend: 0,
            totalCampaigns: 0,
            campaigns: []
          },
          googleDrive: {
            fileCount: d.googleDrive?.fileCount || 0
          }
        });
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        if (adsData.summary?.totalSpend > 0) {
          setData(prev => prev ? {
            ...prev,
            metaAds: {
              totalSpend: adsData.summary.totalSpend,
              totalCampaigns: adsData.summary.totalCampaigns,
              campaigns: adsData.campaigns || []
            }
          } : prev);
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // On mount: fetch from DB first, then trigger sync
  useEffect(() => {
    if (session) {
      fetchFromDB().then(() => {
        // Auto-sync after fetching initial data
        setTimeout(() => performSync(), 500);
      });
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalFollowers = (data?.facebook.followers || 0) + (data?.instagram.followers || 0) + (data?.youtube.followers || 0);
  const totalEngagement = (data?.facebook.likes || 0) + (data?.facebook.comments || 0) + (data?.facebook.shares || 0) + (data?.instagram.likes || 0) + (data?.instagram.comments || 0) + (data?.youtube.likes || 0) + (data?.youtube.comments || 0);
  const totalReach = (data?.facebook.reach || 0) + (data?.instagram.reach || 0);
  const youtubeViews = data?.youtube.views || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Social Media Analytics
            {lastSync && <span className="ml-2 text-xs">• Last sync: {new Date(lastSync).toLocaleString('id-ID')}</span>}
          </p>
          {syncStatus && <p className="text-xs text-blue-500 mt-1">{syncStatus}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={performSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => router.push('/analytics')} className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
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

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlatformCard title="Facebook" handle="@kontenval.id" platform="facebook" data={data?.facebook} />
        <PlatformCard title="Instagram" handle="@kontenval.id" platform="instagram" data={data?.instagram} />
        <PlatformCard title="YouTube" handle="@kontenvalid" platform="youtube" data={data?.youtube} />
      </div>

      {/* Meta Ads & Google Drive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Meta Ads</h3>
            </div>
            {(data?.metaAds?.totalCampaigns ?? 0) > 0 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Active</span>
            )}
          </div>
          {(data?.metaAds?.totalCampaigns ?? 0) > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">${formatNumber(data?.metaAds?.totalSpend)}</p>
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{data?.metaAds?.totalCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No Meta Ads data</p>
          )}
        </div>

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
            <p className="text-center text-muted-foreground py-4">No files synced</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Platform card component
function PlatformCard({ title, handle, platform, data }: { title: string; handle: string; platform: string; data?: any }) {
  const colors = {
    facebook: 'bg-blue-500',
    instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    youtube: 'bg-red-500'
  };
  
  const icon = platform === 'facebook' ? 'f' : platform === 'instagram' ? 'IG' : 'YT';

  return (
    <div className={`rounded-xl p-5 border ${
      platform === 'facebook' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
      platform === 'instagram' ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 border-purple-200 dark:border-purple-800' :
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${colors[platform as keyof typeof colors]} rounded-full flex items-center justify-center text-white font-bold ${platform === 'instagram' ? 'text-xs' : ''}`}>{icon}</div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{handle}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold">{formatNumber(data?.followers || platform === 'youtube' ? data?.followers : 0)}</p>
          <p className="text-xs text-muted-foreground">{platform === 'youtube' ? 'Subscribers' : 'Followers'}</p>
        </div>
        <div>
          <p className="text-lg font-bold">{formatNumber(data?.posts)}</p>
          <p className="text-xs text-muted-foreground">{platform === 'youtube' ? 'Videos' : 'Posts'}</p>
        </div>
        <div>
          <p className="text-lg font-bold">{formatNumber(platform === 'youtube' ? data?.views : data?.reach)}</p>
          <p className="text-xs text-muted-foreground">{platform === 'youtube' ? 'Views' : 'Reach'}</p>
        </div>
      </div>
    </div>
  );
}