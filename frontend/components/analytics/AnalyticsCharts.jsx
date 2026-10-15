"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsCharts({ data }) {
  const volumeTrend = data?.volumeTrend || [
    { time: "00:00", volume: 1200, riskCases: 1 },
    { time: "03:00", volume: 450, riskCases: 4 },
    { time: "06:00", volume: 2100, riskCases: 2 },
    { time: "09:00", volume: 8400, riskCases: 5 },
    { time: "12:00", volume: 14210, riskCases: 8 },
    { time: "15:00", volume: 11200, riskCases: 6 },
    { time: "18:00", volume: 9800, riskCases: 2 },
    { time: "21:00", volume: 6400, riskCases: 0 },
  ];

  const riskDistribution = data?.riskDistribution || [
    { name: "Low Risk (<20)", value: 13950, color: "#8B9A6E" },
    { name: "Medium Risk (20-60)", value: 232, color: "#CA8A04" },
    { name: "High Risk (60-85)", value: 22, color: "#D97706" },
    { name: "Critical (>85)", value: 6, color: "#DC2626" },
  ];

  const signalContributions = data?.signalContributions || [
    { name: "Amount Outlier", percentage: 38 },
    { name: "Rapid Velocity", percentage: 29 },
    { name: "Unrecognized Device", percentage: 18 },
    { name: "Location Leap", percentage: 10 },
    { name: "Off-Hours Settlement", percentage: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Chart Row 1: Volume Trend */}
      <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="font-editorial text-xl font-bold text-[#2C3228]">
            Transaction Volume &amp; Anomaly Spike Trend
          </h3>
          <p className="text-xs text-[#6B7265] mt-0.5">
            24-hour real-time network throughput across UPI switch nodes
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeTrend}>
              <defs>
                <linearGradient id="sageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B9A6E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B9A6E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D6" vertical={false} />
              <XAxis dataKey="time" stroke="#7A8272" fontSize={11} tickLine={false} />
              <YAxis stroke="#7A8272" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FAF7F2",
                  borderColor: "#EAE2D6",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#2C3228",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#8B9A6E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sageGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Row 2: Risk Distribution & Signal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Bar Chart */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#2C3228]">
              Risk Grade Distribution
            </h3>
            <p className="text-xs text-[#6B7265]">
              Categorized volume by anomaly severity threshold
            </p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D6" horizontal={false} />
                <XAxis type="number" stroke="#7A8272" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#7A8272" fontSize={10} width={130} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FAF7F2",
                    borderColor: "#EAE2D6",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Behavioural Signal Breakdown Chart */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#2C3228]">
              Signal Contribution Breakdown
            </h3>
            <p className="text-xs text-[#6B7265]">
              Top Isolation Forest features contributing to active flags
            </p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signalContributions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D6" vertical={false} />
                <XAxis dataKey="name" stroke="#7A8272" fontSize={10} tickLine={false} />
                <YAxis stroke="#7A8272" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FAF7F2",
                    borderColor: "#EAE2D6",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="percentage" fill="#8B9A6E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}