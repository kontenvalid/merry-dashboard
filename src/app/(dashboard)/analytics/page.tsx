"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Eye, Heart, Loader2, Calendar, Sparkles, Globe, ArrowUp, ArrowDown, Zap, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

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

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

// Modern gradient presets
const COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  emerald: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

// Glass card component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

// Animated stat card
function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: number; trend?: string; color: string }) {
  const isPositive = trend && (trend.startsWith('+') || !trend.startsWith('-'));
  
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-400 bg-clip-text text-transparent">
          {formatNumber(value)}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </GlassCard>
  );
}

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
    const platforms: Record<string, any> = {
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

  // Get engagement over time
  const getEngagementTrend = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const today = new Date();
    const result: { date: string; engagement: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayRecords = analyticsData.filter(r => {
        const recordDate = new Date(r.date).toDateString();
        return recordDate === date.toDateString();
      });

      const totalEngagement = dayRecords.reduce((sum, r) => sum + (r.engagement || 0) + (r.likes || 0) + (r.comments || 0) + (r.shares || 0), 0);

      result.push({
        date: dateStr,
        engagement: totalEngagement
      });
    }

    return result;
  };

  // Get engagement data by platform
  const getEngagementData = () => {
    const platforms = getPlatformTotals();
    return [
      { name: 'Facebook', value: platforms.FACEBOOK.engagement + platforms.FACEBOOK.likes + platforms.FACEBOOK.comments + platforms.FACEBOOK.shares, color: COLORS.facebook },
      { name: 'Instagram', value: platforms.INSTAGRAM.engagement + platforms.INSTAGRAM.likes + platforms.INSTAGRAM.comments, color: COLORS.instagram },
      { name: 'YouTube', value: platforms.YOUTUBE.engagement + platforms.YOUTUBE.likes + platforms.YOUTUBE.comments, color: COLORS.youtube },
    ].filter(item => item.value > 0);
  };

  // Get posts by platform
  const getPostsData = () => {
    const platforms = getPlatformTotals();
    return [
      { name: 'Facebook', value: platforms.FACEBOOK.posts, color: COLORS.facebook },
      { name: 'Instagram', value: platforms.INSTAGRAM.posts, color: COLORS.instagram },
      { name: 'YouTube', value: platforms.YOUTUBE.posts, color: COLORS.youtube },
    ].filter(item => item.value > 0);
  };

  const platformTotals = getPlatformTotals();
  const totalFollowers = platformTotals.FACEBOOK.followers + platformTotals.INSTAGRAM.followers + platformTotals.YOUTUBE.followers;
  const totalEngagement = platformTotals.FACEBOOK.engagement + platformTotals.FACEBOOK.likes + platformTotals.FACEBOOK.comments + platformTotals.FACEBOOK.shares +
                           platformTotals.INSTAGRAM.engagement + platformTotals.INSTAGRAM.likes + platformTotals.INSTAGRAM.comments +
                           platformTotals.YOUTUBE.engagement + platformTotals.YOUTUBE.likes + platformTotals.YOUTUBE.comments;
  const totalReach = platformTotals.FACEBOOK.reach + platformTotals.INSTAGRAM.reach + platformTotals.YOUTUBE.reach;
  const totalViews = platformTotals.YOUTUBE.views;
  const reachData = getReachData();
  const engagementTrend = getEngagementTrend();
  const engagementData = getEngagementData();
  const postsData = getPostsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-400 bg-clip-text text-transparent">
            Analytics Center
          </h1>
          <p className="text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Deep insights into your social media performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
        <StatCard icon={Users} label="Total Followers" value={totalFollowers} color="from-blue-500 to-blue-600" />
        <StatCard icon={Eye} label="Total Reach" value={totalReach} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={Heart} label="Total Engagement" value={totalEngagement} color="from-pink-500 to-pink-600" />
        <StatCard icon={Zap} label="YouTube Views" value={totalViews} color="from-orange-500 to-orange-600" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Trend - Area Chart */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Engagement Trend
                </h3>
                <p className="text-sm text-slate-500">Engagement over time</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                <span className="text-slate-500">Total Engagement</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementTrend}>
                  <defs>
                    <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                    }} 
                    formatter={(value: any) => formatNumber(value)}
                  />
                  <Area type="monotone" dataKey="engagement" stroke="#3B82F6" strokeWidth={3} fill="url(#engagementGradient)" name="Engagement" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Engagement Distribution - Donut Chart */}
        <div className="lg:col-span-1">
          <GlassCard>
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Engagement Split
              </h3>
              <p className="text-sm text-slate-500">By platform</p>
            </div>
            <div className="h-[200px] relative">
              {engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                      }} 
                      formatter={(value: any) => formatNumber(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="text-sm">No data</p>
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {engagementData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Reach & Platform Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reach by Platform - Bar Chart */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Platform Reach
                </h3>
                <p className="text-sm text-slate-500">Comparison across platforms</p>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reachData} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="fbReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1877F2" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1877F2" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="igReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E4405F" stopOpacity={1} />
                      <stop offset="100%" stopColor="#E4405F" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="ytReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF0000" stopOpacity={1} />
                      <stop offset="100%" stopColor="#FF0000" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                    }} 
                    formatter={(value: any) => formatNumber(value)}
                  />
                  <Bar dataKey="facebook" fill="url(#fbReach)" radius={[6, 6, 0, 0]} name="Facebook" />
                  <Bar dataKey="instagram" fill="url(#igReach)" radius={[6, 6, 0, 0]} name="Instagram" />
                  <Bar dataKey="youtube" fill="url(#ytReach)" radius={[6, 6, 0, 0]} name="YouTube" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Content Distribution */}
        <div className="lg:col-span-1">
          <GlassCard>
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Content Distribution
              </h3>
              <p className="text-sm text-slate-500">Posts by platform</p>
            </div>
            <div className="space-y-4">
              {postsData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value} posts</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (item.value / Math.max(...postsData.map(d => d.value), 1)) * 100)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
              {postsData.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">No content data</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Platform Breakdown - Modern Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-500" />
              Platform Breakdown
            </h3>
            <p className="text-sm text-slate-500">Detailed metrics per platform</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Platform</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Followers</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Likes</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Comments</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Shares</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Reach/Views</th>
              </tr>
            </thead>
            <tbody>
              {platformTotals.FACEBOOK.followers > 0 && (
                <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">f</div>
                      <div>
                        <p className="font-semibold">Facebook</p>
                        <p className="text-xs text-slate-500">@kontenval.id</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 font-medium">{formatNumber(platformTotals.FACEBOOK.followers)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.FACEBOOK.likes)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.FACEBOOK.comments)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.FACEBOOK.shares)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.FACEBOOK.reach)}</td>
                </tr>
              )}
              {platformTotals.INSTAGRAM.followers > 0 && (
                <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-pink-500/25">IG</div>
                      <div>
                        <p className="font-semibold">Instagram</p>
                        <p className="text-xs text-slate-500">@kontenval.id</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 font-medium">{formatNumber(platformTotals.INSTAGRAM.followers)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.INSTAGRAM.likes)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.INSTAGRAM.comments)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.INSTAGRAM.shares)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.INSTAGRAM.reach)}</td>
                </tr>
              )}
              {platformTotals.YOUTUBE.followers > 0 && (
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/25">YT</div>
                      <div>
                        <p className="font-semibold">YouTube</p>
                        <p className="text-xs text-slate-500">@kontenvalid</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 font-medium">{formatNumber(platformTotals.YOUTUBE.followers)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.YOUTUBE.likes)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.YOUTUBE.comments)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.YOUTUBE.shares)}</td>
                  <td className="text-right py-4 px-4">{formatNumber(platformTotals.YOUTUBE.views)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalFollowers === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No data available yet</p>
              <p className="text-sm text-slate-400 mt-1">Run the sync cron to fetch social media data</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}