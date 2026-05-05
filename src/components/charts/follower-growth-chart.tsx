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

interface FollowerChartProps {
  data: { date: string; facebook: number; instagram: number; youtube: number }[];
  className?: string;
}

export function FollowerGrowthChart({ data, className }: FollowerChartProps) {
  const { isDark } = useColors();

  // Platform colors - vibrant in both modes
  const platformColors = {
    facebook: "#3B82F6",   // Blue
    instagram: "#EC4899", // Pink
    youtube: "#EF4444",   // Red
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="facebookGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={platformColors.facebook} stopOpacity={0.3} />
              <stop offset="95%" stopColor={platformColors.facebook} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="instagramGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={platformColors.instagram} stopOpacity={0.3} />
              <stop offset="95%" stopColor={platformColors.instagram} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="youtubeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={platformColors.youtube} stopOpacity={0.3} />
              <stop offset="95%" stopColor={platformColors.youtube} stopOpacity={0} />
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
                ? "0 4px 20px rgba(0,0,0,0.4)" 
                : "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{
              color: isDark ? "#F3F4F6" : "#374151",
              fontWeight: 600,
              marginBottom: "8px"
            }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: isDark ? "#D1D5DB" : "#4B5563", fontWeight: 500 }}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
          
          <Line
            type="monotone"
            dataKey="facebook"
            stroke={platformColors.facebook}
            strokeWidth={3}
            dot={{ fill: platformColors.facebook, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: platformColors.facebook, stroke: "#fff", strokeWidth: 2 }}
            name="Facebook"
          />
          <Line
            type="monotone"
            dataKey="instagram"
            stroke={platformColors.instagram}
            strokeWidth={3}
            dot={{ fill: platformColors.instagram, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: platformColors.instagram, stroke: "#fff", strokeWidth: 2 }}
            name="Instagram"
          />
          <Line
            type="monotone"
            dataKey="youtube"
            stroke={platformColors.youtube}
            strokeWidth={3}
            dot={{ fill: platformColors.youtube, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: platformColors.youtube, stroke: "#fff", strokeWidth: 2 }}
            name="YouTube"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}