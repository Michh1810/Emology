import { Activity, Heart } from "lucide-react";

interface CityHealthDashboardProps {
  balance: number;
  emotionCount: number;
}

export function CityHealthDashboard({ balance, emotionCount }: CityHealthDashboardProps) {
  const getBalanceStatus = () => {
    if (balance >= 80) return { label: "Harmonious", color: "#22c55e", glow: "0 0 20px rgba(34, 197, 94, 0.5)" };
    if (balance >= 60) return { label: "Balanced", color: "#3b82f6", glow: "0 0 20px rgba(59, 130, 246, 0.5)" };
    if (balance >= 40) return { label: "Fluctuating", color: "#f59e0b", glow: "0 0 20px rgba(245, 158, 11, 0.5)" };
    return { label: "Turbulent", color: "#ef4444", glow: "0 0 20px rgba(239, 68, 68, 0.5)" };
  };

  const status = getBalanceStatus();

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
      <div
        className="backdrop-blur-sm bg-black/40 border border-white/20 rounded-lg px-6 py-4 min-w-[320px]"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs uppercase tracking-widest text-white/60 font-mono">
              City Health
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40 font-mono">{emotionCount} Signals</span>
          </div>
        </div>

        {/* Balance Indicator */}
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-xs text-white/50 font-mono">Balance Level</span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-light tracking-tight"
                style={{ color: status.color, textShadow: status.glow }}
              >
                {balance}%
              </span>
              <span className="text-xs text-white/40 font-mono mb-1">{status.label}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${balance}%`,
                background: `linear-gradient(90deg, ${status.color}, ${status.color}dd)`,
                boxShadow: status.glow,
              }}
            >
              <div
                className="h-full w-full animate-pulse"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            {balance >= 70
              ? "Your emotional landscape is in harmony"
              : balance >= 50
              ? "Minor fluctuations detected in the city"
              : "Significant emotional turbulence observed"}
          </p>
        </div>
      </div>
    </div>
  );
}
