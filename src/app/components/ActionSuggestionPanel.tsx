import { X, Play, RotateCcw, CheckCircle } from "lucide-react";
import { Emotion } from "./EmotionInsightPanel";
import { Button } from "./ui/button";

interface ActionSuggestionPanelProps {
  emotion: Emotion;
  onClose: () => void;
  onActionStart: (action: string) => void;
}

const EMOTION_ACTIONS: Record<string, Array<{ title: string; action: string; icon: typeof Play }>> = {
  Anger: [
    { title: "Take a 30-second breathing reset", action: "breathing_reset", icon: RotateCcw },
    { title: "Step away and take a short walk", action: "take_walk", icon: Play },
    { title: "Write down what triggered the emotion", action: "journal_trigger", icon: CheckCircle },
  ],
  Sadness: [
    { title: "Write one positive moment from today", action: "positive_moment", icon: CheckCircle },
    { title: "Reach out to a friend or family member", action: "reach_out", icon: Play },
    { title: "Try a short gratitude reflection", action: "gratitude", icon: RotateCcw },
  ],
  Fear: [
    { title: "Practice grounding: name 5 things you see", action: "grounding_exercise", icon: Play },
    { title: "Write down your worries to externalize them", action: "worry_journal", icon: CheckCircle },
    { title: "Try a calming breathing exercise", action: "calm_breathing", icon: RotateCcw },
  ],
  Joy: [
    { title: "Capture this moment in a journal", action: "capture_moment", icon: CheckCircle },
    { title: "Share your joy with someone", action: "share_joy", icon: Play },
    { title: "Reflect on what created this feeling", action: "reflect_joy", icon: RotateCcw },
  ],
  Disgust: [
    { title: "Identify the source of discomfort", action: "identify_source", icon: CheckCircle },
    { title: "Take a break from the situation", action: "take_break", icon: Play },
    { title: "Reset with a short walk outside", action: "walk_outside", icon: RotateCcw },
  ],
  Envy: [
    { title: "List three things you're grateful for", action: "gratitude_list", icon: CheckCircle },
    { title: "Focus on your own goals and progress", action: "focus_goals", icon: Play },
    { title: "Practice self-compassion meditation", action: "self_compassion", icon: RotateCcw },
  ],
};

export function ActionSuggestionPanel({ emotion, onClose, onActionStart }: ActionSuggestionPanelProps) {
  const actions = EMOTION_ACTIONS[emotion.name] || [];

  return (
    <div 
      className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-96 backdrop-blur-md bg-black border border-white/20 rounded-lg shadow-2xl"
      style={{
        boxShadow: `0 0 30px rgba(0,0,0,0.6), 0 0 60px ${emotion.color}40, inset 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: `${emotion.color}30`,
              border: `1px solid ${emotion.color}60`,
              boxShadow: `0 0 15px ${emotion.color}40`,
            }}
          >
            <span className="text-lg">⚠️</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {emotion.name} Alert
            </h3>
            <p className="text-xs text-white/50 font-mono">
              Intensity: {emotion.value}%
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm text-white/70">
          Your <span style={{ color: emotion.color, fontWeight: 600 }}>{emotion.name}</span> level is elevated. 
          Try one of these actions to help rebalance:
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-4 space-y-2">
        {actions.map((actionItem, index) => {
          const Icon = actionItem.icon;
          return (
            <Button
              key={index}
              onClick={() => onActionStart(actionItem.action)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4 bg-black border-white/10 hover:border-white/30 hover:bg-black/80 transition-all group"
            >
              <div className="flex items-center gap-3 w-full">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ 
                    backgroundColor: `${emotion.color}20`,
                    border: `1px solid ${emotion.color}40`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: emotion.color }} />
                </div>
                <span className="text-sm text-white group-hover:text-white flex-1">
                  {actionItem.title}
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/20">
        <p className="text-xs text-white/40 text-center">
          Click on the building to view detailed insights
        </p>
      </div>
    </div>
  );
}