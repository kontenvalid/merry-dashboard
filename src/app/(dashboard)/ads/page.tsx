"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AdPerformanceChart } from "@/components/charts/ad-performance-chart";
import { useState } from "react";
import { DollarSign, Eye, MousePointer, TrendingUp, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";

const adData = [
  { date: "Mon", spend: 45, impressions: 12500, clicks: 320 },
  { date: "Tue", spend: 52, impressions: 14200, clicks: 380 },
  { date: "Wed", spend: 48, impressions: 13800, clicks: 350 },
  { date: "Thu", spend: 55, impressions: 15500, clicks: 420 },
  { date: "Fri", spend: 60, impressions: 16800, clicks: 450 },
  { date: "Sat", spend: 58, impressions: 16200, clicks: 430 },
  { date: "Sun", spend: 62, impressions: 17500, clicks: 470 },
];

const adAccounts = [
  { id: "act_66362051", name: "Main Account (USD)", currency: "USD", status: "active" },
  { id: "act_2180078045608935", name: "Indonesian Account (IDR)", currency: "IDR", status: "active" },
  { id: "act_1985101938922115", name: "Barqun Account (IDR)", currency: "IDR", status: "active" },
];

const campaigns = [
  { name: "Brand Awareness Q1", status: "active", budget: "$500", spend: "$245", roas: "3.2x" },
  { name: "Product Launch Campaign", status: "active", budget: "$300", spend: "$180", roas: "2.8x" },
  { name: "Retargeting - Website Visitors", status: "paused", budget: "$200", spend: "$89", roas: "4.1x" },
];

export default function AdsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("all");

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ads Manager</h1>
          <p className="text-muted-foreground mt-1">
            Meta Ads performance across all accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "all", label: "All Accounts" },
              ...adAccounts.map((acc) => ({ value: acc.id, label: acc.name })),
            ]}
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-48"
          />
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Ad Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Ad Accounts</span>
            <Badge variant="success">{adAccounts.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adAccounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{account.currency}</Badge>
                  <div className="flex items-center gap-1 text-green-500">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs">Active</span>
                  </div>
                </div>
                <p className="font-semibold">{account.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{account.id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spend"
          value="$324"
          subtitle="This week"
          trend={{ value: 15.3, isPositive: false }}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
          borderClass="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Impressions"
          value="90.5K"
          subtitle="This week"
          trend={{ value: 22.1, isPositive: true }}
          icon={<Eye className="w-6 h-6 text-green-600" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Clicks"
          value="2,820"
          subtitle="This week"
          trend={{ value: 18.5, isPositive: true }}
          icon={<MousePointer className="w-6 h-6 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
        <StatCard
          title="Avg. ROAS"
          value="3.4x"
          subtitle="Return on ad spend"
          trend={{ value: 5.2, isPositive: true }}
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
          textClass="text-amber-600 dark:text-amber-400"
          borderClass="border-amber-200 dark:border-amber-800"
        />
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <AdPerformanceChart data={adData} />
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Campaigns</span>
            <Button size="sm">View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map((campaign, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={campaign.status === "active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {campaign.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Budget: {campaign.budget}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${campaign.spend}</p>
                  <p className="text-sm text-green-600">ROAS: {campaign.roas}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}