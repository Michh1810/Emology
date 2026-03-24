import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg bg-[#0d0d12] border-white/20 text-white p-0 overflow-hidden"
        style={{
          boxShadow: "0 0 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* Header with gradient accent */}
        <div className="relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(147,51,234,0.3) 100%)",
            }}
          />
          <div className="relative px-8 pt-10 pb-6">
            <DialogTitle className="text-3xl font-light tracking-tight text-center mb-2">
              Welcome To Your Emotion City
            </DialogTitle>
            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className="mb-8">
            <DialogDescription className="text-white/70 text-center leading-relaxed">
              This city reflects your emotional landscape. Each building represents a different emotion detected from your facial signals. Over time, the city evolves as your emotions change.
            </DialogDescription>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 text-center leading-relaxed">
              This app visualizes emotional signals to help you better understand your emotional patterns. It is designed for self-awareness and reflection only and is not intended to diagnose or treat mental health conditions.
            </p>
          </div>

          {/* Emotion indicators */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <EmotionCard emoji="😊" label="Joy" color="from-yellow-400/20 to-orange-400/20" />
            <EmotionCard emoji="😢" label="Sadness" color="from-blue-400/20 to-blue-600/20" />
            <EmotionCard emoji="😠" label="Anger" color="from-red-400/20 to-red-600/20" />
            <EmotionCard emoji="😨" label="Fear" color="from-purple-400/20 to-purple-600/20" />
            <EmotionCard emoji="🤢" label="Disgust" color="from-green-400/20 to-green-600/20" />
            <EmotionCard emoji="😒" label="Envy" color="from-teal-400/20 to-teal-600/20" />
          </div>

          {/* Action button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-white border border-white/20 hover:border-white/40 transition-all duration-300 h-12"
          >
            <span className="tracking-wider uppercase text-sm font-mono">
              Explore My City
            </span>
          </Button>

          {/* Footer hint */}
          <p className="text-xs text-white/30 text-center mt-6 font-mono tracking-wide">
            Use the camera control to navigate your city
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmotionCard({
  emoji,
  label,
  color,
}: {
  emoji: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br ${color} border border-white/10 backdrop-blur-sm`}
    >
      <span className="text-2xl mb-1">{emoji}</span>
      <span className="text-xs text-white/60 tracking-wide">{label}</span>
    </div>
  );
}