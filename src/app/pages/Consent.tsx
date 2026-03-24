import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { isAuthenticated } from "../utils/auth";

export default function Consent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !consent) {
      return;
    }

    setIsLoading(true);

    // Store user's name in localStorage
    localStorage.setItem("emotion_city_user_name", name.trim());
    localStorage.setItem("emotion_city_consent_given", "true");

    navigate("/scan");
  };

  const canContinue = name.trim().length > 0 && consent;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d0d12] flex items-center justify-center">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 animate-pulse" style={{ animationDuration: "4s" }} />
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 70% at 50% 50%,
              rgba(13,13,18,0) 0%,
              rgba(13,13,18,0.3) 50%,
              rgba(13,13,18,0.8) 100%)
          `,
        }}
      />

      {/* Consent form */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light tracking-tight text-white mb-3">
            EMOLOGY
          </h1>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4" />
          <p className="text-sm text-white/40 tracking-widest uppercase font-mono">
            Consent & Privacy
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleContinue} className="space-y-6">
          <div
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-8 shadow-2xl"
            style={{
              boxShadow: "0 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Name field */}
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="name"
                className="text-xs uppercase tracking-widest text-white/60 font-mono"
              >
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                required
                disabled={isLoading}
              />
            </div>

            {/* Consent checkbox */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/30 bg-black/40 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 cursor-pointer"
                  disabled={isLoading}
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-white/70 leading-relaxed cursor-pointer"
                >
                  I understand that Emotion City analyzes facial signals to estimate emotional states and I consent to this process.
                </label>
              </div>
              
              {/* Explanation text */}
              <div className="pl-7">
                <p className="text-xs text-white/40 leading-relaxed">
                  Your emotional data will only be used to generate your personal Emotion City and help provide insights.
                </p>
              </div>
            </div>

            {/* Continue button */}
            <Button
              type="submit"
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all duration-300 h-11 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!canContinue || isLoading}
            >
              <span className="tracking-wider uppercase text-sm font-mono">
                {isLoading ? "Processing..." : "Continue to Scan"}
              </span>
            </Button>
          </div>
        </form>

        {/* Footer text */}
        <div className="text-center mt-8">
          <p className="text-xs text-white/30 font-mono tracking-wide leading-relaxed">
            Your privacy is important. All emotion data is processed locally<br/>and stored only on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
