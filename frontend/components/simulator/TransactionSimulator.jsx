"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Zap,
  Shield,
  RotateCcw,
  TrendingUp,
  XSquare,
  Gauge,
  Plane,
  Lightbulb,
  CheckCircle2,
  Settings,
  ArrowRight,
} from "lucide-react";
import { runSimulation } from "../../lib/api";

const PRESETS = [
  {
    id: "normal",
    title: "Normal Txn",
    badge: "₹450",
    dotColor: "bg-emerald-500",
    amount: "450",
    merchant: "Chai Point",
    deviceId: "HANDSET_PRIMARY",
    location: "Mangaluru",
    timestamp: "04:12 PM",
    user: { name: "Rohit Kumar (U001)", initials: "RK", subtitle: "Baseline avg: ₹1,240 · Mangaluru · 2 Bound Devices" },
  },
  {
    id: "amount_spike",
    title: "Amount Spike",
    badge: "12.4x",
    dotColor: "bg-amber-500",
    amount: "38500",
    merchant: "Apex Gold Jewellery",
    deviceId: "HANDSET_PRIMARY",
    location: "Mangaluru",
    timestamp: "02:15 PM",
    user: { name: "Rohit Kumar (U001)", initials: "RK", subtitle: "Baseline avg: ₹1,240 · Mangaluru · 2 Bound Devices" },
  },
  {
    id: "velocity",
    title: "Velocity Burst",
    badge: "4tx/2m",
    dotColor: "bg-amber-500",
    amount: "15000",
    merchant: "Quick Pay Services",
    deviceId: "HANDSET_PRIMARY",
    location: "Mangaluru",
    timestamp: "01:05 PM",
    user: { name: "Rohit Kumar (U001)", initials: "RK", subtitle: "Baseline avg: ₹1,240 · Mangaluru · 2 Bound Devices" },
  },
  {
    id: "new_device",
    title: "New Device",
    badge: "IMEI#99",
    dotColor: "bg-amber-500",
    amount: "24500",
    merchant: "Electronics Hub",
    deviceId: "DEVICE_99",
    location: "Mangaluru",
    timestamp: "11:40 AM",
    user: { name: "Rohit Kumar (U001)", initials: "RK", subtitle: "Baseline avg: ₹1,240 · Mangaluru · 2 Bound Devices" },
  },
  {
    id: "impossible_travel",
    title: "Impossible Travel & Takeover",
    subtitle: "Mangaluru → Bengaluru in 79m · Active Preset",
    dotColor: "bg-amber-500",
    fullWidth: true,
    amount: "38500",
    merchant: "Apex Gold Jewellery",
    deviceId: "DEVICE_99",
    location: "Bengaluru",
    timestamp: "03:17 AM",
    user: { name: "Rohit Kumar (U001)", initials: "RK", subtitle: "Baseline avg: ₹1,240 · Mangaluru · 2 Bound Devices" },
  },
];

