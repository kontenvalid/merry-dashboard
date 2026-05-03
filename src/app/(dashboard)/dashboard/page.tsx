"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart";
import { EngagementChart } from "@/components/charts/engagement-chart";
import { PlatformBadge } from "@/components/platform-badge";
import { Users, Eye, TrendingUp, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) return null;

  // Demo data - replace with real data from API
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
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user?.name?.split(" ")[0] || "User"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your social media performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlatformBadge platform="facebook" />
          <PlatformBadge platform="instagram" />
          <PlatformBadge platform="youtube" />
          <PlatformBadge platform="meta_ads" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Followers"
          value="10,950"
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
          value="$245"
          subtitle="This week"
          trend={{ value: 15.3, isPositive: false }}
          icon={<DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
          textClass="text-amber-600 dark:text-amber-400"
          borderClass="border-amber-200 dark:border-amber-800"
        />
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

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📊</span>
            <span className="font-medium">View Analytics</span>
          </button>
          <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">📱</span>
            <span className="font-medium">Social Media</span>
          </button>
          <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">💰</span>
            <span className="font-medium">Ad Manager</span>
          </button>
          <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left">
            <span className="text-2xl mb-2 block">⚙️</span>
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}