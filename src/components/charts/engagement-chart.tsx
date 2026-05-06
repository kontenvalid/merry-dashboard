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
import { useColors } from "../platform-badge";

interface EngagementChartProps {
  data: { name: string; engagement: number | string | null; reach: number | string | null }[];
  className?: string;
}

// Platform-specific colors that match platform-badge.tsx
const platformColors = {
  facebook: { primary: "#2563EB", secondary: "#60A5FA", label: "Facebook" },
  instagram: { primary: "#E1306C", secondary: "#F77737", label: "Instagram" },
  youtube: { primary: "#FF0000", secondary: "#FF4444", label: "YouTube" },
};

// Fallback colors for other platforms
const defaultColors = [
  { primary: "#3B82F6", secondary: "#60A5FA" },
  { primary: "#EC4899", secondary: "#F472B6" },
  { primary: "#EF4444", secondary: "#F87171" },
  { primary: "#10B981", secondary: "#34D399" },
];

const colorMap: Record<string, { primary: string; secondary: string }> = {
  Facebook: platformColors.facebook,
  Instagram: platformColors.instagram,
  YouTube: platformColors.youtube,
};

export function EngagementChart({ data, className }: EngagementChartProps) {
  const { isDark } = useColors();

  const getBarColors = (name: string, index: number): { primary: string; secondary: string } => {
    if (colorMap[name]) {
      return colorMap[name];
    }
    return defaultColors[index % defaultColors.length];
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {data.map((item, index) => {
              const colors = getBarColors(item.name, index);
              return (
                <linearGradient key={`engGradient-${index}`} id={`engGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                  <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
                </linearGradient>
              );
            })}
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            vertical={false}
          />
          
          <XAxis
            dataKey="name"
            tick={{ 
              fill: isDark ? "#9CA3AF" : "#6B7280", 
              fontSize: 12,
              fontWeight: 600
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
          
          {/* Custom Legend with proper colors - visible in both modes */}
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            content={({ payload }) => (
              <div className="flex items-center justify-center gap-6">
                {payload?.map((entry, index) => {
                  // Use distinct, vibrant colors that work in both light and dark mode
                  const symbolColor = entry.value === "Engagement" 
                    ? "#3B82F6" // Blue for Engagement
                    : "#8B5CF6"; // Purple for Reach
                  
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ 
                          backgroundColor: symbolColor,
                          boxShadow: isDark 
                            ? `0 0 6px ${symbolColor}` 
                            : `0 1px 3px rgba(0,0,0,0.2)`
                        }}
                      />
                      <span style={{ 
                        color: isDark ? "#D1D5DB" : "#4B5563", 
                        fontWeight: 500,
                        fontSize: "12px"
                      }}>
                        {entry.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          />
          
          <Bar dataKey="engagement" name="Engagement" radius={[8, 8, 0, 0]} maxBarSize={50}>
            {data.map((_, index) => {
              const colors = getBarColors(data[index].name, index);
              return (
                <Cell key={`eng-${index}`} fill={`url(#engGradient${index})`} />
              );
            })}
          </Bar>
          <Bar dataKey="reach" name="Reach" radius={[8, 8, 0, 0]} maxBarSize={50} fillOpacity={0.4}>
            {data.map((item, index) => {
              const colors = getBarColors(item.name, index);
              return (
                <Cell key={`reach-${index}`} fill={colors.primary} />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Color Legend - matches platform badges */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        {data.map((item, index) => {
          const colors = getBarColors(item.name, index);
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: isDark ? `0 0 6px ${colors.primary}` : `0 1px 3px rgba(0,0,0,0.2)`
                }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
