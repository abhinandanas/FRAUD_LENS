"use client";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F7F2EB]">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
