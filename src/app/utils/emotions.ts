import { Emotion } from "../components/EmotionInsightPanel";

export const EMOTIONS: Emotion[] = [
  {
    name: "Joy",
    intensity: "medium",
    color: "#facc15",
    description: "Your emotional signals suggest elevated joy and positive energy, enhancing creativity and social connection.",
    insights: [
      "Heightened optimism detected in facial patterns",
      "Social engagement signals are strong",
      "Creative neural pathways are active",
    ],
    exercises: [
      "💫 Capture this moment in a gratitude journal",
      "🎨 Channel this energy into a creative project",
      "🤝 Share this positivity with someone close",
    ],
  },
  {
    name: "Anger",
    intensity: "high",
    color: "#ef4444",
    description: "Your emotional signals suggest elevated anger which may affect focus and decision-making clarity.",
    insights: [
      "Tension patterns detected in jaw and brow regions",
      "Elevated stress markers in facial signals",
      "Focus and patience may be compromised",
    ],
    exercises: [
      "🫁 30-second breathing reset (4-7-8 technique)",
      "🧘 Short grounding exercise - name 5 things you see",
      "🚶 Take a brief walk to reset your nervous system",
    ],
  },
  {
    name: "Sadness",
    intensity: "medium",
    color: "#3b82f6",
    description: "Your emotional signals indicate sadness which may benefit from gentle self-reflection and connection.",
    insights: [
      "Withdrawn expression patterns detected",
      "Energy levels appear diminished",
      "Social withdrawal signals present",
    ],
    exercises: [
      "📝 Write down one positive moment from today",
      "🌟 Practice gratitude reflection for 2 minutes",
      "💬 Reach out to a trusted friend or family member",
    ],
  },
  {
    name: "Fear",
    intensity: "low",
    color: "#8b5cf6",
    description: "Your emotional signals show mild anxiety which can be channeled into productive planning and preparation.",
    insights: [
      "Anticipatory stress patterns detected",
      "Heightened alertness in facial signals",
      "Decision avoidance may be present",
    ],
    exercises: [
      "✅ Identify one small action you can take right now",
      "🗣️ Name your fear out loud to reduce its power",
      "🧩 Break down your concern into manageable steps",
    ],
  },
  {
    name: "Disgust",
    intensity: "low",
    color: "#22c55e",
    description: "Your emotional signals indicate mild disgust, which may relate to boundary-setting or value alignment.",
    insights: [
      "Rejection patterns in facial expressions",
      "Strong preference signals detected",
      "Boundary awareness is heightened",
    ],
    exercises: [
      "🛡️ Identify what boundary needs to be set",
      "🔍 Reflect on what values are being challenged",
      "🌱 Consider what environment would feel better",
    ],
  },
  {
    name: "Envy",
    intensity: "medium",
    color: "#06b6d4",
    description: "Your emotional signals suggest comparative thinking which can be redirected into personal growth motivation.",
    insights: [
      "Comparative thought patterns detected",
      "Achievement focus is heightened",
      "Self-evaluation signals are strong",
    ],
    exercises: [
      "🎯 Identify one skill you'd like to develop",
      "🏆 Celebrate one of your recent accomplishments",
      "🔄 Shift focus from comparison to personal progress",
    ],
  },
];

// Simulate emotion intensity changes over time
export function getRandomIntensity(): "low" | "medium" | "high" {
  const rand = Math.random();
  if (rand < 0.4) return "low";
  if (rand < 0.8) return "medium";
  return "high";
}

// Calculate overall city balance based on emotion intensities
export function calculateCityBalance(emotions: Emotion[]): number {
  const intensityScores = {
    low: 100,
    medium: 70,
    high: 40,
  };

  const totalScore = emotions.reduce((sum, emotion) => {
    return sum + intensityScores[emotion.intensity];
  }, 0);

  const maxScore = emotions.length * 100;
  return Math.round((totalScore / maxScore) * 100);
}
