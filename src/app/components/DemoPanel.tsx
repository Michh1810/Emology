import { useState, useEffect } from "react";
import { Emotion } from "./EmotionInsightPanel";
import { X, Sliders } from "lucide-react";

interface DemoPanelProps {
  emotions: Emotion[];
  onEmotionChange: (emotions: Emotion[]) => void;
}

export function DemoPanel({ emotions, onEmotionChange }: DemoPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D
      if (e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSliderChange = (emotionName: string, value: number) => {
    const updatedEmotions = emotions.map((emotion) => {
      if (emotion.name === emotionName) {
        // Determine intensity based on value
        let intensity: "low" | "medium" | "high";
        if (value < 33) {
          intensity = "low";
        } else if (value < 67) {
          intensity = "medium";
        } else {
          intensity = "high";
        }

        return {
          ...emotion,
          value,
          intensity,
        };
      }
      return emotion;
    });

    onEmotionChange(updatedEmotions);
  };

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-8 z-50 w-80 backdrop-blur-md bg-black/80 border border-white/20 rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-widest text-white/80 font-mono">
            Demo Mode
          </h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {emotions.map((emotion) => (
          <div key={emotion.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-white/70">
                {emotion.name}
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${emotion.color}20`,
                    color: emotion.color,
                    border: `1px solid ${emotion.color}40`,
                  }}
                >
                  {emotion.value}
                </span>
                <span className="text-xs text-white/40 font-mono w-14 text-right">
                  {emotion.intensity}
                </span>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={emotion.value}
                onChange={(e) =>
                  handleSliderChange(emotion.name, parseInt(e.target.value))
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${emotion.color}40 0%, ${emotion.color}80 ${emotion.value}%, rgba(255,255,255,0.1) ${emotion.value}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              {/* Intensity markers */}
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[8px] text-white/20 font-mono">LOW</span>
                <span className="text-[8px] text-white/20 font-mono">MED</span>
                <span className="text-[8px] text-white/20 font-mono">HIGH</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/40 text-center font-mono">
          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">D</kbd> to toggle
        </p>
      </div>

      {/* Custom styles for range input */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          border: 2px solid rgba(0,0,0,0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          border: 2px solid rgba(0,0,0,0.3);
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px rgba(255,255,255,0.8);
        }

        input[type="range"]::-moz-range-thumb:hover {
          box-shadow: 0 0 15px rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  );
}
