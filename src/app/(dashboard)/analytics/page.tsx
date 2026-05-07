"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Eye, Heart, Loader2, Calendar, BarChart3 } from "lucide-react";

interface AnalyticsRecord {
  platform: string;
  date: string;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  watchTime: number;
}

interface PlatformData {
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  views: number;
  impressions: number;
  engagement: number;
}

const formatNumber = (value: number | undefined | null, compact = true) => {
  if (value === undefined || value === null) return '-';
  if (compact) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([]);

  // Fetch from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const response = await fetch(`/api/analytics?days=${days}`);
        if (response.ok) {
          const result = await response.json();
          setAnalyticsData(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  // Calculate totals by platform
  const getPlatformTotals = () => {
    const platforms: Record<string, PlatformData> = {
      FACEBOOK: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, views: 0, impressions: 0, engagement: 0 },
      INSTAGRAM: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, views: 0, impressions: 0, engagement: 0 },
      YOUTUBE: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, views: 0, impressions: 0, engagement: 0 },
    };

    for (const record of analyticsData) {
      const p = record.platform as keyof typeof platforms;
      if (platforms[p]) {
        platforms[p].followers = record.followers || platforms[p].followers;
        platforms[p].posts += record.posts || 0;
        platforms[p].likes += record.likes || 0;
        platforms[p].comments += record.comments || 0;
        platforms[p].shares += record.shares || 0;
        platforms[p].reach += record.reach || 0;
        platforms[p].views += record.views || 0;
        platforms[p].impressions += record.impressions || 0;
        platforms[p].engagement += record.engagement || 0;
      }
    }

    return platforms;
  };

  // Get reach/impressions over time for chart
  const getReachData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const today = new Date();
    const result: { date: string; facebook: number; instagram: number; youtube: number; total: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayRecords = analyticsData.filter(r => {
        const recordDate = new Date(r.date).toDateString();
        return recordDate === date.toDateString();
      });

      const fb = dayRecords.find(r => r.platform === 'FACEBOOK');
      const ig = dayRecords.find(r => r.platform === 'INSTAGRAM');
      const yt = dayRecords.find(r => r.platform === 'YOUTUBE');

      result.push({
        date: dateStr,
        facebook: fb?.reach || 0,
        instagram: ig?.reach || 0,
        youtube: yt?.views || 0,
        total: (fb?.reach || 0) + (ig?.reach || 0) + (yt?.views || 0)
      });
    }

    return result;
  };

  // Get engagement data
  const getEngagementData = () => {
    const platforms = getPlatformTotals();
    return [
      { name: 'Facebook', value: platforms.FACEBOOK.engagement, color: '#1877F2' },
      { name: 'Instagram', value: platforms.INSTAGRAM.engagement, color: '#E4405F' },
      { name: 'YouTube', value: platforms.YOUTUBE.engagement, color: '#FF0000' },
    ].filter(item => item.value > 0);
  };

  // Get posts by platform
  const getPostsData = () => {
    const platforms = getPlatformTotals();
    return [
      { name: 'Facebook', value: platforms.FACEBOOK.posts, color: '#1877F2' },
      { name: 'Instagram', value: platforms.INSTAGRAM.posts, color: '#E4405F' },
      { name: 'YouTube', value: platforms.YOUTUBE.posts, color: '#FF0000' },
    ].filter(item => item.value > 0);
  };

  const platformTotals = getPlatformTotals();
  const totalFollowers = platformTotals.FACEBOOK.followers + platformTotals.INSTAGRAM.followers + platformTotals.YOUTUBE.followers;
  const totalEngagement = platformTotals.FACEBOOK.engagement + platformTotals.INSTAGRAM.engagement + platformTotals.YOUTUBE.engagement;
  const totalReach = platformTotals.FACEBOOK.reach + platformTotals.INSTAGRAM.reach + platformTotals.YOUTUBE.reach;
  const totalViews = platformTotals.YOUTUBE.views;
  const reachData = getReachData();
  const engagementData = getEngagementData();
  const postsData = getPostsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Social media performance overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-background"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
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
          <p className="text-3xl font-bold">{formatNumber(totalViews)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement by Platform */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold text-lg mb-4">Engagement by Platform</h3>
          {engagementData.length > 0 ? (
            <div className="space-y-4">
              {engagementData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm">{formatNumber(item.value)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.value / Math.max(...engagementData.map(d => d.value))) * 100)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No engagement data yet</p>
          )}
        </div>

        {/* Content Distribution */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold text-lg mb-4">Content Distribution</h3>
          {postsData.length > 0 ? (
            <div className="space-y-4">
              {postsData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm">{item.value} posts</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.value / Math.max(...postsData.map(d => d.value))) * 100)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No content data yet</p>
          )}
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="font-semibold text-lg mb-4">Platform Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Platform</th>
                <th className="text-right py-3 px-4 font-medium">Followers</th>
                <th className="text-right py-3 px-4 font-medium">Likes</th>
                <th className="text-right py-3 px-4 font-medium">Comments</th>
                <th className="text-right py-3 px-4 font-medium">Shares</th>
                <th className="text-right py-3 px-4 font-medium">Reach/Views</th>
              </tr>
            </thead>
            <tbody>
              {platformTotals.FACEBOOK.followers > 0 && (
                <tr className="border-b">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">f</div>
                      <span className="font-medium">Facebook</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.FACEBOOK.followers)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.FACEBOOK.likes)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.FACEBOOK.comments)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.FACEBOOK.shares)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.FACEBOOK.reach)}</td>
                </tr>
              )}
              {platformTotals.INSTAGRAM.followers > 0 && (
                <tr className="border-b">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xs">IG</div>
                      <span className="font-medium">Instagram</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.INSTAGRAM.followers)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.INSTAGRAM.likes)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.INSTAGRAM.comments)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.INSTAGRAM.shares)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.INSTAGRAM.reach)}</td>
                </tr>
              )}
              {platformTotals.YOUTUBE.followers > 0 && (
                <tr className="border-b">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">YT</div>
                      <span className="font-medium">YouTube</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.YOUTUBE.followers)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.YOUTUBE.likes)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.YOUTUBE.comments)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.YOUTUBE.shares)}</td>
                  <td className="text-right py-3 px-4">{formatNumber(platformTotals.YOUTUBE.views)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalFollowers === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No data available. Run the sync cron to fetch social media data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}