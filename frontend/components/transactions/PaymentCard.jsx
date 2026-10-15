"use client";

import {
  CheckCircle2,
  SlidersHorizontal,
  Landmark,
  ChevronDown,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export default function PaymentCard({ scenario, onPay, isProcessing }) {
  const [description, setDescription] = useState(
    scenario?.description || "Wedding jewellery advance payment"
  );
  const [paySuccess, setPaySuccess] = useState(null);

  const handlePayClick = async () => {
    if (onPay) {
      const res = await onPay(scenario.id, { description });
      setPaySuccess(res);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card Container */}
      <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-7 lg:p-8 shadow-sm">
        {/* Merchant Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#E2E8D8] border border-[#8B9A6E]/40 flex items-center justify-center text-[#4A5243] font-editorial text-2xl font-bold shadow-2xs">
            {scenario?.avatarLetter || "A"}
          </div>
        </div>

        {/* Merchant Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-base font-bold text-[#2C3228]">
              {scenario?.merchant || "Apex Gold & Jewellery"}
            </h3>
            <CheckCircle2 className="w-4 h-4 text-[#8B9A6E] fill-[#8B9A6E]/20 shrink-0" />
          </div>
          <p className="font-mono-system text-[11px] text-[#8E9688]">
            {scenario?.merchantVpa || "apexjewels@hdfcbank"}
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-md bg-[#F4EFEA] border border-[#EAE2D6] font-mono-system text-[9px] font-semibold text-[#6B7265] tracking-wider uppercase">
              BANKING NAME: {scenario?.merchantBankingName || "APEX BULLION TRADERS PVT LTD"}
            </span>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-center my-6 py-2">
          <div className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight flex items-center justify-center gap-2">
            <span className="text-2xl lg:text-3xl font-normal text-[#6B7265]">₹</span>
            <span>{scenario?.amountFormatted?.replace("₹", "").trim() || "38,500"}</span>
          </div>
          <p className="text-xs text-[#8E9688] mt-1.5 font-medium">
            Zero transaction fee on UPI
          </p>
        </div>

        {/* Transaction Description Field */}
        <div className="space-y-4">
          <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3 flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-[#8E9688] shrink-0" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="bg-transparent border-none text-xs text-[#2C3228] font-medium w-full focus:outline-none"
            />
          </div>

          {/* Paying From Account Selection */}
          <div>
            <label className="block font-mono-system text-[10px] font-bold text-[#8E9688] tracking-widest uppercase mb-2">
              PAYING FROM
            </label>
            <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-[#8B9A6E]/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-center text-[#555E4E]">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2C3228]">
                    {scenario?.userAccount || "HDFC Bank •••• 4821"}
                  </p>
                  <p className="text-[10px] text-[#7A8272]">
                    {scenario?.accountType || "Savings Account (Primary)"}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#8E9688]" />
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={handlePayClick}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-[#8B9A6E] hover:bg-[#78875C] active:scale-[0.99] text-white font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessing
                ? "Evaluating Payload..."
                : `Pay ${scenario?.amountFormatted || "₹38,500"}`}
            </span>
          </button>
        </div>

        {/* Security Badge Footer */}
        <div className="mt-6 pt-5 border-t border-[#EAE2D6] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono-system text-[#7A8272]">
            <Lock className="w-3.5 h-3.5 text-[#8B9A6E]" />
            <span>Secured by UPI • NPCI Real-time Switch</span>
          </div>
        </div>
      </div>

      {/* Real-time evaluation response toast if triggered */}
      {paySuccess && (
        <div
          className={`mt-4 p-4 rounded-xl border text-xs font-mono-system ${
            paySuccess.transaction?.riskLevel === "LOW"
              ? "bg-[#ECFCCB] border-[#D9F99D] text-[#365314]"
              : "bg-[#FEF3C7] border-[#FDE68A] text-[#78350F]"
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {paySuccess.transaction?.riskLevel === "LOW" ? (
              <ShieldCheck className="w-4 h-4 text-[#65A30D]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            )}
            <span>
              SENTINEL ANOMALY ENGINE EVALUATION ({paySuccess.transaction?.id})
            </span>
          </div>
          <p>{paySuccess.scenario?.statusMessage}</p>
          <p className="mt-1 font-semibold">
            Risk Grade: {paySuccess.transaction?.riskLevel} (Score:{" "}
            {paySuccess.transaction?.riskScore}/100)
          </p>
        </div>
      )}

      {/* Explanatory text under payment card */}
      <p className="text-xs text-[#7A8272] text-center max-w-sm mx-auto mt-4 font-mono-system leading-relaxed">
        Initiate or review transactions in real-time. Live payloads flow directly to
        UPI Sentinel anomaly detection.
      </p>
    </div>
  );
}