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
import { useChartColors } from "@/lib/chart-colors";

interface AdPerformanceChartProps {
  data: { date: string; spend: number; impressions: number; clicks: number }[];
  className?: string;
  currency?: string;
}

export function AdPerformanceChart({ data, className, currency = 'IDR' }: AdPerformanceChartProps) {
  const colors = useChartColors();

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
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickLine={{ stroke: colors.muted }}
          />
          <YAxis
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickLine={{ stroke: colors.muted }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              color: colors.text,
            }}
            formatter={(value, name) => [formatTooltipValue(Number(value), String(name)), name]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="spend"
            stroke={colors.warning}
            strokeWidth={3}
            dot={{ fill: colors.warning, r: 4 }}
            activeDot={{ r: 6 }}
            name="Spend"
          />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke={colors.info}
            strokeWidth={2}
            dot={{ fill: colors.info, r: 3 }}
            name="Impressions"
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke={colors.success}
            strokeWidth={2}
            dot={{ fill: colors.success, r: 3 }}
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}