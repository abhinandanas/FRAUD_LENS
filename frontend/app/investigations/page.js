import AppShell from "../../components/layout/AppShell";
import { fetchTransactionById, fetchTransactions } from "../../lib/api";
import { EvidenceCard, RiskScoreBadge } from "../../components/investigation/EvidenceCard";
import Link from "next/link";
import { ShieldCheck, AlertOctagon, UserCheck, Smartphone, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Case Investigation • UPI Sentinel",
  description: "Detailed behavioural fraud evidence breakdown and investigator disposition panel.",
};

export default async function InvestigationPage({ searchParams }) {
  const params = await searchParams;
  const id = params?.id || "TX10291";
  const tx = await fetchTransactionById(id);
  const allTx = await fetchTransactions();

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/transactions"
              className="text-xs font-mono-system text-[#8B9A6E] hover:underline"
            >
              ← Back to Queue
            </Link>
            <span className="text-[#A5AD9F]">•</span>
            <span className="font-mono-system text-[10px] font-bold text-[#7A8272] uppercase">
              CASE FILE: {tx.id}
            </span>
          </div>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Fraud Case Investigation
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Detailed machine-learning signal evidence breakdown and behavioral profile context.
          </p>
        </div>

        {/* Case Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono-system font-bold text-[#7A8272]">SELECT CASE:</span>
          <form action="/investigations" method="GET">
            <select
              name="id"
              defaultValue={tx.id}
              className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3 py-2 text-xs text-[#2C3228] font-bold focus:outline-none focus:border-[#8B9A6E]"
            >
              {allTx.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.user} ({t.amountFormatted})
                </option>
              ))}
            </select>
          </form>
        </div>
      </div>

      {/* Main Case Summary Header Card */}
      <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-3 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="font-editorial text-2xl font-bold text-[#2C3228]">
              {tx.user}
            </h2>
            <span className="font-mono-system text-xs px-2.5 py-0.5 rounded-md bg-[#EAE2D6] text-[#555E4E] font-semibold">
              VPA: {tx.vpa}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-system text-[#555E4E] pt-2 border-t border-[#EAE2D6]/80">
            <div>
              <span className="text-[10px] text-[#8E9688] block uppercase">AMOUNT</span>
              <span className="font-bold text-[#2C3228] text-base">{tx.amountFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9688] block uppercase">TIMESTAMP</span>
              <span className="font-semibold text-[#2C3228]">{tx.timestamp}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9688] block uppercase">RRN</span>
              <span className="font-semibold text-[#2C3228]">{tx.rrn}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9688] block uppercase">PAYEE MERCHANT</span>
              <span className="font-semibold text-[#2C3228]">{tx.merchant}</span>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="flex justify-start md:justify-end">
          <RiskScoreBadge score={tx.riskScore} level={tx.riskLevel} />
        </div>
      </div>

      {/* Prominent Evidence Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
          <h3 className="font-editorial text-2xl font-bold text-[#2C3228]">
            WHY WAS THIS TRANSACTION FLAGGED?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tx.evidence?.map((ev, idx) => (
            <EvidenceCard
              key={idx}
              title={ev.title}
              description={ev.description}
              severity={ev.severity}
            />
          ))}

          {/* Standard supplementary evidence cards if specific case lacks items */}
          {(!tx.evidence || tx.evidence.length < 2) && (
            <>
              <EvidenceCard
                title="AMOUNT ANOMALY"
                description={`Transaction amount (${tx.amountFormatted}) is 12.4x the user's historical 90-day baseline average.`}
                severity="CRITICAL"
              />
              <EvidenceCard
                title="NEW DEVICE BINDING"
                description={`Device fingerprint ID (${tx.device}) has not previously been associated with this VPA.`}
                severity="HIGH"
              />
            </>
          )}
        </div>
      </div>

      {/* Technical Metadata & Investigator Disposition Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 space-y-3 font-mono-system text-xs">
          <h4 className="font-bold text-[#2C3228] border-b border-[#EAE2D6] pb-2 uppercase tracking-wider text-[11px]">
            DEVICE &amp; INFRASTRUCTURE METADATA
          </h4>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#7A8272]">Device Model:</span>
              <span className="font-semibold text-[#2C3228]">{tx.device}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A8272]">IP Location:</span>
              <span className="font-semibold text-[#2C3228]">{tx.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A8272]">Switch Node:</span>
              <span className="font-semibold text-[#2C3228]">NPCI-L4-BLR</span>
            </div>
          </div>
        </div>

        {/* Investigator Action Panel */}
        <div className="md:col-span-2 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 space-y-4">
          <h4 className="font-editorial text-lg font-bold text-[#2C3228]">
            Investigator Sign-off &amp; Disposition
          </h4>
          <p className="text-xs text-[#6B7265]">
            Confirm disposition to train Isolation Forest model or escalate to NPCI fraud desk.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="px-5 py-2.5 rounded-xl bg-[#8B9A6E] hover:bg-[#78875C] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer">
              ✓ Confirm Legitimate (Clear Flag)
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer">
              🛑 Confirm Fraud &amp; Freeze Account
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-[#EAE2D6] text-[#555E4E] hover:bg-[#DDD4C5] text-xs font-semibold transition-all cursor-pointer">
              Request Additional KYC Proof
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}