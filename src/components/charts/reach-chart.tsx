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
  data: { date: string; reach: number | string | null; impressions: number | string | null; source?: 'real' | 'pattern' }[];
  className?: string;
}

export function ReachChart({ data, className }: ReachChartProps) {
  const { colors } = useColors();
  const isDark = colors.background.includes("4.9%"); // Simple check for dark mode

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {/* Reach gradient - Vibrant Green */}
            <linearGradient id="reachGradientDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
            </linearGradient>
            {/* Impressions gradient - Vibrant Blue */}
            <linearGradient id="impressionGradientDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
            {/* Light mode gradients */}
            <linearGradient id="reachGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impressionGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Grid - adjust color for dark/light */}
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
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
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
                ? "0 4px 20px rgba(0,0,0,0.5)" 
                : "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{
              color: isDark ? "#FFFFFF" : "#374151",
              fontWeight: 600,
              marginBottom: "8px"
            }}
            itemStyle={{
              color: isDark ? "#F3F4F6" : "#374151",
              padding: "4px 0"
            }}
            formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, undefined]}
          />
          
          {/* Impressions - Blue */}
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="#3B82F6"
            strokeWidth={3}
            fill={isDark ? "url(#impressionGradientDark)" : "url(#impressionGradientLight)"}
            name="Impressions"
            dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
          />
          
          {/* Reach - Green */}
          <Area
            type="monotone"
            dataKey="reach"
            stroke="#10B981"
            strokeWidth={3}
            fill={isDark ? "url(#reachGradientDark)" : "url(#reachGradientLight)"}
            name="Reach"
            dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}