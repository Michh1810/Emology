import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { createAccount, login, isAuthenticated } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/city");
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = login(email, password);
    if (result.success) {
      navigate("/consent");
    } else {
      setError(result.error || "Login failed");
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setError("");
    setIsLoading(true);

    const result = createAccount(email, password);
    if (result.success) {
      navigate("/consent");
    } else {
      setError(result.error || "Account creation failed");
      setIsLoading(false);
    }
  };

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

      {/* Login form */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light tracking-tight text-white mb-3">
            EMOLOGY
          </h1>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4" />
          <p className="text-sm text-white/40 tracking-widest uppercase font-mono">
            Neural Mapping System
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-8 shadow-2xl"
            style={{
              boxShadow: "0 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Email field */}
            <div className="space-y-2 mb-5">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-widest text-white/60 font-mono"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-white/60 font-mono"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400 text-center font-mono">
                  {error}
                </p>
              </div>
            )}

            {/* Login button */}
            <Button
              type="submit"
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all duration-300 h-11"
              disabled={isLoading}
            >
              <span className="tracking-wider uppercase text-sm font-mono">
                {isLoading ? "Processing..." : "Login"}
              </span>
            </Button>
          </div>

          {/* Create Account button */}
          <Button
            type="button"
            onClick={handleCreateAccount}
            variant="ghost"
            className="w-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-300 h-11"
            disabled={isLoading}
          >
            <span className="tracking-wider uppercase text-xs font-mono">
              Create Account
            </span>
          </Button>
        </form>

        {/* Footer text */}
        <div className="text-center mt-12">
          <p className="text-xs text-white/20 font-mono tracking-wide">
            Emology — Emotion Mapping System
          </p>
        </div>
      </div>
    </div>
  );
}