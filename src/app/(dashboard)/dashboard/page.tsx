"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Users, Eye, Heart, TrendingUp, BarChart3, RefreshCw, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const COLORS = ['#3B82F6', '#8B5CF6', '#EF4444']; // FB, IG, YT

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [overviewRes, adsRes] = await Promise.all([
        fetch('/api/composio/overview'),
        fetch('/api/composio/metaads')
      ]);

      if (overviewRes.ok) {
        const overview = await overviewRes.json();
        const d = overview.data || {};
        
        if (overview.timestamp) setLastSync(overview.timestamp);
        
        setData({
          facebook: d.facebook || { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 },
          instagram: d.instagram || { followers: 0, posts: 0, likes: 0, comments: 0, reach: 0, impressions: 0 },
          youtube: d.youtube || { followers: 0, posts: 0, likes: 0, comments: 0, views: 0 },
          metaAds: d.metaAds || { connected: false, accounts: [], campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0 } }
        });
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setData((prev: any) => prev ? {
          ...prev,
          metaAds: {
            connected: true,
            accounts: adsData.accounts || [],
            campaigns: adsData.campaigns || [],
            summary: adsData.summary || { totalSpend: 0, totalCampaigns: 0 }
          }
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSync = async () => {
    if (syncing) return;
    setSyncing(true);
    
    try {
      await fetch('/api/cron/sync');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchData();
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && data === null) {
      setTimeout(() => performSync(), 1000);
    }
  }, [session, data]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals
  const totalFollowers = (data?.facebook?.followers || 0) + (data?.instagram?.followers || 0) + (data?.youtube?.followers || 0);
  const totalEngagement = (data?.facebook?.likes || 0) + (data?.facebook?.comments || 0) + (data?.facebook?.shares || 0) + 
                          (data?.instagram?.likes || 0) + (data?.instagram?.comments || 0) + 
                          (data?.youtube?.likes || 0) + (data?.youtube?.comments || 0);
  const totalReach = (data?.facebook?.reach || 0) + (data?.instagram?.reach || 0);
  const youtubeViews = data?.youtube?.views || 0;

  // Chart data - Engagement by Platform
  const engagementData = [
    { name: 'Facebook', likes: data?.facebook?.likes || 0, comments: data?.facebook?.comments || 0, shares: data?.facebook?.shares || 0 },
    { name: 'Instagram', likes: data?.instagram?.likes || 0, comments: data?.instagram?.comments || 0, shares: 0 },
    { name: 'YouTube', likes: data?.youtube?.likes || 0, comments: data?.youtube?.comments || 0, shares: 0 }
  ];

  // Pie chart data - Followers distribution
  const followersData = [
    { name: 'Facebook', value: data?.facebook?.followers || 0 },
    { name: 'Instagram', value: data?.instagram?.followers || 0 },
    { name: 'YouTube', value: data?.youtube?.followers || 0 }
  ].filter(d => d.value > 0);

  // Bar chart data - Reach by Platform
  const reachData = [
    { name: 'Facebook', reach: data?.facebook?.reach || 0, impressions: data?.facebook?.impressions || 0 },
    { name: 'Instagram', reach: data?.instagram?.reach || 0, impressions: data?.instagram?.impressions || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Social Media & Meta Ads Analytics
            {lastSync && <span className="ml-2 text-xs">• Updated: {new Date(lastSync).toLocaleString('id-ID')}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={performSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total Followers</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalFollowers)}</p>
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
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Meta Ads Spend</span>
          </div>
          <p className="text-3xl font-bold">${formatNumber(data?.metaAds?.summary?.totalSpend || 0)}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Engagement by Platform */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Engagement by Platform</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatNumber(value, false)} />
                <Bar dataKey="likes" fill="#3B82F6" name="Likes" />
                <Bar dataKey="comments" fill="#8B5CF6" name="Comments" />
                <Bar dataKey="shares" fill="#10B981" name="Shares" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Followers Distribution */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Followers Distribution</h3>
          <div className="h-[300px]">
            {followersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={followersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {followersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value, false)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Reach & Impressions */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="font-semibold mb-4">Reach & Impressions</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reachData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatNumber(value, false)} />
              <Bar dataKey="reach" fill="#3B82F6" name="Reach" />
              <Bar dataKey="impressions" fill="#93C5FD" name="Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meta Ads Section */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Meta Ads Performance
          </h3>
          {data?.metaAds?.summary?.totalCampaigns > 0 && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
              {data.metaAds.summary.totalCampaigns} Campaigns
            </span>
          )}
        </div>
        
        {data?.metaAds?.summary?.totalCampaigns > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-2xl font-bold">${formatNumber(data.metaAds.summary.totalSpend)}</p>
                <p className="text-sm text-muted-foreground">Total Spend</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-2xl font-bold">{data.metaAds.summary.totalCampaigns}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-2xl font-bold">{formatNumber(data.metaAds.summary.totalClicks || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-2xl font-bold">${formatNumber(data.metaAds.summary.avgCPC || 0)}</p>
                <p className="text-sm text-muted-foreground">Avg. CPC</p>
              </div>
            </div>
            
            {/* Campaign List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Campaign</th>
                    <th className="text-left py-2 px-4">Account</th>
                    <th className="text-right py-2 px-4">Status</th>
                    <th className="text-right py-2 px-4">Spend</th>
                    <th className="text-right py-2 px-4">Impressions</th>
                    <th className="text-right py-2 px-4">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metaAds.campaigns?.slice(0, 10).map((campaign: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="py-2 px-4 font-medium">{campaign.name}</td>
                      <td className="py-2 px-4 text-muted-foreground">{campaign.accountName}</td>
                      <td className="py-2 px-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">${formatNumber(campaign.spend || 0)}</td>
                      <td className="py-2 px-4 text-right">{formatNumber(campaign.impressions || 0)}</td>
                      <td className="py-2 px-4 text-right">{formatNumber(campaign.clicks || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No Meta Ads campaigns found</p>
            <p className="text-sm mt-1">Ensure your Meta token has proper permissions</p>
          </div>
        )}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">f</div>
            <div>
              <p className="font-semibold">Facebook</p>
              <p className="text-xs text-muted-foreground">@kontenval.id</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook?.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook?.posts)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.facebook?.reach)}</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>
        </div>

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
              <p className="text-lg font-bold">{formatNumber(data?.instagram?.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.instagram?.posts)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.instagram?.reach)}</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-xl p-5 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">▶</div>
            <div>
              <p className="font-semibold">YouTube</p>
              <p className="text-xs text-muted-foreground">@kontenvalid</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube?.followers)}</p>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube?.posts)}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatNumber(data?.youtube?.views)}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}