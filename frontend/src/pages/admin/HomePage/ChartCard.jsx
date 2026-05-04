import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ADMIN_COLORS } from "../../../constants/colors";

const ChartCard = ({ title, data, color }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
      {title && <p className="text-sm font-bold text-gray-800 mb-6">{title}</p>}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.chartGrid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: ADMIN_COLORS.chartAxis }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: ADMIN_COLORS.chartAxis }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#grad-${color})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: ADMIN_COLORS.white, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;