"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useColors } from "../platform-badge";

interface ReachChartProps {
  data: { date: string; reach: number; impressions: number }[];
  className?: string;
}

export function ReachChart({ data, className }: ReachChartProps) {
  const { colors } = useColors();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.success} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impressionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.info} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.info} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="impressions"
            stroke={colors.info}
            strokeWidth={2}
            fill="url(#impressionGradient)"
            name="Impressions"
          />
          <Area
            type="monotone"
            dataKey="reach"
            stroke={colors.success}
            strokeWidth={2}
            fill="url(#reachGradient)"
            name="Reach"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
