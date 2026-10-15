import AppShell from "../../components/layout/AppShell";
import AnalyticsCharts from "../../components/analytics/AnalyticsCharts";
import { fetchAnalyticsData } from "../../lib/api";

export const metadata = {
  title: "Analytics & Intelligence • UPI Sentinel",
  description: "Network health trends, risk grade distribution, and behavioural signal analytics.",
};

export default async function AnalyticsPage() {
  const analyticsData = await fetchAnalyticsData();

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#7A8272] uppercase">
            NETWORK METRICS &amp; ML PERFORMANCE
          </p>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Fraud Analytics &amp; Intelligence
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Macro insights into UPI switch transaction volume, Isolation Forest score distribution, and signal contribution trends.
          </p>
        </div>
      </div>

      <AnalyticsCharts data={analyticsData} />
    </AppShell>
  );
}