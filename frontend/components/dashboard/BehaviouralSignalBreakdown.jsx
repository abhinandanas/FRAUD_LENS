"use client";

export default function BehaviouralSignalBreakdown({ signals, observation }) {
  const signalList = signals || [
    { name: "Amount Outlier", percentage: 38, color: "#8B9A6E" },
    { name: "Rapid Velocity", percentage: 29, color: "#8B9A6E" },
    { name: "Unrecognised Device", percentage: 18, color: "#8B9A6E" },
    { name: "Location Leap / Speed", percentage: 10, color: "#D97706" },
    { name: "Off-Hours Settlement", percentage: 5, color: "#8B9A6E" },
  ];

  return (
    <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-6 flex flex-col justify-between shadow-2xs h-full">
      <div>
        {/* Title */}
        <h3 className="font-editorial text-xl font-bold text-[#2C3228]">
          Behavioural Signal Breakdown
        </h3>
        <p className="text-xs text-[#6B7265] mt-1 mb-6">
          Top contributors to active alerts
        </p>

        {/* Progress List */}
        <div className="space-y-4">
          {signalList.map((sig) => (
            <div key={sig.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#2C3228]">{sig.name}</span>
                <span className="font-mono-system font-bold text-[#555E4E]">
                  {sig.percentage}%
                </span>
              </div>
              <div className="w-full bg-[#EAE2D6] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sig.percentage}%`,
                    backgroundColor: sig.color || "#8B9A6E",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Observation Box */}
      <div className="bg-[#F4EFEA] border border-[#EAE2D6] rounded-xl p-3.5 mt-6 text-xs text-[#555E4E]">
        <span className="font-bold text-[#2C3228]">Analyst Observation:</span>{" "}
        {observation ||
          "Most deviations this shift originate from high-ticket spikes on newly bound devices."}
      </div>
    </div>
  );
}