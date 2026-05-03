"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReachChart } from "@/components/charts/reach-chart";
import { ContentPieChart } from "@/components/charts/content-pie-chart";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { TrendingUp, Users, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";

const reachData = [
  { date: "Mon", reach: 3500, impressions: 8200 },
  { date: "Tue", reach: 4200, impressions: 9100 },
  { date: "Wed", reach: 3800, impressions: 8700 },
  { date: "Thu", reach: 5100, impressions: 10500 },
  { date: "Fri", reach: 4800, impressions: 9800 },
  { date: "Sat", reach: 5200, impressions: 11200 },
  { date: "Sun", reach: 5500, impressions: 12000 },
];

const contentData = [
  { name: "Posts", value: 45, color: "#1877F2" },
  { name: "Reels", value: 30, color: "#E4405F" },
  { name: "Stories", value: 15, color: "#FF0000" },
  { name: "Live", value: 10, color: "#0668E1" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [platform, setPlatform] = useState("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Detailed insights across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: "all", label: "All Platforms" },
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Followers"
          value="10,950"
          subtitle="↑ 12.5% this week"
          trend={{ value: 12.5, isPositive: true }}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
          borderClass="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Total Reach"
          value="40,200"
          subtitle="↑ 8.2% this week"
          trend={{ value: 8.2, isPositive: true }}
          icon={<Eye className="w-6 h-6 text-green-600" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Avg. Engagement"
          value="4.8%"
          subtitle="↑ 2.1% this week"
          trend={{ value: 2.1, isPositive: true }}
          icon={<Heart className="w-6 h-6 text-pink-600" />}
          colorClass="bg-pink-100 dark:bg-pink-900/30"
          textClass="text-pink-600 dark:text-pink-400"
          borderClass="border-pink-200 dark:border-pink-800"
        />
        <StatCard
          title="Total Views"
          value="125.4K"
          subtitle="↑ 15.3% this week"
          trend={{ value: 15.3, isPositive: true }}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">2,458</p>
          <p className="text-sm text-muted-foreground">Comments</p>
        </Card>
        <Card className="p-4 text-center">
          <Heart className="w-6 h-6 mx-auto mb-2 text-red-600" />
          <p className="text-2xl font-bold">18.2K</p>
          <p className="text-sm text-muted-foreground">Likes</p>
        </Card>
        <Card className="p-4 text-center">
          <Share2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">3,421</p>
          <p className="text-sm text-muted-foreground">Shares</p>
        </Card>
        <Card className="p-4 text-center">
          <Eye className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold">125.4K</p>
          <p className="text-sm text-muted-foreground">Views</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reach & Impressions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ReachChart data={reachData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentPieChart data={contentData} />
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { platform: "Facebook", followers: "4,450", reach: "15,200", engagement: "4.2%" },
              { platform: "Instagram", followers: "4,100", reach: "18,500", engagement: "5.8%" },
              { platform: "YouTube", followers: "2,400", reach: "6,500", engagement: "3.1%" },
            ].map((item) => (
              <div key={item.platform} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{item.platform}</Badge>
                  <div className="text-sm">
                    <p className="font-medium">{item.followers} followers</p>
                    <p className="text-muted-foreground">Reach: {item.reach}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{item.engagement}</p>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}