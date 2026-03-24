import { useEffect, useState, useRef } from "react";
import { Emotion } from "./EmotionInsightPanel";
import { ActionSuggestionPanel } from "./ActionSuggestionPanel";
import { toast } from "sonner";
import * as THREE from "three";

interface EmotionAlertSystemProps {
  emotions: Emotion[];
  onBuildingClick: (emotion: Emotion) => void;
  buildingPositions: Array<{ emotion: Emotion; x: number; z: number; height: number }>;
  camera: THREE.Camera | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ALERT_THRESHOLD = 90;

export function EmotionAlertSystem({ 
  emotions, 
  onBuildingClick,
  buildingPositions,
  camera,
  containerRef
}: EmotionAlertSystemProps) {
  const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());
  const [selectedAlertEmotion, setSelectedAlertEmotion] = useState<Emotion | null>(null);
  const [notifiedEmotions, setNotifiedEmotions] = useState<Set<string>>(new Set());
  const [indicatorPositions, setIndicatorPositions] = useState<Record<string, { x: number; y: number }>>({});
  const animationFrameRef = useRef<number>();

  // Monitor emotions for alerts
  useEffect(() => {
    const newAlerts = new Set<string>();
    const newlyTriggered: Emotion[] = [];

    emotions.forEach((emotion) => {
      if ((emotion.value ?? 0) >= ALERT_THRESHOLD) {
        newAlerts.add(emotion.name);
        
        // Check if this is a new alert (not previously notified)
        if (!notifiedEmotions.has(emotion.name)) {
          newlyTriggered.push(emotion);
        }
      }
    });

    // Show toast notifications for newly triggered alerts
    newlyTriggered.forEach((emotion) => {
      toast.error(`Emotion Alert: ${emotion.name} spike detected`, {
        description: `Your ${emotion.name} level is at ${emotion.value ?? 0}%. Click the alert icon for suggestions.`,
        duration: 5000,
        style: {
          background: '#0a0a0a',
          border: `1px solid ${emotion.color}60`,
          color: '#fff',
        },
      });
    });

    // Update notified emotions
    if (newlyTriggered.length > 0) {
      setNotifiedEmotions(prev => {
        const updated = new Set(prev);
        newlyTriggered.forEach(e => updated.add(e.name));
        return updated;
      });
    }

    // Remove from notified if emotion goes below threshold
    emotions.forEach((emotion) => {
      if ((emotion.value ?? 0) < ALERT_THRESHOLD && notifiedEmotions.has(emotion.name)) {
        setNotifiedEmotions(prev => {
          const updated = new Set(prev);
          updated.delete(emotion.name);
          return updated;
        });
      }
    });

    setActiveAlerts(newAlerts);
  }, [emotions]);

  // Update indicator positions based on 3D building positions
  useEffect(() => {
    if (!camera || !containerRef.current) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container || !camera) return;

      const rect = container.getBoundingClientRect();
      const newPositions: Record<string, { x: number; y: number }> = {};

      buildingPositions.forEach(({ emotion, x, z, height }) => {
        if (!activeAlerts.has(emotion.name)) return;

        // Create a 3D vector at the top-right corner of the building (above the building)
        const offsetX = 2.5; // Right offset
        const offsetY = height + 2; // Above the building
        const offsetZ = -2.5; // Forward offset
        
        const worldPosition = new THREE.Vector3(x + offsetX, offsetY, z + offsetZ);
        
        // Project to screen coordinates
        const projected = worldPosition.project(camera);
        
        // Convert to screen pixels
        const screenX = (projected.x * 0.5 + 0.5) * rect.width;
        const screenY = (-(projected.y * 0.5) + 0.5) * rect.height;

        newPositions[emotion.name] = { x: screenX, y: screenY };
      });

      setIndicatorPositions(newPositions);
      animationFrameRef.current = requestAnimationFrame(updatePositions);
    };

