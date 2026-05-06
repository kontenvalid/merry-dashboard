"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { TrendingUp, Users, Eye, Heart, Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PlatformBadge } from "@/components/platform-badge";
import { ReachChart } from "@/components/charts/reach-chart";
import { ContentPieChart } from "@/components/charts/content-pie-chart";
import { EngagementChart } from "@/components/charts/engagement-chart";

interface AnalyticsRecord {
  platform: string;
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  views: number;
}

interface PlatformData {
  connected?: boolean;
  followers?: number;
  followers_count?: number;
  subscribers?: number;
  posts?: { reach?: number; impressions?: number };
  stats?: { totalViews?: number };
  viewCount?: number;
  engagement?: { likes?: number; comments?: number };
  media?: { type: string; productType?: string; likes: number; comments: number }[];
  mediaCount?: number;
}

interface OverviewResponse {
  success?: boolean;
  data?: {
    facebook: PlatformData;
    instagram: PlatformData;
    youtube: PlatformData;
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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [platform, setPlatform] = useState("all");
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<Record<string, { name: string; id: string; followers: number | null }>>({
    facebook: { name: 'Facebook', id: '@kontenval.id', followers: null },
    instagram: { name: 'Instagram', id: '@kontenval.id', followers: null },
    youtube: { name: 'YouTube', id: '@kontenvalid', followers: null },
  });
  const [historicalData, setHistoricalData] = useState<AnalyticsRecord[]>([]);
  const [overviewData, setOverviewData] = useState<{
    facebook: PlatformData | null;
    instagram: PlatformData | null;
    youtube: PlatformData | null;
  }>({ facebook: null, instagram: null, youtube: null });

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        
        const [overviewRes, historicalRes] = await Promise.all([
          fetch('/api/composio/overview'),
          fetch(`/api/analytics?days=${days}`),
        ]);

        // Process overview data
        if (overviewRes.ok) {
          const result = await overviewRes.json();
          const d = result.data || {};
          
          setOverviewData({
            facebook: d.facebook || null,
            instagram: d.instagram || null,
            youtube: d.youtube || null,
          });

          // Set account info - only set if value exists
          setAccountInfo({
            facebook: {
              name: d.facebook?.name || 'kontenval.id',
              id: d.facebook?.handle || '@kontenval.id',
              followers: d.facebook?.followers ?? null,
            },
            instagram: {
              name: d.instagram?.name || 'kontenval.id',
              id: d.instagram?.handle || '@kontenval.id',
              followers: d.instagram?.followers_count ?? d.instagram?.followers ?? null,
            },
            youtube: {
              name: d.youtube?.name || 'kontenval id',
              id: d.youtube?.handle || '@kontenvalid',
              followers: d.youtube?.subscribers ?? null,
            },
          });
        }

        // Process historical data
        if (historicalRes.ok) {
          const historyResult = await historicalRes.json();
          setHistoricalData(historyResult.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Get stats using REAL data - no filling with 0
  const getStats = () => {
    const fb = overviewData.facebook;
    const ig = overviewData.instagram;
    const yt = overviewData.youtube;

    if (platform === "all") {
      // Sum only existing values - check both followers and followers_count for IG
      const fbFollowers = fb?.followers ?? 0;
      const igFollowers = ig?.followers_count ?? ig?.followers ?? 0;
      const ytFollowers = yt?.subscribers ?? 0;
      const totalFollowers = fbFollowers + igFollowers + ytFollowers;

      const fbReach = fb?.posts?.reach ?? 0;
      const igReach = ig?.posts?.reach ?? 0;
      const ytReach = yt?.stats?.totalViews ?? yt?.viewCount ?? 0;
      const totalReach = fbReach + igReach + ytReach;

      // Engagement
      const fbEng = (fb?.engagement?.likes ?? 0) + (fb?.engagement?.comments ?? 0);
      const igEng = (ig?.engagement?.likes ?? 0) + (ig?.engagement?.comments ?? 0);
      const ytEng = (yt?.engagement?.likes ?? 0) + (yt?.engagement?.comments ?? 0);
      const totalEngagement = fbEng + igEng + ytEng;

      // Engagement rate
      const engagementRate = totalFollowers > 0 && totalEngagement > 0
        ? ((totalEngagement / totalFollowers) * 100).toFixed(1)
        : '-';

      return {
        followers: totalFollowers || null,
        reach: totalReach || null,
        engagement: engagementRate,
        views: ytReach || null,
      };
    } else {
      const acc = overviewData[platform as keyof typeof overviewData];
      if (!acc) {
        return { followers: null, reach: null, engagement: '-', views: null };
      }

      const accFollowers = platform === 'youtube' 
        ? acc.subscribers 
        : acc.followers;
      const accReach = platform === 'youtube'
        ? (acc.stats?.totalViews ?? acc.viewCount ?? 0)
        : (acc.posts?.reach ?? 0);
      const accEng = (acc.engagement?.likes ?? 0) + (acc.engagement?.comments ?? 0);
      
      const engagementRate = accFollowers && accEng > 0
        ? ((accEng / accFollowers) * 100).toFixed(1)
        : '-';

      return {
        followers: accFollowers ?? null,
        reach: accReach || null,
        engagement: engagementRate,
        views: platform === 'youtube' ? accReach : null,
      };
    }
  };

  const stats = getStats();
  const platformLabel = platform === "all"
    ? "All Accounts"
    : accountInfo[platform]?.id || platform;

  // Get engagement data - real values only
  const getEngagementData = () => {
    const fb = overviewData.facebook;
    const ig = overviewData.instagram;
    const yt = overviewData.youtube;

    if (platform === "all") {
      return [
        { 
          name: "Facebook", 
          engagement: fb?.engagement?.likes ?? null, 
          reach: fb?.posts?.reach ?? null
        },
        { 
          name: "Instagram", 
          engagement: ig?.engagement?.likes ?? null, 
          reach: ig?.posts?.reach ?? null
        },
        { 
          name: "YouTube", 
          engagement: yt?.engagement?.likes ?? null, 
          reach: yt?.stats?.totalViews ?? yt?.viewCount ?? null
        },
      ];
    }

    const acc = overviewData[platform as keyof typeof overviewData];
    return [
      {
        name: platform === "facebook" ? "Facebook" : platform === "instagram" ? "Instagram" : "YouTube",
        engagement: acc?.engagement?.likes ?? null,
        reach: platform === "youtube" 
          ? (acc?.stats?.totalViews ?? acc?.viewCount ?? null)
          : (acc?.posts?.reach ?? null),
      },
    ];
  };

  const engagementData = getEngagementData();

  // Get reach data
  const getReachData = () => {
    const fb = overviewData.facebook;
    const ig = overviewData.instagram;
    const yt = overviewData.youtube;

    const today = new Date();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const dates: { display: string; iso: string }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push({
        display: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        iso: date.toISOString().split('T')[0]
      });
    }

    return dates.map(({ display: dateStr, iso: dateKey }) => {
      const dayData = historicalData.filter((r) => r.date?.includes(dateKey));
      const fbRecord = dayData.find((r) => r.platform === 'FACEBOOK');
      const igRecord = dayData.find((r) => r.platform === 'INSTAGRAM');
      const ytRecord = dayData.find((r) => r.platform === 'YOUTUBE');

      const fbReach = fbRecord?.reach || fb?.posts?.reach;
      const igReach = igRecord?.reach || ig?.posts?.reach;
      const ytReach = ytRecord?.reach || yt?.stats?.totalViews || yt?.viewCount;

      const totalReach = platform === "facebook" ? fbReach 
        : platform === "instagram" ? igReach 
        : platform === "youtube" ? ytReach 
        : (fbReach || 0) + (igReach || 0) + (ytReach || 0);

      return {
        date: dateStr,
        reach: totalReach || null,
        impressions: null,
      };
    });
  };

  const reachData = getReachData();

  // Get content distribution from real IG media
  const getContentData = () => {
    const igMedia = overviewData.instagram?.media || [];
    
    if (igMedia.length > 0) {
      const reels = igMedia.filter((m) => m.type === 'VIDEO' || m.productType === 'REELS').length;
      const images = igMedia.filter((m) => m.type === 'IMAGE').length;
      const carousel = igMedia.filter((m) => m.type === 'CAROUSEL').length;
      
      const items = [
        { name: "Reels", value: reels, color: "#E4405F" },
        { name: "Images", value: images, color: "#833AB4" },
        { name: "Carousel", value: carousel, color: "#F77737" },
      ].filter(item => item.value > 0);
      
      if (items.length > 0) return items;
    }
    
    // Fallback: show media count if exists
    const mediaCount = overviewData.instagram?.mediaCount;
    if (mediaCount) {
      return [{ name: "Content", value: mediaCount, color: "#E4405F" }];
    }
    
    return [];
  };

  const contentData = getContentData();

  // Get breakdown data
  const getBreakdown = () => {
    const fb = overviewData.facebook;
    const ig = overviewData.instagram;
    const yt = overviewData.youtube;
    
    if (platform === "all") {
      return [
        { 
          platform: "Facebook", 
          followers: fb?.followers ?? null,
          reach: fb?.posts?.reach ?? null,
          engagement: fb?.followers && fb?.engagement?.likes 
            ? ((fb.engagement.likes / fb.followers) * 100).toFixed(1) + '%' 
            : '-',
          color: "facebook" 
        },
        { 
          platform: "Instagram", 
          followers: ig?.followers ?? null,
          reach: ig?.posts?.reach ?? null,
          engagement: ig?.followers && ig?.engagement?.likes 
            ? ((ig.engagement.likes / ig.followers) * 100).toFixed(1) + '%' 
            : '-',
          color: "instagram" 
        },
        { 
          platform: "YouTube", 
          followers: yt?.subscribers ?? null,
          reach: yt?.stats?.totalViews ?? yt?.viewCount ?? null,
          engagement: yt?.subscribers && yt?.engagement?.likes 
            ? ((yt.engagement.likes / yt.subscribers) * 100).toFixed(1) + '%' 
            : '-',
          color: "youtube" 
        },
      ];
    }
    
    const acc = overviewData[platform as keyof typeof overviewData];
    if (!acc) return [];
    
    const followers = platform === 'youtube' ? acc.subscribers : acc.followers;
    const reach = platform === 'youtube' 
      ? (acc.stats?.totalViews ?? acc.viewCount ?? null)
      : (acc.posts?.reach ?? null);
    const engagement = followers && acc.engagement?.likes
      ? ((acc.engagement.likes / followers) * 100).toFixed(1) + '%'
      : '-';
    
    return [
      { 
        platform: platform === "facebook" ? "Facebook" : platform === "instagram" ? "Instagram" : "YouTube", 
        followers,
        reach,
        engagement,
        color: platform 
      },
    ];
  };

  const breakdown = getBreakdown();

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
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">{platformLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Time</span>
            <Select
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
              ]}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Account</span>
            <Select
              options={[
                { value: "all", label: "All Accounts" },
                { value: "facebook", label: "Facebook" },
                { value: "instagram", label: "Instagram" },
                { value: "youtube", label: "YouTube" },
              ]}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Followers"
          value={stats.followers !== null ? displayNumber(stats.followers, 'compact') : '-'}
          icon={Users}
        />
        <StatCard
          title="Avg. Reach/Views"
          value={stats.reach !== null ? displayNumber(stats.reach, 'compact') : '-'}
          icon={Eye}
        />
        <StatCard
          title="Engagement Rate"
          value={stats.engagement}
          icon={Heart}
        />
        <StatCard
          title="Total Views"
          value={stats.views !== null ? displayNumber(stats.views, 'compact') : '-'}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Reach & Impressions</h3>
          </div>
          <ReachChart data={reachData} />
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Content Distribution</h3>
          </div>
          {contentData.length > 0 ? (
            <ContentPieChart data={contentData} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No content data available
            </div>
          )}
        </div>
      </div>

      {/* Engagement & Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Engagement by Platform</h3>
          </div>
          <EngagementChart data={engagementData} />
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Platform Breakdown</h3>
          </div>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.platform} className="flex items-center justify-between p-4 bg-secondary dark:bg-secondary/50 rounded-lg border border-transparent dark:border-border/50">
                <div className="flex items-center gap-3">
                  <PlatformBadge platform={item.color} />
                  <span className="font-medium text-foreground">{item.platform}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {item.followers !== null ? displayNumber(item.followers) : '-'} followers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Reach: {item.reach !== null ? displayNumber(item.reach, 'compact') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}