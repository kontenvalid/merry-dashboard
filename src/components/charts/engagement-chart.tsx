"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useChartColors } from "@/lib/chart-colors";

interface EngagementChartProps {
  data: { name: string; engagement: number; reach: number }[];
  className?: string;
}

const PLATFORM_COLORS = ["#1877F2", "#E4405F", "#FF0000", "#0668E1"];
const PLATFORM_GOOGLE_COLORS = [
  "hsl(199 89% 48%)",   // Facebook blue
  "hsl(343 79% 55%)",   // Instagram pink
  "hsl(0 100% 50%)",    // YouTube red
  "hsl(213 94% 67%)",   // Meta blue
];

export function EngagementChart({ data, className }: EngagementChartProps) {
  const colors = useChartColors();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
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
          <Bar dataKey="engagement" name="Engagement" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PLATFORM_GOOGLE_COLORS[index % PLATFORM_GOOGLE_COLORS.length]} />
            ))}
          </Bar>
          <Bar dataKey="reach" name="Reach" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PLATFORM_GOOGLE_COLORS[index % PLATFORM_GOOGLE_COLORS.length]}
                fillOpacity={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
