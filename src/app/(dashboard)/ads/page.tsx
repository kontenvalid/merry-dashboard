"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AdPerformanceChart } from "@/components/charts/ad-performance-chart";
import { useState, useEffect } from "react";
import { DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";

const AD_ACCOUNTS = [
  { id: "act_2061230484461298", name: "kontenval.id (IDR)", currency: "IDR", status: "active" },
];

interface Campaign {
  name: string;
  status: string;
  budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  roas?: number;
  cpc?: number;
  currency: string;
}

interface MetaAdsResponse {
  success?: boolean;
  connected?: boolean;
  source?: string;
  accounts?: typeof AD_ACCOUNTS;
  campaigns?: Campaign[];
  summary?: {
    totalSpend?: number;
    totalImpressions?: number;
    totalClicks?: number;
    totalCampaigns?: number;
    avgCPC?: number;
  };
}

// Safe number display
const displayNumber = (value: number | undefined | null, format: 'compact' | 'full' = 'full'): string => {
  if (value === undefined || value === null) return '-';
  if (format === 'compact') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

const formatCurrency = (amount: number | undefined | null, currency: string = 'IDR'): string => {
  if (amount === undefined || amount === null) return '-';
  if (currency === 'IDR') {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
    return `Rp ${amount.toLocaleString()}`;
  }
  return `$${amount.toFixed(2)}`;
};

export default function AdsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [metaAdsData, setMetaAdsData] = useState<MetaAdsResponse | null>(null);

  // Fetch real ad data from API
  useEffect(() => {
    const fetchAdData = async () => {
      try {
        const response = await fetch('/api/composio/metaads');
        if (response.ok) {
          const data = await response.json();
          setMetaAdsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch ad data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAdData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/composio/metaads');
      if (response.ok) {
        const data = await response.json();
        setMetaAdsData(data);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const campaigns = metaAdsData?.campaigns || [];
  const summary = metaAdsData?.summary;

  // Ad performance chart data
  const adData = campaigns.length > 0 
    ? campaigns.slice(0, 7).map((c: Campaign, i: number) => ({
        date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7],
        spend: c.spend ?? 0,
        impressions: c.impressions ?? 0,
        clicks: c.clicks ?? 0
      }))
    : [];

  // Show ads section if API was successful (even if 0 campaigns)
  const showAdsSection = metaAdsData?.success === true;
  const showAccounts = metaAdsData?.success === true;
  const showEmptyState = metaAdsData === null && !loadingData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ads Manager</h1>
          <p className="text-muted-foreground mt-1">
            {showAdsSection 
              ? `Meta Ads - ${campaigns.length} active campaigns` 
              : 'Meta Ads performance across all accounts'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showAdsSection && (
            <Select
              options={[
                { value: "all", label: "All Accounts" },
                ...AD_ACCOUNTS.map((acc) => ({ value: acc.id, label: acc.name })),
              ]}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-48"
            />
          )}
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {showEmptyState && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-amber-600 text-sm">
              Meta Ads not connected. Add your access token in Settings.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Ad Accounts - Only show if connected */}
      {showAccounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connected Ad Accounts</span>
              <Badge variant="success">{AD_ACCOUNTS.length} Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AD_ACCOUNTS.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
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
      )}

      {/* Key Metrics - Only show if has real data */}
      {showAdsSection && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Spend"
            value={formatCurrency(summary.totalSpend)}
            subtitle={summary.totalCampaigns ? `${summary.totalCampaigns} campaigns` : 'This period'}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            colorClass="bg-blue-100 dark:bg-blue-900/30"
            textClass="text-blue-600 dark:text-blue-400"
            borderClass="border-blue-200 dark:border-blue-800"
          />
          <StatCard
            title="Impressions"
            value={displayNumber(summary.totalImpressions, 'compact')}
            subtitle="This period"
            icon={<Eye className="w-6 h-6 text-green-600" />}
            colorClass="bg-green-100 dark:bg-green-900/30"
            textClass="text-green-600 dark:text-green-400"
            borderClass="border-green-200 dark:border-green-800"
          />
          <StatCard
            title="Clicks"
            value={displayNumber(summary.totalClicks, 'compact')}
            subtitle="This period"
            icon={<MousePointer className="w-6 h-6 text-purple-600" />}
            colorClass="bg-purple-100 dark:bg-purple-900/30"
            textClass="text-purple-600 dark:text-purple-400"
            borderClass="border-purple-200 dark:border-purple-800"
          />
          <StatCard
            title="Avg. CPC"
            value={summary.avgCPC ? `$${summary.avgCPC.toFixed(2)}` : '-'}
            subtitle="Cost per click"
            icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
            colorClass="bg-amber-100 dark:bg-amber-900/30"
            textClass="text-amber-600 dark:text-amber-400"
            borderClass="border-amber-200 dark:border-amber-800"
          />
        </div>
      )}

      {/* Performance Chart - Only show if has campaigns */}
      {showAdsSection && adData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ad Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AdPerformanceChart data={adData} />
          </CardContent>
        </Card>
      )}

      {/* Campaigns - Only show if has campaigns */}
      {showAdsSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Campaigns</span>
              <Badge variant="secondary">{campaigns.length} campaigns</Badge>
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
                          variant={campaign.status === 'ACTIVE' ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {campaign.status?.toLowerCase()}
                        </Badge>
                        {campaign.budget && (
                          <span className="text-sm text-muted-foreground">
                            Budget: {formatCurrency(campaign.budget)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(campaign.spend)}
                    </p>
                    {campaign.impressions !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {displayNumber(campaign.impressions, 'compact')} impressions
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAccounts && campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground">No campaigns found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create campaigns in Meta Ads Manager to see them here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}