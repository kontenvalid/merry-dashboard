"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useColors } from "../platform-badge";

interface AdPerformanceChartProps {
  data: { date: string; spend: number; impressions: number; clicks: number }[];
  className?: string;
  currency?: string;
}

export function AdPerformanceChart({ data, className, currency = 'IDR' }: AdPerformanceChartProps) {
  const { isDark } = useColors();

  // Vibrant colors for ad metrics
  const lineColors = {
    spend: "#F59E0B",      // Amber
    impressions: "#8B5CF6", // Violet
    clicks: "#10B981",      // Emerald
  };

  // Format tooltip values based on data type
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'Spend') {
      if (currency === 'IDR') {
        if (value >= 1000000) {
          return `Rp ${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `Rp ${(value / 1000).toFixed(0)}K`;
        }
        return `Rp ${value.toLocaleString()}`;
      }
      return `$${value.toFixed(2)}`;
    }
    if (name === 'Impressions' || name === 'Clicks') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value.toString();
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColors.spend} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColors.spend} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColors.impressions} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColors.impressions} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColors.clicks} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColors.clicks} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            tick={{ 
              fill: isDark ? "#9CA3AF" : "#6B7280", 
              fontSize: 12,
              fontWeight: 500
            }}
            tickLine={{ stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
            axisLine={{ stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
          />
          <YAxis
            tick={{ 
              fill: isDark ? "#9CA3AF" : "#6B7280", 
              fontSize: 12,
              fontWeight: 500
            }}
            tickLine={{ stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
            axisLine={{ stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }}
          />
          
          <Tooltip
            contentStyle={{
              background: isDark 
                ? "linear-gradient(135deg, hsl(222.2 84% 10%) 0%, hsl(222.2 84% 8%) 100%)" 
                : "hsl(0 0% 100%)",
              border: isDark ? "1px solid hsl(217.2 32.6% 25%)" : "1px solid hsl(214.3 31.8% 91.4%)",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: isDark 
                ? "0 4px 20px rgba(0,0,0,0.4)" 
                : "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value, name) => [formatTooltipValue(Number(value), String(name)), name]}
            labelStyle={{
              color: isDark ? "#F3F4F6" : "#374151",
              fontWeight: 600,
              marginBottom: "8px"
            }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span style={{ color: isDark ? "#D1D5DB" : "#4B5563", fontWeight: 500 }}>
                {value}
              </span>
            )}
          />
          
          <Line
            type="monotone"
            dataKey="spend"
            stroke={lineColors.spend}
            strokeWidth={3}
            fill="url(#spendGradient)"
            dot={{ fill: lineColors.spend, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: lineColors.spend, stroke: "#fff", strokeWidth: 2 }}
            name="Spend"
          />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke={lineColors.impressions}
            strokeWidth={2}
            fill="url(#impressionsGradient)"
            dot={{ fill: lineColors.impressions, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: lineColors.impressions, stroke: "#fff", strokeWidth: 2 }}
            name="Impressions"
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke={lineColors.clicks}
            strokeWidth={2}
            fill="url(#clicksGradient)"
            dot={{ fill: lineColors.clicks, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: lineColors.clicks, stroke: "#fff", strokeWidth: 2 }}
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}