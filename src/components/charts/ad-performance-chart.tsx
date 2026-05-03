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
}

export function AdPerformanceChart({ data, className }: AdPerformanceChartProps) {
  const { colors } = useColors();

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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              color: colors.text,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="spend"
            stroke={colors.meta}
            strokeWidth={3}
            dot={{ fill: colors.meta, r: 4 }}
            activeDot={{ r: 6 }}
            name="Spend ($)"
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
