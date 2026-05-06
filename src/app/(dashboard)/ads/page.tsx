"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AdPerformanceChart } from "@/components/charts/ad-performance-chart";
import { useState, useEffect } from "react";
import { DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";

// Real Meta Ads account data
const AD_ACCOUNTS = [
  { id: "act_2180078045608935", name: "Indonesian Account (IDR)", currency: "IDR", status: "active" },
  { id: "act_1985101938922115", name: "Barqun Account (IDR)", currency: "IDR", status: "active" },
];

interface Campaign {
  name: string;
  status: "active" | "paused";
  budget: number;
  spend: number;
  roas: number;
  currency: string;
}

interface AdStats {
  totalSpend: number;
  impressions: number;
  clicks: number;
  roas: number;
  currency: string;
}

export default function AdsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [adStats, setAdStats] = useState<AdStats>({
    totalSpend: 0,
    impressions: 0,
    clicks: 0,
    roas: 0,
    currency: 'IDR'
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adData, setAdData] = useState<{date: string; spend: number; impressions: number; clicks: number}[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real ad data from API
  useEffect(() => {
    const fetchAdData = async () => {
      try {
        const response = await fetch('/api/composio/metaads');
        if (response.ok) {
          const data = await response.json();
          
          if (data.connected && data.campaigns?.length > 0) {
            // Real data from Meta Ads API
            setCampaigns(data.campaigns.map((c: any) => ({
              name: c.name,
              status: c.status === 'ACTIVE' ? 'active' : 'paused',
              budget: c.budget || c.spend * 1.5,
              spend: c.spend || 0,
              roas: c.roas || 0,
              currency: 'IDR'
            })));
            
            if (data.daily) {
              setAdData(data.daily.map((d: any) => ({
                date: d.date?.includes(',') ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) : d.date,
                spend: d.spend || 0,
                impressions: d.impressions || 0,
                clicks: d.clicks || 0
              })));
            }
            
            if (data.summary) {
              setAdStats({
                totalSpend: data.summary.totalSpend || 0,
                impressions: data.summary.totalImpressions || 0,
                clicks: data.summary.totalConversions || 0,
                roas: data.summary.averageROAS || 0,
                currency: 'IDR'
              });
            }
          } else if (data.hasCampaigns === false && !data.demo) {
            // Normal state: no campaigns, no demo data - show empty state
            setCampaigns([]);
            setAdData([]);
            setApiError(null);
            setAdStats({
              totalSpend: 0,
              impressions: 0,
              clicks: 0,
              roas: 0,
              currency: 'IDR'
            });
          } else if (data.demo?.campaigns) {
            // Fallback to demo data if exists (only for debugging)
            setCampaigns(data.demo.campaigns.map((c: any) => ({
              name: c.name,
              status: c.status === 'ACTIVE' ? 'active' : 'paused',
              budget: c.spend * 1.5,
              spend: c.spend,
              roas: c.roas,
              currency: 'IDR'
            })));
            if (data.demo.daily) {
              setAdData(data.demo.daily.map((d: any) => ({
                date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                spend: d.spend,
                impressions: d.impressions,
                clicks: d.clicks
              })));
            }
            if (data.summary) {
              setAdStats({
                totalSpend: data.summary.totalSpend || 0,
                impressions: data.summary.totalImpressions || 0,
                clicks: data.summary.totalConversions || 0,
                roas: data.summary.averageROAS || 0,
                currency: 'IDR'
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch ad data:', error);
        setApiError('Failed to fetch ad data');
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
        
        if (data.connected && data.campaigns?.length > 0) {
          setCampaigns(data.campaigns.map((c: any) => ({
            name: c.name,
            status: c.status === 'ACTIVE' ? 'active' : 'paused',
            budget: c.budget || c.spend * 1.5,
            spend: c.spend || 0,
            roas: c.roas || 0,
            currency: 'IDR'
          })));
          if (data.daily) {
            setAdData(data.daily.map((d: any) => ({
              date: d.date?.includes(',') ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) : d.date,
              spend: d.spend || 0,
              impressions: d.impressions || 0,
              clicks: d.clicks || 0
            })));
          }
          if (data.summary) {
            setAdStats({
              totalSpend: data.summary.totalSpend || 0,
              impressions: data.summary.totalImpressions || 0,
              clicks: data.summary.totalConversions || 0,
              roas: data.summary.averageROAS || 0,
              currency: 'IDR'
            });
          }
          setApiError(null);
        } else if (data.hasCampaigns === false && !data.demo) {
          // Normal state: no campaigns, no demo data
          setCampaigns([]);
          setAdData([]);
          setApiError(null);
          setAdStats({ totalSpend: 0, impressions: 0, clicks: 0, roas: 0, currency: 'IDR' });
        }
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    if (currency === 'IDR') {
      if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)}K`;
      }
      return `Rp ${amount.toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
              ...AD_ACCOUNTS.map((acc) => ({ value: acc.id, label: acc.name })),
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

      {/* API Error Alert - Only show when there's ACTUAL error, not just no campaigns */}
      {apiError && !apiError.includes('no campaigns') && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-amber-600 text-sm">{apiError}</span>
          </CardContent>
        </Card>
      )}

      {/* Ad Accounts */}
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
          value={formatCurrency(adStats.totalSpend)}
          subtitle="This week"
          trend={{ value: 15.3, isPositive: false }}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
          borderClass="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Impressions"
          value={formatNumber(adStats.impressions)}
          subtitle="This week"
          trend={{ value: 22.1, isPositive: true }}
          icon={<Eye className="w-6 h-6 text-green-600" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Conversions"
          value={formatNumber(adStats.clicks)}
          subtitle="This week"
          trend={{ value: 18.5, isPositive: true }}
          icon={<MousePointer className="w-6 h-6 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
        <StatCard
          title="Avg. ROAS"
          value={`${adStats.roas.toFixed(1)}x`}
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
                    {campaign.status === 'active' ? (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-gray-400" />
                    )}
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
                        Budget: {formatCurrency(campaign.budget)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(campaign.spend)}</p>
                  <p className="text-sm text-green-600">ROAS: {campaign.roas.toFixed(1)}x</p>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No campaigns found</p>
                <p className="text-sm">Connect Meta Ads in Settings to see your campaigns</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}