"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Users, Eye, Heart, TrendingUp, BarChart3, RefreshCw, Sparkles, Activity, Zap, Globe } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const formatNumber = (num: number | undefined | null, _?: boolean) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  'IDR': 'Rp',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'MYR': 'RM',
  'SGD': 'S$',
  'THB': '฿',
};

// Format money based on currency
const formatMoney = (amount: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString('id-ID', { minimumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2, maximumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2 })}`;
};

// Modern gradient presets
const COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  gradient: ['#667eea', '#764ba2'],
  success: '#10B981',
  warning: '#F59E0B',
};

// Animated counter hook
function useAnimatedValue(value: number, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return displayValue;
}

// Modern glass card component - proper light/dark mode styling
function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-black/20 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 dark:from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

// Animated stat card
function StatCard({ icon: Icon, label, value, trend, color, delay = 0 }: { icon: any; label: string; value: number; trend?: string; color: string; delay?: number }) {
  const animatedValue = useAnimatedValue(value);
  
  return (
    <GlassCard delay={delay}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-400 bg-clip-text text-transparent">
          {formatNumber(animatedValue)}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('IDR'); // Default IDR
  const [currencySymbol, setCurrencySymbol] = useState<string>('Rp');

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
        
        // Auto-detect currency from Meta Ads response
        if (adsData.currency) {
          setCurrency(adsData.currency);
        }
        if (adsData.currencySymbol) {
          setCurrencySymbol(adsData.currencySymbol);
        }
        
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
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

  // Engagement chart data with smooth curves
  const engagementData = [
    { name: 'Facebook', likes: data?.facebook?.likes || 0, comments: data?.facebook?.comments || 0, shares: data?.facebook?.shares || 0, total: (data?.facebook?.likes || 0) + (data?.facebook?.comments || 0) + (data?.facebook?.shares || 0) },
    { name: 'Instagram', likes: data?.instagram?.likes || 0, comments: data?.instagram?.comments || 0, shares: 0, total: (data?.instagram?.likes || 0) + (data?.instagram?.comments || 0) },
    { name: 'YouTube', likes: data?.youtube?.likes || 0, comments: data?.youtube?.comments || 0, shares: 0, total: (data?.youtube?.likes || 0) + (data?.youtube?.comments || 0) }
  ];

  // Pie chart data - Followers distribution (donut style)
  const followersData = [
    { name: 'Facebook', value: data?.facebook?.followers || 0, color: COLORS.facebook },
    { name: 'Instagram', value: data?.instagram?.followers || 0, color: COLORS.instagram },
    { name: 'YouTube', value: data?.youtube?.followers || 0, color: COLORS.youtube }
  ].filter(d => d.value > 0);

  // Area chart data - Reach comparison
  const reachData = [
    { name: 'Facebook', reach: data?.facebook?.reach || 0, impressions: data?.facebook?.impressions || 0, fill: COLORS.facebook },
    { name: 'Instagram', reach: data?.instagram?.reach || 0, impressions: data?.instagram?.impressions || 0, fill: COLORS.instagram }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Social Media & Meta Ads Overview
            {lastSync && <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">Updated {new Date(lastSync).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button 
          onClick={performSync} 
          disabled={syncing} 
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* Stats Cards - Modern Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Followers" value={totalFollowers} color="from-blue-500 to-blue-600" trend="+12%" delay={0} />
        <StatCard icon={Eye} label="Total Reach" value={totalReach} color="from-emerald-500 to-emerald-600" delay={100} />
        <StatCard icon={Heart} label="Total Engagement" value={totalEngagement} color="from-pink-500 to-pink-600" delay={200} />
        <StatCard icon={Zap} label="YouTube Views" value={youtubeViews} color="from-orange-500 to-orange-600" delay={300} />
      </div>

      {/* Charts Grid - Modern Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Engagement Chart - Full Width on Left */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Engagement Overview
                </h3>
                <p className="text-sm text-slate-500">Interactive engagement metrics across platforms</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Likes</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500" /> Comments</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Shares</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)' 
                    }} 
                    formatter={(value: any) => formatNumber(value)}
                  />
                  <Bar dataKey="likes" fill="url(#likesGradient)" radius={[6, 6, 0, 0]} name="Likes" />
                  <Bar dataKey="comments" fill="url(#commentsGradient)" radius={[6, 6, 0, 0]} name="Comments" />
                  <Bar dataKey="shares" fill="url(#sharesGradient)" radius={[6, 6, 0, 0]} name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Followers Distribution - Donut Chart */}
        <div className="lg:col-span-1">
          <GlassCard>
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Audience Distribution
              </h3>
              <p className="text-sm text-slate-500">Followers breakdown by platform</p>
            </div>
            <div className="h-[250px] relative">
              {followersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={followersData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {followersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)' 
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
              {followersData.map((item) => (
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

      {/* Second Row - Reach & Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reach Chart */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Reach & Impressions
                </h3>
                <p className="text-sm text-slate-500">Content performance metrics</p>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reachData}>
                  <defs>
                    <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)' 
                    }} 
                    formatter={(value: any) => formatNumber(value)}
                  />
                  <Area type="monotone" dataKey="reach" stroke="#3B82F6" strokeWidth={3} fill="url(#reachGradient)" name="Reach" />
                  <Area type="monotone" dataKey="impressions" stroke="#93C5FD" strokeWidth={3} fill="url(#impressionsGradient)" name="Impressions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Meta Ads Quick Stats - Now with auto-detected currency */}
        <div className="lg:col-span-1">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Meta Ads
                </h3>
              </div>
              {data?.metaAds?.summary?.totalCampaigns > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                    {currency}
                  </span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full font-medium">
                    {data.metaAds.summary.totalCampaigns} Active
                  </span>
                </div>
              )}
            </div>
            
            {data?.metaAds?.summary?.totalCampaigns > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {formatMoney(data.metaAds.summary.totalSpend, currency)}
                  </p>
                  <p className="text-sm text-slate-500">Total Spend ({currency})</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                    <p className="text-lg font-bold">{formatNumber(data.metaAds.summary.totalClicks || 0)}</p>
                    <p className="text-xs text-slate-500">Clicks</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                    <p className="text-lg font-bold">{formatMoney(data.metaAds.summary.avgCPC || 0, currency)}</p>
                    <p className="text-xs text-slate-500">Avg CPC</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No active campaigns</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Platform Cards - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Facebook Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">f</span>
              </div>
              <div>
                <p className="font-semibold text-lg">Facebook</p>
                <p className="text-xs text-blue-200">@kontenval.id</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.facebook?.followers)}</p>
                <p className="text-xs text-blue-200">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.facebook?.posts)}</p>
                <p className="text-xs text-blue-200">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.facebook?.reach)}</p>
                <p className="text-xs text-blue-200">Reach</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-6 text-white shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-sm font-bold">IG</span>
              </div>
              <div>
                <p className="font-semibold text-lg">Instagram</p>
                <p className="text-xs text-pink-200">@kontenval.id</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.instagram?.followers)}</p>
                <p className="text-xs text-pink-200">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.instagram?.posts)}</p>
                <p className="text-xs text-pink-200">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.instagram?.reach)}</p>
                <p className="text-xs text-pink-200">Reach</p>
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-6 text-white shadow-xl shadow-red-600/25 hover:shadow-red-600/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">▶</span>
              </div>
              <div>
                <p className="font-semibold text-lg">YouTube</p>
                <p className="text-xs text-red-200">@kontenvalid</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.youtube?.followers)}</p>
                <p className="text-xs text-red-200">Subscribers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.youtube?.posts)}</p>
                <p className="text-xs text-red-200">Videos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data?.youtube?.views)}</p>
                <p className="text-xs text-red-200">Views</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}