export default function TransactionSimulator() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[4]); // Default to Impossible Travel & Takeover as in Reference 3 screenshot
  const [amount, setAmount] = useState(selectedPreset.amount);
  const [merchant, setMerchant] = useState(selectedPreset.merchant);
  const [deviceId, setDeviceId] = useState(selectedPreset.deviceId);
  const [location, setLocation] = useState(selectedPreset.location);
  const [timestamp, setTimestamp] = useState(selectedPreset.timestamp);

  const [simResult, setSimResult] = useState({
    compositeRiskScore: 87,
    riskLevel: "CRITICAL",
    severity: "CRITICAL SEVERITY",
    treeDepth: 4.1,
    treeDepthAvg: 11.2,
    inferenceLatencyMs: 14,
    deviations: [
      {
        title: "Amount Spike: ₹38,500",
        points: 32,
        detail: "12.4x historical baseline (₹1,240 · 4.8σ outlier)",
        type: "spike",
      },
      {
        title: "Unrecognized Hardware: DEVICE_99",
        points: 25,
        detail: "Hardware signature not in user's 2 registered handsets",
        type: "device",
      },
      {
        title: "Velocity Surge: 4 txns in 2 mins",
        points: 18,
        detail: "Breaches 99.8th percentile rolling limit",
        type: "velocity",
      },
      {
        title: "Geolocation Leap: Impossible Travel",
        points: 12,
        detail: "Mangaluru → Bengaluru (350 km in 79 mins, >260 km/h)",
        type: "geo",
      },
    ],
    explainabilityText:
      "Payload path reached anomaly leaf node at depth 4.1 (vs baseline 11.2). Compound penalty initiated by impossible displacement speed and unverified device signature.",
  });

  const [isRunning, setIsRunning] = useState(false);

  const selectPresetHandler = (preset) => {
    setSelectedPreset(preset);
    setAmount(preset.amount);
    setMerchant(preset.merchant);
    setDeviceId(preset.deviceId);
    setLocation(preset.location);
    setTimestamp(preset.timestamp);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    const res = await runSimulation({
      scenarioId: selectedPreset.id,
      amount,
      payee: merchant,
      deviceId,
      location,
      timestamp,
    });
    setSimResult(res);
    setIsRunning(false);
  };

  const handleReset = () => {
    selectPresetHandler(PRESETS[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#7A8272] uppercase">
            MODULE 05 <span className="text-[#A5AD9F]">/</span> UPI BEHAVIOURAL FRAUD SIMULATOR
          </p>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Transaction Simulator
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Simulate UPI payloads against live Isolation Forest behavioural models to evaluate anomaly scores in real-time.
          </p>
        </div>

        {/* Top Right Info Badges */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D6] font-mono-system text-xs text-[#555E4E]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Model: <strong className="text-[#2C3228]">IForest-v2.4 (Active)</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D6] font-mono-system text-xs text-[#555E4E]">
            <Settings className="w-3.5 h-3.5 text-[#8E9688]" />
            <span>Replay Buffer: <strong className="text-[#2C3228]">Ready</strong></span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payload Configurator */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Scenario Presets */}
          <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#8B9A6E]" />
                <h3 className="font-bold text-sm text-[#2C3228]">Scenario Presets</h3>
              </div>
              <span className="font-mono-system text-[10px] text-[#8E9688]">5 Vectors</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESETS.slice(0, 4).map((p) => {
                const isSel = selectedPreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPresetHandler(p)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSel
                        ? "bg-[#E2E8D8] border-[#8B9A6E] text-[#2C3228]"
                        : "bg-[#F4EFEA] border-[#EAE2D6] text-[#555E4E] hover:border-[#8B9A6E]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.dotColor}`}></span>
                      <span className="text-xs font-semibold">{p.title}</span>
                    </div>
                    <span className="font-mono-system text-[10px] font-bold text-[#7A8272] bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EAE2D6]">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Full Width Preset */}
            <button
              onClick={() => selectPresetHandler(PRESETS[4])}
              className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedPreset.id === PRESETS[4].id
                  ? "bg-[#E2E8D8] border-[#8B9A6E] text-[#2C3228]"
                  : "bg-[#F4EFEA] border-[#EAE2D6] text-[#555E4E] hover:border-[#8B9A6E]/50"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-[#2C3228]">
                    {PRESETS[4].title}
                  </span>
                </div>
                <p className="font-mono-system text-[10px] text-[#6B7265] pl-4">
                  {PRESETS[4].subtitle}
                </p>
              </div>
              <span className="font-mono-system text-[10px] font-bold text-[#365314] bg-[#ECFCCB] px-2 py-0.5 rounded border border-[#D9F99D]">
                Selected
              </span>
            </button>
          </div>

          {/* Card 2: Payload Parameters Form */}
          <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#8B9A6E]" />
                <h3 className="font-bold text-sm text-[#2C3228]">Payload Parameters</h3>
              </div>
              <span className="font-mono-system text-[10px] text-[#8E9688]">UPI 2.0 Ingest</span>
            </div>

            {/* User Profile Banner Box */}
            <div className="bg-[#E2E8D8] border border-[#8B9A6E]/30 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8B9A6E] text-white flex items-center justify-center font-bold text-xs">
                  {selectedPreset.user.initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2C3228]">
                    {selectedPreset.user.name}
                  </p>
                  <p className="font-mono-system text-[10px] text-[#555E4E]">
                    {selectedPreset.user.subtitle}
                  </p>
                </div>
              </div>
              <span className="font-mono-system text-[10px] font-bold text-[#365314] bg-[#ECFCCB] px-2 py-1 rounded border border-[#D9F99D]">
                Profile Active
              </span>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono-system text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#8E9688] uppercase mb-1">
                  AMOUNT (INR)
                </label>
                <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl px-3 py-2 text-[#2C3228] font-bold flex items-center gap-1">
                  <span className="text-[#8E9688]">₹</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border-none w-full focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8E9688] uppercase mb-1">
                  PAYEE MERCHANT
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl px-3 py-2 text-[#2C3228] font-semibold w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8E9688] uppercase mb-1">
                  DEVICE ID
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl px-3 py-2 text-[#2C3228] font-semibold w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8E9688] uppercase mb-1">
                  GEO LOCATION
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl px-3 py-2 text-[#2C3228] font-semibold w-full focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#8E9688] uppercase mb-1">
                  TIMESTAMP
                </label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl px-3 py-2 text-[#2C3228] font-semibold w-full focus:outline-none"
                />
              </div>
            </div>

            {/* Run Simulation Button */}
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full py-3.5 px-4 bg-[#8B9A6E] hover:bg-[#78875C] text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isRunning ? "Running Engine..." : "⚡ Run Simulation"}</span>
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono-system text-[#8E9688] pt-1">
              <span>Evaluates 15 behavioural vector dimensions</span>
              <span>Latency: ~14ms</span>
            </div>
          </div>

          {/* Card 3: Engine Pipeline Sequence */}
          <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono-system text-[11px] font-bold text-[#2C3228] uppercase tracking-wider">
                ENGINE PIPELINE SEQUENCE
              </h4>
              <span className="font-mono-system text-[10px] font-bold text-[#8B9A6E]">
                ● Completed
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono-system">
              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-2.5 space-y-1">
                <span className="font-bold text-[#2C3228]">1. Ingested</span>
                <div className="flex items-center gap-1 text-[#8B9A6E]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Switch feed</span>
                </div>
              </div>
              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-2.5 space-y-1">
                <span className="font-bold text-[#2C3228]">2. Vectors</span>
                <div className="flex items-center gap-1 text-[#8B9A6E]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>15 features</span>
                </div>
              </div>
              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-2.5 space-y-1">
                <span className="font-bold text-[#2C3228]">3. Rules</span>
                <div className="flex items-center gap-1 text-[#8B9A6E]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sliding window</span>
                </div>
              </div>
              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-2.5 space-y-1">
                <span className="font-bold text-[#2C3228]">4. Scored</span>
                <div className="flex items-center gap-1 text-[#8B9A6E]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Depth 4.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Verdict & Explainability */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 shadow-2xs space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#8B9A6E]" />
                <h3 className="font-editorial text-2xl font-bold text-[#2C3228]">
                  Simulation Verdict
                </h3>
              </div>
              <span className="font-mono-system text-[10px] font-bold text-[#8E9688]">
                ID: SIM-TX10291
              </span>
            </div>

            {/* Composite Risk Score Gauge Box */}
            <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-system text-[10px] font-bold text-[#7A8272] tracking-wider uppercase">
                  COMPOSITE RISK SCORE
                </span>
                <span className="font-mono-system text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]/40">
                  {simResult.severity || "CRITICAL SEVERITY"}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-editorial text-6xl font-bold text-[#DC2626]">
                    {simResult.compositeRiskScore}
                  </span>
                  <span className="font-editorial text-2xl text-[#7A8272]">/ 100</span>
                </div>
                <span className="font-mono-system text-xs font-bold text-[#DC2626] tracking-wide">
                  HIGH RISK TRIGGER
                </span>
              </div>

              {/* Gauge Threshold Line */}
              <div className="space-y-1.5 pt-2">
                <div className="w-full bg-[#EAE2D6] h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-[#DC2626] h-full rounded-full transition-all duration-500"
                    style={{ width: `${simResult.compositeRiskScore}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono-system text-[9px] text-[#7A8272]">
                  <span>0 (Nominal)</span>
                  <span>45 (Flagged)</span>
                  <span>75 (Freeze Trigger)</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-2 gap-3 font-mono-system">
              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] text-[#7A8272] block uppercase">
                  Tree Traversal Depth
                </span>
                <p className="text-sm font-bold text-[#2C3228]">
                  {simResult.treeDepth} <span className="text-xs font-normal text-[#8E9688]">/ 11.2 avg</span>
                </p>
                <span className="text-[10px] font-semibold text-[#DC2626] block">
                  Quick isolation anomaly
                </span>
              </div>

              <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] text-[#7A8272] block uppercase">
                  Inference Latency
                </span>
                <p className="text-sm font-bold text-[#2C3228]">
                  {simResult.inferenceLatencyMs} <span className="text-xs font-normal text-[#8E9688]">ms</span>
                </p>
                <span className="text-[10px] text-[#555E4E] block">
                  Within &lt;20ms SLA threshold
                </span>
              </div>
            </div>

            {/* WHY WAS THIS FLAGGED? Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono-system text-[11px]">
                <span className="font-bold text-[#2C3228] uppercase tracking-wider">
                  WHY WAS THIS FLAGGED? (4 DEVIATIONS)
                </span>
                <span className="font-semibold text-[#DC2626]">+87 Total Pts</span>
              </div>

              <div className="space-y-2.5">
                {/* Deviation 1 */}
                <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2C3228]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#DC2626]" />
                      <span>Amount Spike: ₹38,500</span>
                    </div>
                    <span className="font-mono-system text-[11px] text-[#DC2626]">+32 pts</span>
                  </div>
                  <p className="text-[11px] text-[#555E4E] pl-6">
                    12.4x historical baseline (₹1,240 · 4.8σ outlier)
                  </p>
                </div>

                {/* Deviation 2 */}
                <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2C3228]">
                    <div className="flex items-center gap-2">
                      <XSquare className="w-4 h-4 text-[#DC2626]" />
                      <span>Unrecognized Hardware: DEVICE_99</span>
                    </div>
                    <span className="font-mono-system text-[11px] text-[#DC2626]">+25 pts</span>
                  </div>
                  <p className="text-[11px] text-[#555E4E] pl-6">
                    Hardware signature not in user's 2 registered handsets
                  </p>
                </div>

                {/* Deviation 3 */}
                <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2C3228]">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#D97706]" />
                      <span>Velocity Surge: 4 txns in 2 mins</span>
                    </div>
                    <span className="font-mono-system text-[11px] text-[#D97706]">+18 pts</span>
                  </div>
                  <p className="text-[11px] text-[#555E4E] pl-6">
                    Breaches 99.8th percentile rolling limit
                  </p>
                </div>

                {/* Deviation 4 */}
                <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2C3228]">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-[#DC2626]" />
                      <span>Geolocation Leap: Impossible Travel</span>
                    </div>
                    <span className="font-mono-system text-[11px] text-[#DC2626]">+12 pts</span>
                  </div>
                  <p className="text-[11px] text-[#555E4E] pl-6">
                    Mangaluru → Bengaluru (350 km in 79 mins, &gt;260 km/h)
                  </p>
                </div>
              </div>
            </div>

            {/* MODEL EXPLAINABILITY Box */}
            <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 font-mono-system text-xs font-bold text-[#2C3228] uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-[#8B9A6E]" />
                <span>MODEL EXPLAINABILITY</span>
              </div>
              <p className="text-xs text-[#555E4E] leading-relaxed">
                {simResult.explainabilityText}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/investigations?id=TX10291"
                className="w-full sm:flex-1 py-3 px-4 bg-[#8B9A6E] hover:bg-[#78875C] text-white font-medium text-xs rounded-xl transition-all shadow-2xs text-center flex items-center justify-center gap-2"
              >
                <span>Investigate in Deep View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-4 bg-[#F4EFEA] hover:bg-[#EAE2D6] text-[#555E4E] font-medium text-xs rounded-xl border border-[#EAE2D6] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
