"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Play, CheckCircle, XCircle } from "lucide-react";

interface SyncResult {
  platform: string;
  success: boolean;
  data?: {
    followers: number;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    views: number;
  };
  error?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const triggerSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cron/sync');
      const data = await response.json();
      setSyncResult(data);
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return 'f';
      case 'INSTAGRAM': return 'IG';
      case 'YOUTUBE': return 'YT';
      default: return '?';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return 'bg-blue-500';
      case 'INSTAGRAM': return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400';
      case 'YOUTUBE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const syncResults = syncResult?.socialData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Social Media Analytics Overview</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync Now
        </button>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="text-sm text-muted-foreground">
          Last synced: {new Date(lastSync).toLocaleString('id-ID')}
        </div>
      )}

      {/* Sync Results */}
      {syncResult && (
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold text-lg mb-4">Sync Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {syncResults.map((result: SyncResult) => (
              <div key={result.platform} className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${getPlatformColor(result.platform)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {getPlatformIcon(result.platform)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{result.platform}</p>
                    {result.success ? (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Connected
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Failed
                      </p>
                    )}
                  </div>
                </div>
                
                {result.success && result.data && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">{formatNumber(result.data.followers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posts</span>
                      <span className="font-medium">{formatNumber(result.data.posts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Likes</span>
                      <span className="font-medium">{formatNumber(result.data.likes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comments</span>
                      <span className="font-medium">{formatNumber(result.data.comments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shares</span>
                      <span className="font-medium">{formatNumber(result.data.shares)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reach</span>
                      <span className="font-medium">{formatNumber(result.data.reach)}</span>
                    </div>
                    {result.data.views > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views</span>
                        <span className="font-medium">{formatNumber(result.data.views)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {!result.success && result.error && (
                  <p className="text-xs text-red-400">{result.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Google Drive Status */}
          {syncResult.googleDrive && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">GD</span>
                  </div>
                  <div>
                    <p className="font-semibold">Google Drive</p>
                    <p className="text-xs text-muted-foreground">
                      {syncResult.googleDrive.success 
                        ? `${syncResult.googleDrive.fileCount} files available`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>
                {syncResult.googleDrive.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/analytics')}
          className="p-6 bg-card rounded-xl border hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Analytics</p>
              <p className="text-sm text-muted-foreground">View detailed metrics</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/social')}
          className="p-6 bg-card rounded-xl border hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Social Accounts</p>
              <p className="text-sm text-muted-foreground">Manage connections</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/ads')}
          className="p-6 bg-card rounded-xl border hover:bg-secondary/50 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Ads Manager</p>
              <p className="text-sm text-muted-foreground">Meta Ads overview</p>
            </div>
          </div>
        </button>
      </div>

      {/* Empty State */}
      {!syncResult && !loading && (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Ready to Sync</p>
          <p className="text-muted-foreground mb-4">Click "Sync Now" to fetch data from social media platforms</p>
        </div>
      )}
    </div>
  );
}