import AppShell from "../components/layout/AppShell";
import KpiCard from "../components/dashboard/KpiCard";
import PriorityQueue from "../components/dashboard/PriorityQueue";
import BehaviouralSignalBreakdown from "../components/dashboard/BehaviouralSignalBreakdown";
import ShiftNotes from "../components/dashboard/ShiftNotes";
import { fetchOverviewData, fetchTransactions } from "../lib/api";
import { Calendar, Download } from "lucide-react";

export const metadata = {
  title: "Fraud Detection Overview • UPI Sentinel",
  description:
    "Real-time overview of network health, behavioural deviations, and priority alerts across UPI switch nodes.",
};

export default async function OverviewPage() {
  const overviewData = await fetchOverviewData();
  const transactions = await fetchTransactions();

  return (
    <AppShell>
      {/* Overview Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#7A8272] uppercase">
            LIVE SENTINEL MONITOR • Active Cycle
          </p>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Fraud Detection Overview
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Real-time overview of network health, behavioural deviations, and priority alerts across UPI switch nodes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D6] text-xs font-medium text-[#2C3228] hover:bg-white transition-all shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#8E9688]" />
            <span>
              Date: <span className="font-semibold">Today · 24 Oct</span>
            </span>
          </button>

          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D6] text-xs font-medium text-[#2C3228] hover:bg-white transition-all shadow-2xs">
            <Download className="w-3.5 h-3.5 text-[#8E9688]" />
            <span>Download Summary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard type="volume" data={overviewData.kpis} />
        <KpiCard type="anomalies" data={overviewData.kpis} />
        <KpiCard type="time" data={overviewData.kpis} />
      </div>

      {/* Middle Row (Priority Queue + Behavioural Signal Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 h-full">
          <PriorityQueue transactions={transactions} />
        </div>
        <div className="lg:col-span-4 h-full">
          <BehaviouralSignalBreakdown
            signals={overviewData.behaviouralSignals}
            observation={overviewData.analystObservation}
          />
        </div>
      </div>

      {/* Shift Notes Row */}
      <ShiftNotes notes={overviewData.shiftNotes} />
    </AppShell>
  );
}