"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useColors } from "../platform-badge";

interface ContentPieChartProps {
  data: { name: string; value: number; color: string }[];
  className?: string;
}

export function ContentPieChart({ data, className }: ContentPieChartProps) {
  const { colors, isDark } = useColors();

  // Vibrant colors that work in both modes
  const defaultColors = [
    "#3B82F6", // Blue
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#8B5CF6", // Violet
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || defaultColors[index % defaultColors.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
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
              itemStyle={{
                color: isDark ? "#F3F4F6" : "#374151",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color || defaultColors[index % defaultColors.length] }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.name} ({entry.value}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}