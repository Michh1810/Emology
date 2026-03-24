import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export interface Emotion {
  name: string;
  intensity: "low" | "medium" | "high";
  color: string;
  description: string;
  insights: string[];
  exercises: string[];
}

interface EmotionInsightPanelProps {
  open: boolean;
  onClose: () => void;
  emotion: Emotion | null;
}

export function EmotionInsightPanel({ open, onClose, emotion }: EmotionInsightPanelProps) {
  const [displayEmotion, setDisplayEmotion] = useState<Emotion | null>(emotion);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle smooth content transitions when emotion changes
  useEffect(() => {
    if (emotion && displayEmotion && emotion.name !== displayEmotion.name) {
      // Fade out current content
      setIsTransitioning(true);
      
      // After fade out, update content and fade in
      const timeout = setTimeout(() => {
        setDisplayEmotion(emotion);
        setIsTransitioning(false);
      }, 200);
      
      return () => clearTimeout(timeout);
    } else if (emotion) {
      setDisplayEmotion(emotion);
    }
  }, [emotion, displayEmotion]);

  if (!displayEmotion) return null;

  const intensityColors = {
    low: "from-green-500/20 to-green-600/20 border-green-500/30",
    medium: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
    high: "from-red-500/20 to-red-600/20 border-red-500/30",
  };

  const intensityLabels = {
    low: "Calm",
    medium: "Elevated",
    high: "Intense",
  };

  return (
    <div
      className="fixed top-0 left-0 h-screen w-[38%] bg-[#0d0d12] border-r border-white/20 z-30 overflow-hidden transition-transform duration-700 ease-in-out"
      style={{
        transform: open ? "translateX(0)" : "translateX(-100%)",
        boxShadow: "0 0 60px rgba(0,0,0,0.8)",
      }}
    >
      <div
        className="transition-opacity duration-200"
        style={{ opacity: isTransitioning ? 0.3 : 1 }}
      >
        {/* Header */}
        <div className="relative">
          <div
            className="absolute inset-0 opacity-40 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${displayEmotion.color}40 0%, ${displayEmotion.color}10 100%)`,
            }}
          />
          <div className="relative px-8 pt-10 pb-6">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white/80 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: `${displayEmotion.color}30`,
                  boxShadow: `0 0 30px ${displayEmotion.color}40`,
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full transition-all duration-300" 
                  style={{ background: displayEmotion.color }} 
                />
              </div>
              <div>
                <h2 className="text-3xl font-light tracking-tight text-white/90 mb-1">
                  {displayEmotion.name}
                </h2>
                <p className="text-xs text-white/50 uppercase tracking-wider font-mono">
                  Emotion Signal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-6">
          {/* Intensity Indicator */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-white/50 font-mono">
                Intensity Level
              </span>
              <span className="text-sm font-mono text-white/80">
                {intensityLabels[displayEmotion.intensity]}
              </span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: displayEmotion.intensity === "low" ? "33%" : displayEmotion.intensity === "medium" ? "66%" : "100%",
                  background: displayEmotion.color,
                  boxShadow: `0 0 10px ${displayEmotion.color}`,
                }}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`p-4 rounded-lg bg-gradient-to-br ${intensityColors[displayEmotion.intensity]} border backdrop-blur-sm transition-all duration-300`}
          >
            <p className="text-white/70 text-sm leading-relaxed">
              {displayEmotion.description}
            </p>
          </div>

          {/* Insights */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white/50 font-mono mb-4">
              Detected Patterns
            </h3>
            <div className="space-y-3">
              {displayEmotion.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-all duration-300"
                    style={{ background: displayEmotion.color, boxShadow: `0 0 8px ${displayEmotion.color}` }}
                  />
                  <p className="text-sm text-white/60 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Exercises */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white/50 font-mono mb-4">
              Rebalancing Actions
            </h3>
            <div className="space-y-3 mb-5">
              {displayEmotion.exercises.map((exercise, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {exercise}
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-white border border-white/20 hover:border-white/40 transition-all h-12"
              style={{
                boxShadow: `0 0 20px ${displayEmotion.color}20`,
              }}
            >
              <span className="tracking-wider uppercase text-sm font-mono">
                Start Reset Exercise
              </span>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-xs text-white/40 text-center leading-relaxed">
              This analysis is based on your emotional city patterns. For personalized guidance, consult with a mental health professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}