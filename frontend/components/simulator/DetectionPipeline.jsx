"use client";

import { CheckCircle2, ArrowRight, Activity, ShieldAlert, Cpu, GitBranch, Terminal } from "lucide-react";

export default function DetectionPipeline({ pipeline, result }) {
  const steps = pipeline || [
    { step: "TRANSACTION INGESTION", status: "PASSED", detail: "ISO 20022 message payload parsed" },
    { step: "BEHAVIOURAL FEATURES", status: "EXTRACTED", detail: "42 real-time features calculated" },
    { step: "RULE SIGNALS", status: "FLAGGED", detail: "Triggered 12x volume spike & New Device" },
    { step: "ML ANOMALY SCORE", status: "EVALUATED", detail: "Isolation Forest Anomaly Score: 0.84" },
    { step: "RISK ENGINE", status: "HIGH_RISK", detail: "Weighted Score: 84/100" },
    { step: "FINAL DECISION", status: "FLAGGED", detail: "Triage & Investigator Action Required" },
  ];

  return (
    <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs space-y-6">
      <div>
        <h3 className="font-editorial text-xl font-bold text-[#2C3228]">
          Detection Engine Pipeline Execution
        </h3>
        <p className="text-xs text-[#6B7265] mt-1">
          End-to-end evaluation flow from UPI switch payload to risk disposition
        </p>
      </div>

      {/* Visual Pipeline Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
        {steps.map((st, i) => (
          <div
            key={st.step}
            className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <span className="font-mono-system text-[9px] font-bold text-[#7A8272] tracking-wider block">
                STEP 0{i + 1}
              </span>
              <h4 className="font-mono-system text-[11px] font-bold text-[#2C3228] leading-snug">
                {st.step}
              </h4>
            </div>
            <p className="text-[10px] text-[#555E4E] leading-tight mt-2">{st.detail}</p>
            <div className="pt-2 border-t border-[#EAE2D6]/80 flex items-center justify-between text-[10px] font-mono-system font-bold">
              <span className="text-[#8B9A6E]">{st.status}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B9A6E]" />
            </div>
          </div>
        ))}
      </div>

      {/* Result Box */}
      {result && (
        <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-system text-xs">
          <div className="space-y-1">
            <span className="text-[#7A8272] font-semibold text-[10px] uppercase tracking-wider block">
              SIMULATION EVALUATION RESULT
            </span>
            <p className="font-bold text-[#2C3228] text-sm">
              Risk Level:{" "}
              <span
                className={
                  result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH"
                    ? "text-[#DC2626]"
                    : "text-[#65A30D]"
                }
              >
                {result.riskLevel}
              </span>{" "}
              (Score: {result.riskScore}/100)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#8B9A6E] text-white rounded-lg text-xs font-medium">
              Pipeline Latency: 14ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
