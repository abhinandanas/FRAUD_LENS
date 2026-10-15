"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function PriorityQueue({ transactions }) {
  const rows = transactions?.slice(0, 4) || [];

  const getRiskBadge = (level) => {
    switch (level) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]/40">
            Critical
          </span>
        );
      case "HIGH":
      case "HIGH_RISK":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]/40">
            High Risk
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF9C3] text-[#CA8A04] border border-[#FEF08A]/40">
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFCCB] text-[#65A30D] border border-[#D9F99D]/40">
            Low Risk
          </span>
        );
    }
  };

  const getActionButton = (item) => {
    if (item.status === "Investigating") {
      return (
        <Link
          href={`/investigations?id=${item.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EAE2D6] text-[#555E4E] hover:bg-[#DDD4C5] transition-all"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B9A6E] animate-pulse"></span>
          Investigating
        </Link>
      );
    }
    if (item.status === "Resolved" || item.status === "Cleared") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAF7F2] text-[#8E9688] border border-[#EAE2D6]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#8E9688]" />
          Resolved
        </span>
      );
    }
    return (
      <Link
        href={`/investigations?id=${item.id}`}
        className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#8B9A6E] text-white hover:bg-[#78875C] transition-all shadow-2xs"
      >
        Review case
      </Link>
    );
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 flex flex-col justify-between shadow-2xs h-full">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-editorial text-xl font-bold text-[#2C3228]">
              Priority Queue &amp; Recent Flagged Activity
            </h3>
            <p className="text-xs text-[#6B7265] mt-1">
              Transactions requiring immediate investigator sign-off or disposition
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B7265] hover:text-[#8B9A6E] transition-colors"
          >
            <span>View all 28 cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE2D6] text-[10px] font-mono-system font-bold text-[#7A8272] uppercase tracking-wider">
                <th className="pb-3 pr-4 font-semibold">ACCOUNT / ID</th>
                <th className="pb-3 px-4 font-semibold">AMOUNT</th>
                <th className="pb-3 px-4 font-semibold">TRIGGER SIGNAL</th>
                <th className="pb-3 px-4 font-semibold">RISK LEVEL</th>
                <th className="pb-3 pl-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE2D6]/60 text-xs">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F4EFEA]/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-[#2C3228]">{row.user}</p>
                    <p className="font-mono-system text-[10px] text-[#7A8272]">
                      {row.id}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono-system font-semibold text-[#2C3228]">
                    {row.amountFormatted}
                  </td>
                  <td className="py-3.5 px-4 text-[#555E4E] max-w-[220px]">
                    {row.triggerSignal}
                  </td>
                  <td className="py-3.5 px-4">{getRiskBadge(row.riskLevel)}</td>
                  <td className="py-3.5 pl-4 text-right">{getActionButton(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-[11px] font-mono-system text-[#8E9688] pt-4 mt-4 border-t border-[#EAE2D6]">
        <span>Updated every 30s from ISO 20022 message queue</span>
        <span>Queue status: Optimal (0.19% flag rate)</span>
      </div>
    </div>
  );
}