"use client";

import { useTheme } from "next-themes";
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

interface FollowerChartProps {
  data: { date: string; facebook: number; instagram: number; youtube: number }[];
  className?: string;
}

export function FollowerGrowthChart({ data, className }: FollowerChartProps) {
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
            dataKey="facebook"
            stroke={colors.facebook}
            strokeWidth={3}
            dot={{ fill: colors.facebook, r: 4 }}
            activeDot={{ r: 6 }}
            name="Facebook"
          />
          <Line
            type="monotone"
            dataKey="instagram"
            stroke={colors.instagram}
            strokeWidth={3}
            dot={{ fill: colors.instagram, r: 4 }}
            activeDot={{ r: 6 }}
            name="Instagram"
          />
          <Line
            type="monotone"
            dataKey="youtube"
            stroke={colors.youtube}
            strokeWidth={3}
            dot={{ fill: colors.youtube, r: 4 }}
            activeDot={{ r: 6 }}
            name="YouTube"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
