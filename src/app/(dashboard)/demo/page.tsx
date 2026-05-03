"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FollowerGrowthChart,
  EngagementChart,
  ReachChart,
  ContentPieChart,
  AdPerformanceChart,
} from "@/components/charts";

// Demo data
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

const adData = [
  { date: "Mon", spend: 45, impressions: 12500, clicks: 320 },
  { date: "Tue", spend: 52, impressions: 14200, clicks: 380 },
  { date: "Wed", spend: 48, impressions: 13800, clicks: 350 },
  { date: "Thu", spend: 55, impressions: 15500, clicks: 420 },
  { date: "Fri", spend: 60, impressions: 16800, clicks: 450 },
  { date: "Sat", spend: 58, impressions: 16200, clicks: 430 },
  { date: "Sun", spend: 62, impressions: 17500, clicks: 470 },
];

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chart Components Demo</h1>
        <p className="text-muted-foreground mt-1">
          Test all chart components with dark/light mode
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Follower Growth (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowerGrowthChart data={followerData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Engagement by Platform (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart data={engagementData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Reach & Impressions (Area Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ReachChart data={reachData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Content Distribution (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentPieChart data={contentData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>5. Ad Performance (Multi-Line Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <AdPerformanceChart data={adData} />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Toggle dark/light mode using the button in navbar to test theme adaptation</p>
      </div>
    </div>
  );
}
