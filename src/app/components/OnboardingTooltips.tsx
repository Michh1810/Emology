import { useState, useEffect } from "react";
import { X, ChevronRight, Sparkles } from "lucide-react";

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
  offset?: { x: number; y: number };
}

const TOOLTIP_STEPS: TooltipStep[] = [
  {
    id: "buildings",
    title: "Emotion Buildings",
    description: "Click a building to view detailed emotion insights and track your emotional state.",
    targetSelector: ".city-map-canvas",
    position: "right",
    offset: { x: 100, y: -50 },
  },
  {
    id: "city-health",
    title: "City Health",
    description: "This shows the overall balance of your emotional city. Click to view more details.",
    targetSelector: ".city-health-island",
    position: "bottom",
  },
  {
    id: "camera-control",
    title: "Camera Control",
    description: "Drag the joystick to rotate and explore your city from different angles.",
    targetSelector: ".camera-joystick",
    position: "left",
    offset: { x: 0, y: -80 },
  },
  {
    id: "logout",
    title: "Session Control",
    description: "You can log out here at any time to secure your account.",
    targetSelector: ".logout-button",
    position: "bottom",
  },
];

interface OnboardingTooltipsProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTooltips({ open, onClose }: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Calculate tooltip position based on target element
  useEffect(() => {
    if (!open) return;

    const currentTooltip = TOOLTIP_STEPS[currentStep];
    
    const updatePosition = () => {
      const target = document.querySelector(currentTooltip.targetSelector);
      if (!target) {
        setTimeout(updatePosition, 100);
        return;
      }

      const rect = target.getBoundingClientRect();

      const tooltipWidth = 340;
      const tooltipHeight = 180;
      const padding = 20;
      let x = 0;
      let y = 0;

      switch (currentTooltip.position) {
        case "top":
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - padding;
          break;
        case "bottom":
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + padding;
          break;
        case "left":
          x = rect.left - tooltipWidth - padding;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
        case "right":
          x = rect.right + padding;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
      }

      if (currentTooltip.offset) {
        x += currentTooltip.offset.x;
        y += currentTooltip.offset.y;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      x = Math.max(padding, Math.min(x, viewportWidth - tooltipWidth - padding));
      y = Math.max(padding, Math.min(y, viewportHeight - tooltipHeight - padding));

      setTooltipPosition({ x, y });
      setIsVisible(true);
    };

    setIsVisible(false);
    setTimeout(updatePosition, 50);

    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [currentStep, open]);

  const handleNext = () => {
    const isLastStep = currentStep === TOOLTIP_STEPS.length - 1;
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem("emology_tooltips_completed", "true");
      onClose();
    }, 300);
  };

  if (!open) {
    return null;
  }

  const currentTooltip = TOOLTIP_STEPS[currentStep];
  const isLastStep = currentStep === TOOLTIP_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOOLTIP_STEPS.length) * 100;

  const getArrowStyle = (): React.CSSProperties => {
    const arrowSize = 8;
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
      borderStyle: "solid",
    };

    switch (currentTooltip.position) {
      case "top":
        return {
          ...baseStyle,
          bottom: -arrowSize,
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: "rgba(20, 20, 30, 0.95) transparent transparent transparent",
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
        };
      case "bottom":
        return {
          ...baseStyle,
          top: -arrowSize,
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: "transparent transparent rgba(20, 20, 30, 0.95) transparent",
          filter: "drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.3))",
        };
      case "left":
        return {
          ...baseStyle,
          right: -arrowSize,
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: "transparent transparent transparent rgba(20, 20, 30, 0.95)",
          filter: "drop-shadow(2px 0 4px rgba(0, 0, 0, 0.3))",
        };
      case "right":
        return {
          ...baseStyle,
          left: -arrowSize,
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: "transparent rgba(20, 20, 30, 0.95) transparent transparent",
          filter: "drop-shadow(-2px 0 4px rgba(0, 0, 0, 0.3))",
        };
    }
  };

  return (
    <>
      {/* Tooltip Card - Glassmorphism Design */}
      <div
        className="fixed z-50 pointer-events-auto transition-all duration-500 ease-out"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          opacity: isVisible ? 1 : 0,
          transform: isVisible 
            ? "translateY(0)" 
            : "translateY(8px)",
        }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: "340px",
            background: "rgba(20, 20, 30, 0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.05) inset,
              0 0 60px rgba(59, 130, 246, 0.15)
            `,
          }}
        >
          {/* Subtle gradient accent on top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            }}
          />

          {/* Ambient glow effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08), transparent 60%)",
            }}
          />

          {/* Arrow pointing to target */}
          <div style={getArrowStyle()} />

          {/* Content */}
          <div className="relative p-5">
            {/* Header with icon and close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <span 
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{
                    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Quick Tour
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-white/40 hover:text-white/80 transition-all rounded-lg p-1.5 hover:bg-white/10"
                aria-label="Skip tutorial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title and description */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                {currentTooltip.title}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {currentTooltip.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/50">
                  {currentStep + 1} / {TOOLTIP_STEPS.length}
                </span>
                <span className="text-xs font-semibold text-blue-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div 
                className="h-1 rounded-full overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="text-sm text-white/50 hover:text-white/80 font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                }}
              >
                {isLastStep ? (
                  <>
                    <span>Get Started</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}