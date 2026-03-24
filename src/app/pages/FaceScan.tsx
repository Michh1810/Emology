import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated } from "../utils/auth";

type ScanPhase = "initializing" | "scanning" | "analyzing" | "complete";

export default function FaceScan() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ScanPhase>("initializing");
  const [instruction, setInstruction] = useState("Initializing camera...");
  const [progress, setProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    // Request camera access
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setShowCamera(true);
      } catch (err) {
        console.log("Camera access denied or unavailable, using placeholder");
        setShowCamera(false);
      }
    };

    initCamera();

    // Cleanup camera on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const timeline = [
      { time: 500, phase: "scanning" as ScanPhase, instruction: "Position your face in the frame", progress: 0 },
      { time: 2500, phase: "scanning" as ScanPhase, instruction: "Move your head slightly", progress: 15 },
      { time: 4500, phase: "scanning" as ScanPhase, instruction: "Look left", progress: 35 },
      { time: 6500, phase: "scanning" as ScanPhase, instruction: "Look right", progress: 55 },
      { time: 8500, phase: "analyzing" as ScanPhase, instruction: "Analyzing facial signals...", progress: 70 },
      { time: 10000, phase: "analyzing" as ScanPhase, instruction: "Mapping emotional patterns...", progress: 85 },
      { time: 11500, phase: "complete" as ScanPhase, instruction: "Generating your Emotion City...", progress: 100 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timeline.forEach(({ time, phase, instruction, progress }) => {
      const timeout = setTimeout(() => {
        setPhase(phase);
        setInstruction(instruction);
        setProgress(progress);
      }, time);
      timeouts.push(timeout);
    });

    // Navigate to city after scan complete
    const finalTimeout = setTimeout(() => {
      navigate("/city");
    }, 13000);
    timeouts.push(finalTimeout);

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [navigate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d0d12]">
      {/* Video background (camera feed) */}
      {showCamera && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
        />
      )}

      {/* Fallback gradient background */}
      {!showCamera && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-[#0d0d12] to-purple-950/30" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 60% at 50% 50%,
              rgba(13,13,18,0) 0%,
              rgba(13,13,18,0.5) 60%,
              rgba(13,13,18,0.9) 100%)
          `,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Scanning frame */}
        <div className="relative mb-12">
          {/* Circular scan frame */}
          <div className="relative w-80 h-80">
            {/* Outer ring with rotation animation */}
            <div
              className="absolute inset-0 rounded-full border-2 border-white/20"
              style={{
                animation: phase === "scanning" ? "spin 8s linear infinite" : "none",
              }}
            >
              {/* Corner markers */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-cyan-400/80 rounded-full blur-sm" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-cyan-400/80 rounded-full blur-sm" />
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-cyan-400/80 rounded-full blur-sm" />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-cyan-400/80 rounded-full blur-sm" />
            </div>

            {/* Inner glow ring */}
            <div
              className="absolute inset-4 rounded-full"
              style={{
                background: "radial-gradient(circle, transparent 40%, rgba(6, 182, 212, 0.1) 70%, transparent 100%)",
                boxShadow: "inset 0 0 60px rgba(6, 182, 212, 0.3)",
              }}
            />

            {/* Scanning line effect */}
            {phase === "scanning" && (
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
              >
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent blur-sm"
                  style={{
                    animation: "scan-vertical 2s ease-in-out infinite",
                    top: "50%",
                  }}
                />
              </div>
            )}

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-y-1/2" />
              </div>
            </div>

            {/* Radar sweep (during analysis) */}
            {phase === "analyzing" && (
              <div
                className="absolute inset-8 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0%, rgba(6, 182, 212, 0.5) 10%, transparent 20%)",
                  animation: "spin 1.5s linear infinite",
                }}
              />
            )}
          </div>
        </div>

        {/* Instruction text */}
        <div className="text-center mb-8">
          <p className="text-white text-lg font-light tracking-wide mb-2">
            {instruction}
          </p>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress percentage */}
        <p className="text-white/50 text-sm font-mono tracking-widest">
          {progress}% COMPLETE
        </p>

        {/* Status indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-6">
          <StatusIndicator label="Neural Map" active={phase !== "initializing"} />
          <StatusIndicator label="Emotion Scan" active={phase === "analyzing" || phase === "complete"} />
          <StatusIndicator label="City Gen" active={phase === "complete"} />
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes scan-vertical {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatusIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full transition-all duration-500 ${
          active
            ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            : "bg-white/20"
        }`}
      />
      <span className="text-xs text-white/40 font-mono tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
}