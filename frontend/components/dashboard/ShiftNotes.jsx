"use client";

import { AlignLeft } from "lucide-react";

export default function ShiftNotes({ notes }) {
  const noteData = notes || {
    author: "Lead Analyst Anand Sharma",
    timestamp: "Logged at 06:30 IST",
    text: "UPI server switch v2.4 patch deployed at 02:00 IST. Isolation Forest thresholds recalibrated for festive merchant volumes.",
    status: "Handover Confirmed",
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-full bg-[#E2E8D8] border border-[#8B9A6E]/40 flex items-center justify-center text-[#8B9A6E] shrink-0 mt-0.5">
          <AlignLeft className="w-4 h-4 text-[#555E4E]" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-system">
            <span className="font-bold text-[#2C3228] tracking-wider uppercase">
              SHIFT NOTES
            </span>
            <span className="text-[#A5AD9F]">•</span>
            <span className="text-[#555E4E]">{noteData.author}</span>
            <span className="text-[#A5AD9F]">•</span>
            <span className="text-[#8E9688]">{noteData.timestamp}</span>
          </div>
          <p className="text-xs text-[#555E4E] italic font-serif leading-relaxed">
            &ldquo;{noteData.text}&rdquo;
          </p>
        </div>
      </div>

      <div className="shrink-0 self-end md:self-center">
        <span className="px-3 py-1 bg-[#FAF7F2] border border-[#D9D2C7] rounded-md font-mono-system text-[10px] text-[#555E4E] font-medium tracking-wide">
          {noteData.status}
        </span>
      </div>
    </div>
  );
}