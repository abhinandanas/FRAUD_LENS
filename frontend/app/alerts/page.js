import AppShell from "../../components/layout/AppShell";
import { fetchTransactions } from "../../lib/api";
import Link from "next/link";
import { AlertCircle, ShieldAlert, CheckCircle2, Filter } from "lucide-react";

export const metadata = {
  title: "Priority Alerts • UPI Sentinel",
  description: "Operational fraud alerts queue for investigator triage.",
};

export default async function AlertsPage() {
  const transactions = await fetchTransactions();
  const alertCases = transactions.filter((t) => t.riskLevel !== "LOW");

  const getSeverityStyle = (level) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-[#FEE2E2]",
          border: "border-[#FCA5A5]",
          text: "text-[#DC2626]",
          label: "CRITICAL ALERT",
        };
      case "HIGH":
        return {
          bg: "bg-[#FEF3C7]",
          border: "border-[#FDE68A]",
          text: "text-[#D97706]",
          label: "HIGH RISK",
        };
      default:
        return {
          bg: "bg-[#FEF9C3]",
          border: "border-[#FEF08A]",
          text: "text-[#CA8A04]",
          label: "MEDIUM RISK",
        };
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#DC2626] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
            12 UNRESOLVED PRIORITY ALERTS
          </p>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Fraud Alerts Queue
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Active behavioral anomalies flagged by Isolation Forest &amp; rule engines requiring human verification.
          </p>
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-4">
        {alertCases.map((alert) => {
          const style = getSeverityStyle(alert.riskLevel);
          return (
            <div
              key={alert.id}
              className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 hover:border-[#8B9A6E]/60 transition-all shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.bg} ${style.border} ${style.text}`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#2C3228] text-sm">
                      {alert.user}
                    </span>
                    <span className="font-mono-system text-[10px] text-[#7A8272] bg-[#EAE2D6]/60 px-1.5 py-0.5 rounded">
                      {alert.id}
                    </span>
                    <span
                      className={`font-mono-system text-[9px] font-bold px-2 py-0.5 rounded ${style.bg} ${style.text}`}
                    >
                      {style.label} (Score: {alert.riskScore}/100)
                    </span>
                  </div>

                  <p className="text-xs text-[#555E4E] font-medium">
                    Trigger: <span className="font-semibold text-[#2C3228]">{alert.triggerSignal}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-system text-[#8E9688] pt-1">
                    <span>Amount: <strong className="text-[#2C3228]">{alert.amountFormatted}</strong></span>
                    <span>Merchant: {alert.merchant}</span>
                    <span>Timestamp: {alert.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <Link
                  href={`/investigations?id=${alert.id}`}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-[#8B9A6E] text-white hover:bg-[#78875C] transition-all shadow-2xs"
                >
                  Investigate Alert →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}