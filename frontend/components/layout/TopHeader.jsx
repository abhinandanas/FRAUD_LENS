"use client";

import { Search, Clock, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopHeader() {
  const [timeStr, setTimeStr] = useState("14:28:09 IST");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}:${secs} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-[#EAE2D6] bg-[#F7F2EB]/90 backdrop-blur-sm sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left side Cluster Indicator */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D6] text-xs text-[#555E4E] font-medium shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Production Cluster</span>
          <span className="text-[#A5AD9F]">•</span>
          <span>UPI Switch Feed</span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Quick Lookup Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9688]" />
          <input
            type="text"
            placeholder="Quick Lookup (RRN / VPA)..."
            className="w-56 lg:w-64 pl-8 pr-8 py-1.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-lg text-xs text-[#2C3228] placeholder-[#8E9688] focus:outline-none focus:border-[#8B9A6E] focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono-system bg-[#EAE2D6]/60 text-[#6B7265] rounded border border-[#D9D2C7]">
            ⌘K
          </kbd>
        </div>

        {/* Live IST Clock */}
        <div className="flex items-center gap-1.5 text-xs font-mono-system text-[#555E4E] bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#EAE2D6]/80">
          <Clock className="w-3.5 h-3.5 text-[#8E9688]" />
          <span>{timeStr}</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 text-[#555E4E] hover:text-[#2C3228] hover:bg-[#EAE2D6]/40 rounded-lg transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full border border-white"></span>
        </button>

        {/* Analyst Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#8B9A6E] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
          AS
        </div>
      </div>
    </header>
  );
}