    updatePositions();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [camera, containerRef, buildingPositions, activeAlerts]);

  const handleActionStart = (action: string) => {
    if (!selectedAlertEmotion) return;

    // Close the suggestion panel
    setSelectedAlertEmotion(null);

    // Show confirmation toast
    toast.success(`Starting: ${getActionName(action)}`, {
      description: `Great choice! This exercise can help manage your ${selectedAlertEmotion.name}.`,
      duration: 3000,
    });

    // Here you could navigate to an exercise page or start a timer
    console.log(`Starting action: ${action} for emotion: ${selectedAlertEmotion.name}`);
  };

  return (
    <>
      {/* Alert Indicators - Positioned using projected 3D coordinates */}
      {emotions.map((emotion) => {
        if (!activeAlerts.has(emotion.name)) return null;
        
        const position = indicatorPositions[emotion.name];
        if (!position) return null;

        return (
          <div
            key={emotion.name}
            className="alert-indicator-container"
            style={{
              position: "absolute",
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 30,
              pointerEvents: "auto",
            }}
          >
            <button
              onClick={() => setSelectedAlertEmotion(emotion)}
              className="alert-indicator-button"
              style={{
                background: `radial-gradient(circle, #ff4444, #ff6b00)`,
                border: `3px solid #fff`,
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: `
                  0 0 30px rgba(255, 68, 68, 0.9),
                  0 0 60px rgba(255, 107, 0, 0.6),
                  0 4px 15px rgba(0, 0, 0, 0.5),
                  inset 0 0 20px rgba(255, 255, 255, 0.3)
                `,
                animation: "alertPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, alertBounce 2s ease-in-out infinite",
                position: "relative",
                overflow: "visible",
              }}
              aria-label={`Alert for ${emotion.name}`}
            >
              {/* Glow ring effect */}
              <div
                style={{
                  position: "absolute",
                  inset: "-8px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255, 68, 68, 0.4), transparent 70%)",
                  animation: "alertGlow 2s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              
              {/* Exclamation mark */}
              <span 
                className="text-white text-2xl font-bold"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  filter: "drop-shadow(0 0 3px rgba(255,255,255,0.8))",
                }}
              >
                !
              </span>
            </button>
          </div>
        );
      })}

      {/* Action Suggestion Panel */}
      {selectedAlertEmotion && (
        <ActionSuggestionPanel
          emotion={selectedAlertEmotion}
          onClose={() => setSelectedAlertEmotion(null)}
          onActionStart={handleActionStart}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes alertPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.9;
          }
        }

        @keyframes alertBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes alertGlow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .alert-indicator-button:hover {
          transform: scale(1.1);
          box-shadow: 
            0 0 40px rgba(255, 68, 68, 1),
            0 0 80px rgba(255, 107, 0, 0.8),
            0 6px 20px rgba(0, 0, 0, 0.6),
            inset 0 0 25px rgba(255, 255, 255, 0.4) !important;
        }

        .alert-indicator-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
}

function getActionName(action: string): string {
  const actionNames: Record<string, string> = {
    breathing_reset: "Breathing Reset Exercise",
    take_walk: "Short Walk Break",
    journal_trigger: "Trigger Journaling",
    positive_moment: "Positive Moment Reflection",
    reach_out: "Connect with Someone",
    gratitude: "Gratitude Practice",
    grounding_exercise: "Grounding Exercise",
    worry_journal: "Worry Journaling",
    calm_breathing: "Calming Breathing",
    capture_moment: "Moment Capture",
    share_joy: "Share Your Joy",
    reflect_joy: "Joy Reflection",
    identify_source: "Source Identification",
    take_break: "Take a Break",
    walk_outside: "Outdoor Walk",
    gratitude_list: "Gratitude List",
    focus_goals: "Goal Focus Exercise",
    self_compassion: "Self-Compassion Meditation",
  };
  
  return actionNames[action] || action;
}