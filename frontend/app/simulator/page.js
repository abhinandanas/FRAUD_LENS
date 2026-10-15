"use client";

import AppShell from "../../components/layout/AppShell";
import ScenarioSelector from "../../components/simulator/ScenarioSelector";
import DetectionPipeline from "../../components/simulator/DetectionPipeline";
import { runSimulation } from "../../lib/api";
import { useState } from "react";

export default function SimulatorPage() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!selectedScenario) return;
    setIsRunning(true);
    const result = await runSimulation(selectedScenario.id);
    setSimulationResult(result);
    setIsRunning(false);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#7A8272] uppercase">
            OPERATIONAL ENGINE TESTBED
          </p>
          <h1 className="font-editorial text-4xl lg:text-5xl font-bold text-[#2C3228] tracking-tight">
            Fraud Model Simulator
          </h1>
          <p className="text-xs lg:text-sm text-[#6B7265] max-w-2xl leading-relaxed">
            Test real-time Isolation Forest model sensitivity and rule engine response across synthetic anomaly vectors.
          </p>
        </div>
      </div>

      {/* Scenario Selector connected to Backend */}
      <ScenarioSelector
        selected={selectedScenario}
        onSelect={(sc) => {
          setSelectedScenario(sc);
          setSimulationResult(null);
        }}
        onRun={handleRun}
        isRunning={isRunning}
      />

      {/* Detection Pipeline Sequence */}
      <DetectionPipeline
        pipeline={simulationResult?.pipeline}
        result={simulationResult}
      />
    </AppShell>
  );
}
