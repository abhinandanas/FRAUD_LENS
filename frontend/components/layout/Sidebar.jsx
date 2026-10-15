"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ArrowRightLeft,
  Bell,
  ShieldCheck,
  FlaskConical,
  BarChart3,
  Lock,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutGrid },
  { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { name: "Alerts", href: "/alerts", icon: Bell, badge: "12 New" },
  { name: "Investigations", href: "/investigations", icon: ShieldCheck },
  { name: "Simulator", href: "/simulator", icon: FlaskConical },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCurrent = (href) => {
    if (href === "/") return pathname === "/" || pathname === "/overview";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-5 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-1 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#8B9A6E]/15 border border-[#8B9A6E]/30 flex items-center justify-center text-[#8B9A6E]">
            <Shield className="w-5 h-5 fill-[#8B9A6E]/20" />
          </div>
          <div>
            <h1 className="font-editorial text-xl font-bold tracking-tight text-[#2C3228] leading-none">
              UPI Sentinel
            </h1>
            <p className="font-mono-system text-[9px] tracking-[0.22em] font-semibold text-[#7A8272] uppercase mt-1">
              FRAUD INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#8B9A6E] text-white shadow-sm"
                    : "text-[#555E4E] hover:bg-[#EAE2D6]/50 hover:text-[#2C3228]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-white" : "text-[#7A8272]"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#FCEBEB] text-[#DC2626]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-4 pt-4 border-t border-[#EAE2D6]">
        {/* System Health Box */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl p-3.5 text-xs font-mono-system space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#8E9688] font-bold tracking-wider uppercase border-b border-[#EAE2D6] pb-1.5">
            <span>SYSTEM HEALTH</span>
            <span className="bg-[#EAE2D6]/60 px-1.5 py-0.5 rounded text-[#555E4E]">
              NPCI-L4
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#6B7265]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                API Status
              </span>
              <span className="font-semibold text-[#2C3228]">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#6B7265]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ML Engine
              </span>
              <span className="font-semibold text-[#2C3228]">IForest-v2.4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#6B7265]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Latency
              </span>
              <span className="font-semibold text-[#2C3228]">18ms</span>
            </div>
          </div>
        </div>

        {/* Analyst Profile */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E2E8D8] border border-[#8B9A6E]/30 flex items-center justify-center text-xs font-bold text-[#4A5243]">
              AS
            </div>
            <div>
              <p className="text-xs font-bold text-[#2C3228] leading-tight">
                A. Sharma
              </p>
              <p className="text-[10px] text-[#7A8272] leading-tight">
                Senior Analyst
              </p>
            </div>
          </div>
          <Lock className="w-3.5 h-3.5 text-[#8E9688]" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EAE2D6] text-[#2C3228] shadow-sm"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-xs"
        />
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-[280px] shrink-0 h-screen sticky top-0 bg-[#F4EFEA] border-r border-[#EAE2D6]">
        {navContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-[#F4EFEA] border-r border-[#EAE2D6] transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
