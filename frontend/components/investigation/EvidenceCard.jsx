"use client";

import { AlertTriangle, ShieldAlert, Cpu, MapPin, Clock, Smartphone } from "lucide-react";

export function RiskScoreBadge({ score, level }) {
  const getColors = () => {
    if (score >= 85 || level === "CRITICAL")
      return { bg: "bg-[#FEE2E2]", border: "border-[#FCA5A5]", text: "text-[#DC2626]" };
    if (score >= 60 || level === "HIGH")
      return { bg: "bg-[#FEF3C7]", border: "border-[#FDE68A]", text: "text-[#D97706]" };
    if (score >= 30 || level === "MEDIUM")
      return { bg: "bg-[#FEF9C3]", border: "border-[#FEF08A]", text: "text-[#CA8A04]" };
    return { bg: "bg-[#ECFCCB]", border: "border-[#D9F99D]", text: "text-[#65A30D]" };
  };

  const style = getColors();

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-4 rounded-2xl border ${style.bg} ${style.border} ${style.text}`}
    >
      <span className="font-mono-system text-[10px] font-bold uppercase tracking-wider">
        RISK SCORE
      </span>
      <span className="font-editorial text-4xl font-bold my-1">{score}/100</span>
      <span className="text-xs font-semibold uppercase tracking-wide">{level}</span>
    </div>
  );
}

export function EvidenceCard({ title, description, severity }) {
  const getIcon = () => {
    if (title.includes("AMOUNT")) return <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
    if (title.includes("DEVICE")) return <Smartphone className="w-4 h-4 text-[#DC2626]" />;
    if (title.includes("LOCATION")) return <MapPin className="w-4 h-4 text-[#D97706]" />;
    if (title.includes("VELOCITY")) return <Cpu className="w-4 h-4 text-[#DC2626]" />;
    return <Clock className="w-4 h-4 text-[#65A30D]" />;
  };

  const getSeverityBadge = () => {
    if (severity === "CRITICAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono-system font-bold bg-[#FEE2E2] text-[#DC2626]">
          CRITICAL SEVERITY
        </span>
      );
    }
    if (severity === "HIGH") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono-system font-bold bg-[#FEF3C7] text-[#D97706]">
          HIGH SEVERITY
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono-system font-bold bg-[#EAE2D6] text-[#555E4E]">
        MEDIUM SEVERITY
      </span>
    );
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl p-4 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="font-mono-system text-xs font-bold text-[#2C3228] tracking-wide">
            {title}
          </h4>
        </div>
        {getSeverityBadge()}
      </div>
      <p className="text-xs text-[#555E4E] leading-relaxed">{description}</p>
    </div>
  );
}