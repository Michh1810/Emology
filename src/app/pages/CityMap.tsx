import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router";
import { OnboardingModal } from "../components/OnboardingModal";
import { OnboardingTooltips } from "../components/OnboardingTooltips";
import { EmotionInsightPanel, Emotion } from "../components/EmotionInsightPanel";
import { CityHealthIsland } from "../components/CityHealthIsland";
import { DemoPanel } from "../components/DemoPanel";
import { EmotionAlertSystem } from "../components/EmotionAlertSystem";
import { Toaster } from "../components/ui/sonner";
import { isAuthenticated, logout, deleteUserData } from "../utils/auth";
import { Button } from "../components/ui/button";
import { EMOTIONS, calculateCityBalance } from "../utils/emotions";
import { loadModel, fitModelToSize, loadModelWithAnimations } from "../utils/modelLoader";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// MODEL_URLS — drop your hosted .glb / .gltf URL for each emotion here.
//
//  • Leave a value as "" to keep the default procedural box geometry.
//  • Files placed in the /public folder are referenced as "/filename.glb".
//  • External URLs must be CORS-accessible (GitHub raw, CDN, R2, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_URLS: Record<string, string> = {
  Joy:     "https://raw.githubusercontent.com/Michh1810/Emology/main/Joy.glb",
  Anger:   "https://raw.githubusercontent.com/Michh1810/Emology/main/Anger.glb",
  Sadness: "https://raw.githubusercontent.com/Michh1810/Emology/main/Sadness1.glb",
  Fear:    "https://raw.githubusercontent.com/Michh1810/Emology/main/Fear.glb",
  Disgust: "https://raw.githubusercontent.com/Michh1810/Emology/main/Disgust.glb",
  Envy:    "https://raw.githubusercontent.com/Michh1810/Emology/main/Envy.glb",
};

// ─────────────────────────────────────────────────────────────────────────────
// MODEL_COLORS — color options per emotion for loaded models.
//
//  overrideColor   — replaces the model's base color entirely.
//                    Great if your model is grey/white and you want to
//                    paint it with a specific color. e.g. "#7c3aed"
//
//  emissiveColor   — adds a colored glow on top of the original material.
//                    Keeps your textures but adds an inner light effect.
//                    e.g. "#7c3aed"
//
//  emissiveIntensity — glow brightness, 0 (none) to 1+ (very bright).
//                      Defaults to 0.3 if not set.
//
//  Leave both as "" to display the model exactly as exported from Blender.
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_COLORS: Record<string, { overrideColor?: string; emissiveColor?: string; emissiveIntensity?: number }> = {
  Joy:     { emissiveColor: "#FFD731", emissiveIntensity: 0.7 },
  Anger:   { emissiveColor: "#FF5B55", emissiveIntensity: 0.8 },
  Sadness: { emissiveColor: "#4488ff", emissiveIntensity: 0.6 },
  Fear:    { emissiveColor: "#C862FF", emissiveIntensity: 0.6 },
  Disgust: { overrideColor: "#A9CD6D", emissiveColor: "#A9CD6D", emissiveIntensity: 0.9 },
  Envy:    { emissiveColor: "#00D8C9", emissiveIntensity: 0.6 },
};

// ───────────────────────────────────────────��─��───────────────────────────────
// MODEL_SCALES — uniform scale multiplier applied on top of fitModelToSize.
//  1.0 = default fit, 2.0 = twice as large, 3.0 = three times as large, etc.
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_SCALES: Record<string, number> = {
  Joy:     2,
  Anger:   2,
  Sadness: 2,
  Fear:    3,
  Disgust: 2.5,
  Envy:    2.5,
};

const GRID_SIZE = 36;
const HALF = GRID_SIZE / 2;
const KNOB_MAX = 28;
const BUILDING_SIZE = 4; // Each building occupies 4x4 grid cells

// ── Building label data — position + neon colour per emotion ────────────────
const BUILDING_LABEL_DATA: Array<{ name: string; x: number; z: number; color: string }> = [
  { name: "Joy",     x: -10, z: -10, color: "#FFD731" },
  { name: "Anger",   x:  10, z: -10, color: "#FF5B55" },
  { name: "Sadness", x: -10, z:  10, color: "#4488ff" },
  { name: "Fear",    x:  10, z:  10, color: "#C862FF" },
  { name: "Disgust", x:  -6, z:   0, color: "#A9CD6D" },
  { name: "Envy",    x:   6, z:   0, color: "#00D8C9" },
];

// Converts a hex colour string to rgba(r,g,b,alpha)
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Ground glow texture (created once, shared across all buildings) ──────────
// A radial white gradient baked into a CanvasTexture. The MeshBasicMaterial
// then tints it with each emotion's color at render time.
let _groundGlowTexture: THREE.CanvasTexture | null = null;
function getGroundGlowTexture(): THREE.CanvasTexture {
  if (_groundGlowTexture) return _groundGlowTexture;
  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  g.addColorStop(0.00, "rgba(255,255,255,0.95)");
  g.addColorStop(0.18, "rgba(255,255,255,0.72)");
  g.addColorStop(0.40, "rgba(255,255,255,0.35)");
  g.addColorStop(0.68, "rgba(255,255,255,0.10)");
  g.addColorStop(1.00, "rgba(255,255,255,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  _groundGlowTexture = new THREE.CanvasTexture(canvas);
  return _groundGlowTexture;
}

// ── Hover ring texture (bright ring that fades at edges) ─────────────────
let _hoverRingTexture: THREE.CanvasTexture | null = null;
function getHoverRingTexture(): THREE.CanvasTexture {
  if (_hoverRingTexture) return _hoverRingTexture;
  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const cx = SIZE / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  // Transparent center → bright ring → soft fade out
  g.addColorStop(0.00, "rgba(255,255,255,0.0)");
  g.addColorStop(0.45, "rgba(255,255,255,0.0)");
  g.addColorStop(0.58, "rgba(255,255,255,0.25)");
  g.addColorStop(0.68, "rgba(255,255,255,0.9)");
  g.addColorStop(0.76, "rgba(255,255,255,1.0)");
  g.addColorStop(0.84, "rgba(255,255,255,0.7)");
  g.addColorStop(0.92, "rgba(255,255,255,0.2)");
  g.addColorStop(1.00, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  _hoverRingTexture = new THREE.CanvasTexture(canvas);
  return _hoverRingTexture;
}

// Phase offsets so buildings don't all breathe in lock-step
const GLOW_PHASES: Record<string, number> = {
  Joy: 0.0, Anger: 1.05, Sadness: 2.10, Fear: 3.15, Disgust: 4.20, Envy: 5.25,
};

// City bounds - calculated from building positions + building size
const CITY_MIN_X = -12; // Leftmost building at -10, minus half building size (2)
const CITY_MAX_X = 12;  // Rightmost building at 10, plus half building size (2)
const CITY_MIN_Z = -12; // Front building at -10, minus half building size (2)
const CITY_MAX_Z = 12;  // Back building at 10, plus half building size (2)
const CITY_WIDTH = CITY_MAX_X - CITY_MIN_X; // 24 units
const CITY_DEPTH = CITY_MAX_Z - CITY_MIN_Z; // 24 units

// ── Walker constants ─────────────────────────────────────────────────────────
const WALKER_URL = "https://raw.githubusercontent.com/Michh1810/Emology/main/Walking.glb";
const WALKER_SPEED = 0.95;      // world units per second (2× slower)
const WALKER_SCALE = 0.008;      // final height of the figure (world units)
const WALKER_PROXIMITY = 6.5;   // distance to trigger color change
const WALKER_COLOR_NEUTRAL = "#e8e8ff";

type WP = { x: number; z: number };

// 5 distinct, non-crossing closed loops — each shaped to stay on its own lane
const WALKER_PATHS: WP[][] = [
  // Path 0 — outer perimeter ring (12 pts).  4 walkers spaced at 25 % intervals.
  [
    { x: -11, z: -11 }, { x:  -5, z: -14 }, { x:   5, z: -14 }, { x:  11, z: -11 },
    { x:  14, z:  -5 }, { x:  14, z:   5 }, { x:  11, z:  11 }, { x:   5, z:  14 },
    { x:  -5, z:  14 }, { x: -11, z:  11 }, { x: -14, z:   5 }, { x: -14, z:  -5 },
  ],
  // Path 1 — inner oval around the 2 central buildings.  2 walkers at 50 % offset.
  [
    { x: -7, z: -4 }, { x:  0, z: -7 }, { x:  7, z: -4 },
    { x:  7, z:  4 }, { x:  0, z:  7 }, { x: -7, z:  4 },
  ],
  // Path 2 — left-side cluster: Joy → Disgust → Sadness.  1 walker.
  [
    { x: -10, z: -10 }, { x:  -9, z:  -5 }, { x:  -6, z:   0 },
    { x:  -9, z:   5 }, { x: -10, z:  10 }, { x: -12, z:   5 }, { x: -12, z:  -5 },
  ],
  // Path 3 — right-side cluster: Anger → Envy → Fear.  1 walker.
  [
    { x: 10, z: -10 }, { x:  9, z:  -5 }, { x:  6, z:   0 },
    { x:  9, z:   5 }, { x: 10, z:  10 }, { x: 12, z:   5 }, { x: 12, z:  -5 },
  ],
  // Path 4 — central north-south oval through the city core.  2 walkers at 50 % offset.
  [
    { x:  0, z: -10 }, { x:  3, z:  -5 }, { x:  3, z:   5 },
    { x:  0, z:  10 }, { x: -3, z:   5 }, { x: -3, z:  -5 },
  ],
];

// 10 walkers — each gets a path + a phase offset (0–1 fraction along that path)
const WALKER_CONFIGS: Array<{ pathIndex: number; phaseOffset: number }> = [
  { pathIndex: 0, phaseOffset: 0.00 }, // outer ring, 0 °
  { pathIndex: 0, phaseOffset: 0.25 }, // outer ring, 90 °
  { pathIndex: 0, phaseOffset: 0.50 }, // outer ring, 180 °
  { pathIndex: 0, phaseOffset: 0.75 }, // outer ring, 270 °
  { pathIndex: 1, phaseOffset: 0.00 }, // inner oval, front
  { pathIndex: 1, phaseOffset: 0.50 }, // inner oval, back
  { pathIndex: 2, phaseOffset: 0.00 }, // left cluster
  { pathIndex: 3, phaseOffset: 0.00 }, // right cluster
  { pathIndex: 4, phaseOffset: 0.00 }, // central, north
  { pathIndex: 4, phaseOffset: 0.50 }, // central, south
  // ── 10 additional walkers ──
  { pathIndex: 0, phaseOffset: 0.125 }, // outer ring, 45 °
  { pathIndex: 0, phaseOffset: 0.375 }, // outer ring, 135 °
  { pathIndex: 0, phaseOffset: 0.625 }, // outer ring, 225 °
  { pathIndex: 0, phaseOffset: 0.875 }, // outer ring, 315 °
  { pathIndex: 1, phaseOffset: 0.25 },  // inner oval, quarter
  { pathIndex: 1, phaseOffset: 0.75 },  // inner oval, three-quarter
  { pathIndex: 2, phaseOffset: 0.50 },  // left cluster, offset
  { pathIndex: 3, phaseOffset: 0.50 },  // right cluster, offset
  { pathIndex: 4, phaseOffset: 0.25 },  // central, quarter
  { pathIndex: 4, phaseOffset: 0.75 },  // central, three-quarter
];

// Colors keyed to building positions for proximity matching
const BUILDING_PROXIMITY_COLORS: Array<{ x: number; z: number; hex: string }> = [
  { x: -10, z: -10, hex: "#FFD731" }, // Joy
  { x:  10, z: -10, hex: "#FF5B55" }, // Anger
  { x: -10, z:  10, hex: "#4488ff" }, // Sadness
  { x:  10, z:  10, hex: "#C862FF" }, // Fear
  { x:  -6, z:   0, hex: "#A9CD6D" }, // Disgust
  { x:   6, z:   0, hex: "#00D8C9" }, // Envy
];

interface Building {
  mesh: THREE.Mesh;
  emotion: Emotion;
  particles?: THREE.Points;
  hoverGlow?: THREE.Mesh;
  groundGlow?: THREE.Mesh;        // flat radial halo projected on the floor
  pointLight?: THREE.PointLight;  // local light that tints the nearby grid lines
}

export default function CityMap() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const camAngles = useRef({ azimuth: Math.PI / 4, elevation: Math.PI / 3.2 });
  const rafRef = useRef<number>(0);
  const buildingsRef = useRef<Building[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  // Stores GLTF mesh materials per emotion for runtime animation
  const gltfMaterialsRef = useRef<Record<string, THREE.MeshStandardMaterial[]>>({});
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const joyOrigin = useRef({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);

  // ── Walker refs ──────────────────────────────────────────────────────────
  const walkersRef = useRef<{
    group: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    mats: THREE.MeshStandardMaterial[];
    wp: number;        // current waypoint index on its path
    t: number;         // progress [0,1] between wp[n] → wp[n+1]
    color: THREE.Color;
    pathIndex: number;
  }[]>([]);
  const walkerPrevMs = useRef(Date.now());

  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showTooltips, setShowTooltips] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [cityBalance, setCityBalance] = useState(0);
  const [emotions, setEmotions] = useState<Emotion[]>(EMOTIONS);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userName, setUserName] = useState<string>("Your");

  // ── Building labels — keyed by emotion name ──────────────────────────────
  // DOM refs updated each frame so label positions track with camera rotation
  const buildingLabelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Top-Y (world space) for each building, updated after each GLTF loads
  const buildingTopYRefs = useRef<Record<string, number>>(
    Object.fromEntries(BUILDING_LABEL_DATA.map((d) => [d.name, 10]))
  );

  // Helper to assign refs from the map without triggering React warnings
  const setLabelRef = useCallback((name: string) => {
    return (el: HTMLDivElement | null) => {
      buildingLabelRefs.current[name] = el;
    };
  }, []);

  // Building positions for alert system (must match EMOTIONS array order)
  const buildingPositions = emotions.map((emotion, index) => {
    const positions = [
      { x: -10, z: -10 },   // Joy (index 0)
      { x: 10, z: -10 },    // Anger (index 1)
      { x: -10, z: 10 },    // Sadness (index 2)
      { x: 10, z: 10 },     // Fear (index 3)
      { x: -6, z: 0 },      // Disgust (index 4)
      { x: 6, z: 0 },       // Envy (index 5)
    ];
    const pos = positions[index];
    const height = emotion.intensity === "low" ? 3 : emotion.intensity === "medium" ? 5 : 7;
    return {
      emotion,
      x: pos.x,
      z: pos.z,
      height,
    };
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  // Load user's name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("emotion_city_user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // Check if user has already completed the tour on mount
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem("emology_tooltips_completed");
    if (hasCompletedTour) {
      // User has already seen the welcome modal and completed tour
      setShowOnboarding(false);
      setShowTooltips(false);
    }
  }, []);

  // Calculate city balance when emotions change
  useEffect(() => {
    setCityBalance(calculateCityBalance(emotions));
  }, [emotions]);

  // Handle panel state
  useEffect(() => {
    setIsPanelOpen(!!selectedEmotion);
  }, [selectedEmotion]);

  // Trigger resize when panel state changes to recalculate camera bounds
  useEffect(() => {
    // Wait for CSS transition to complete (700ms) before recalculating
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 750); // Wait for transition to finish
    
    return () => clearTimeout(timeout);
  }, [isPanelOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteData = () => {
    deleteUserData();
    navigate("/");
  };

  const handleClosePanel = () => {
    setSelectedEmotion(null);
    // Clear any building highlights
    buildingsRef.current.forEach((b) => {
      if (b.hoverGlow) {
        (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    });
  };

  /* ── Setup Three.js scene once ────────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x080808);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x080808, 50, 150);
    sceneRef.current = scene;

    // Camera (orthographic)
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    cameraRef.current = cam;

    // ���─ Build the optimized grid ────────────────────────────────────────
    const points: number[] = [];
    const gridPadding = 4; // Padding around buildings
    const gridMinX = CITY_MIN_X - gridPadding;
    const gridMaxX = CITY_MAX_X + gridPadding;
    const gridMinZ = CITY_MIN_Z - gridPadding;
    const gridMaxZ = CITY_MAX_Z + gridPadding;
    const gridSteps = 32; // Number of grid lines

    // Create vertical lines (along Z axis)
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      const x = gridMinX + t * (gridMaxX - gridMinX);
      points.push(x, 0, gridMinZ, x, 0, gridMaxZ);
    }

    // Create horizontal lines (along X axis)
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      const z = gridMinZ + t * (gridMaxZ - gridMinZ);
      points.push(gridMinX, 0, z, gridMaxX, 0, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.22,
      transparent: true,
    });
    scene.add(new THREE.LineSegments(geo, mat));

    // ── Add ambient light ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // ── Create Buildings ───────────────────────────────────────────────
    const buildings: Building[] = [];
    // Building positions MUST match EMOTIONS array order: Joy, Anger, Sadness, Fear, Disgust, Envy
    const buildingPositions = [
      { x: -10, z: -10 },   // Joy (index 0)
      { x: 10, z: -10 },    // Anger (index 1)
      { x: -10, z: 10 },    // Sadness (index 2)
      { x: 10, z: 10 },     // Fear (index 3)
      { x: -6, z: 0 },      // Disgust (index 4)
      { x: 6, z: 0 },       // Envy (index 5)
    ];

    emotions.forEach((emotion, index) => {
      const pos = buildingPositions[index];
      const building = createBuilding(emotion, pos.x, pos.z);
      buildings.push(building);
      scene.add(building.mesh);
      if (building.hoverGlow)   scene.add(building.hoverGlow);
      if (building.particles)   scene.add(building.particles);
      if (building.groundGlow)  scene.add(building.groundGlow);
      if (building.pointLight)  scene.add(building.pointLight);
    });

    buildingsRef.current = buildings;

    // ── Async: swap procedural boxes with custom GLTF models ──────────────
    // For each emotion that has a URL in MODEL_URLS, load the model and
    // replace the placeholder box with it. The invisible box is kept as
    // a raycaster hit-target so click / hover events still work.
    const loadedGroups: THREE.Group[] = [];
    emotions.forEach((emotion, index) => {
      const url = MODEL_URLS[emotion.name];
      if (!url) return;

      const building = buildings[index];
      const height = emotion.intensity === "low" ? 3 : emotion.intensity === "medium" ? 5 : 7;
      const pos = buildingPositions[index];

      loadModel(
        url,
        MODEL_COLORS[emotion.name] ?? {}
      )
        .then(({ group, bbox, size }) => {
          // Scale model to fill the same slot as the box geometry
          fitModelToSize(group, bbox, size, BUILDING_SIZE, height);

          // Apply per-emotion scale multiplier on top of the fitted size
          const scaleMult = MODEL_SCALES[emotion.name] ?? 1;
          if (scaleMult !== 1) {
            group.scale.multiplyScalar(scaleMult);
            // IMPORTANT: reset position.y to 0 first — Box3.setFromObject
            // returns world-space coords, so the old P offset from
            // fitModelToSize would compound and push the model underground.
            group.position.y = 0;
            const rescaledBbox = new THREE.Box3().setFromObject(group);
            group.position.y = -rescaledBbox.min.y;
          }

          // Floor-align at the building's grid position
          group.position.set(pos.x, group.position.y, pos.z);

          // Make the placeholder box transparent but keep it for raycasting
          building.mesh.material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });

          scene.add(group);
          loadedGroups.push(group);

          // Record actual model top-Y for every emotion so its label floats correctly
          {
            const lb = new THREE.Box3().setFromObject(group);
            buildingTopYRefs.current[emotion.name] = lb.max.y;
          }

          // Store materials for runtime animation
          const materials: THREE.MeshStandardMaterial[] = [];
          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mat = (child as THREE.Mesh).material;
              if (Array.isArray(mat)) {
                materials.push(...mat);
              } else {
                materials.push(mat);
              }
            }
          });
          gltfMaterialsRef.current[emotion.name] = materials;
        })
        .catch((err) => {
          console.warn(
            `[ModelLoader] Could not load model for ${emotion.name} — using box fallback.\n`,
            err
          );
        });
    });

    // ── Load walker figure ──────────────────────────────────────────────
    loadModelWithAnimations(WALKER_URL)
      .then(({ group: masterGroup, size, animations }) => {
        // Scale factor so the figure is WALKER_SCALE world-units tall
        const uniformScale = WALKER_SCALE / Math.max(size.y, 0.001);

        // Helper — clone master group and paint meshes with neutral colour
        function buildWalkerInstance(cfg: { pathIndex: number; phaseOffset: number }) {
          const path    = WALKER_PATHS[cfg.pathIndex];
          const wpCount = path.length;

          // Determine starting waypoint + sub-segment t from phase offset
          const rawIdx = cfg.phaseOffset * wpCount;
          const wp     = Math.floor(rawIdx) % wpCount;
          const t      = rawIdx % 1;

          const grp = skeletonClone(masterGroup) as THREE.Group;
          grp.scale.setScalar(uniformScale);
          const fb = new THREE.Box3().setFromObject(grp);
          grp.position.y = -fb.min.y;

          // Set initial XZ position on the path
          const from = path[wp];
          const to   = path[(wp + 1) % wpCount];
          grp.position.x = from.x + (to.x - from.x) * t;
          grp.position.z = from.z + (to.z - from.z) * t;

          // Face direction of travel initially
          const dirX = to.x - from.x;
          const dirZ = to.z - from.z;
          if (Math.abs(dirX) + Math.abs(dirZ) > 0.001) {
            grp.rotation.y = Math.atan2(dirX, dirZ);
          }

          // Clone & tint every mesh material
          const mats: THREE.MeshStandardMaterial[] = [];
          grp.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            const src  = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const cloned = src.map((m) => {
              const c = m.clone() as THREE.MeshStandardMaterial;
              c.color            = new THREE.Color(WALKER_COLOR_NEUTRAL);
              c.emissive         = new THREE.Color(WALKER_COLOR_NEUTRAL);
              c.emissiveIntensity = 0.4;
              c.needsUpdate      = true;
              return c;
            });
            mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
            mats.push(...cloned);
          });

          // AnimationMixer — clips reference node names so they work on clones
          let mixer: THREE.AnimationMixer | null = null;
          if (animations && animations.length > 0) {
            mixer = new THREE.AnimationMixer(grp);
            const action = mixer.clipAction(animations[0]);
            action.play();
            // Offset animation phase so figures aren't all in the same pose
            mixer.update(cfg.phaseOffset * animations[0].duration);
          }

          scene.add(grp);
          return { group: grp, mixer, mats, wp, t, color: new THREE.Color(WALKER_COLOR_NEUTRAL), pathIndex: cfg.pathIndex };
        }

        walkersRef.current = WALKER_CONFIGS.map(buildWalkerInstance);
        walkerPrevMs.current = Date.now();
      })
      .catch((err) => {
        console.warn("[Walker] Could not load Walking.glb:", err);
      });

    // ── Sizing & render helpers ───────────────────────────────────────
    const updateCamera = () => {
      const { azimuth, elevation } = camAngles.current;
      const dist = 80;
      cam.position.set(
        dist * Math.cos(elevation) * Math.sin(azimuth),
        dist * Math.sin(elevation),
        dist * Math.cos(elevation) * Math.cos(azimuth)
      );
      // Look at a point above ground to push city lower in the viewport
      cam.lookAt(0, 2, 0);
      cam.updateProjectionMatrix();
    };

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      // Calculate zoom to fit the entire city comfortably with extra padding
      // City spans 24 units in each direction, plus padding to ensure nothing is cut off
      const paddingFactor = 1.15; // Increased padding = smaller city view with comfortable margins
      const cityWidthWithPadding = CITY_WIDTH * paddingFactor;
      const cityDepthWithPadding = CITY_DEPTH * paddingFactor;
      
      // Calculate zoom needed to fit city width and height in viewport
      // Need to account for isometric view - diagonal is longer
      const diagonalFactor = 1.35; // Increased for better isometric diagonal consideration
      const effectiveCitySize = Math.max(cityWidthWithPadding, cityDepthWithPadding) * diagonalFactor;
      
      // Base zoom calculation to fit city in viewport
      let zoom = Math.min(w / effectiveCitySize, h / effectiveCitySize);
      
      cam.left = -w / (2 * zoom);
      cam.right = w / (2 * zoom);
      cam.top = h / (2 * zoom);
      cam.bottom = -h / (2 * zoom);
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    resize();
    updateCamera();
    window.addEventListener("resize", resize);

    // Reusable vector for building label projection (avoids per-frame allocation)
    const buildingLabelVec = new THREE.Vector3();

    // ── Render loop ───────────────────────────────────────────────────
    const animate = () => {
      updateCamera();

      // ── Walker update ──────────────────────────────────────────────
      const nowMs = Date.now();
      const dt = Math.min((nowMs - walkerPrevMs.current) / 1000, 0.1);
      walkerPrevMs.current = nowMs;

      for (const w of walkersRef.current) {
        if (w.mixer) w.mixer.update(dt);

        const path    = WALKER_PATHS[w.pathIndex];
        const wpCount = path.length;

        // Advance along segment
        const cur    = path[w.wp];
        const nxt    = path[(w.wp + 1) % wpCount];
        const sdx    = nxt.x - cur.x;
        const sdz    = nxt.z - cur.z;
        const segLen = Math.sqrt(sdx * sdx + sdz * sdz);

        w.t += (WALKER_SPEED * dt) / Math.max(segLen, 0.001);
        if (w.t >= 1) {
          w.t  -= 1;
          w.wp  = (w.wp + 1) % wpCount;
        }

        const from = path[w.wp];
        const to   = path[(w.wp + 1) % wpCount];
        const newX = from.x + (to.x - from.x) * w.t;
        const newZ = from.z + (to.z - from.z) * w.t;

        // Face direction of travel
        const dirX = to.x - from.x;
        const dirZ = to.z - from.z;
        if (Math.abs(dirX) + Math.abs(dirZ) > 0.001) {
          w.group.rotation.y = Math.atan2(dirX, dirZ);
        }

        w.group.position.x = newX;
        w.group.position.z = newZ;

        // ── Proximity colour ──────────────────────────────────────────
        let closestHex: string | null = null;
        let closestDist = Infinity;
        for (const bpc of BUILDING_PROXIMITY_COLORS) {
          const bdx  = newX - bpc.x;
          const bdz  = newZ - bpc.z;
          const dist = Math.sqrt(bdx * bdx + bdz * bdz);
          if (dist < WALKER_PROXIMITY && dist < closestDist) {
            closestDist = dist;
            closestHex  = bpc.hex;
          }
        }

        const targetColor = new THREE.Color(closestHex ?? WALKER_COLOR_NEUTRAL);
        w.color.lerp(targetColor, 0.06);

        w.mats.forEach((m) => {
          if (!m.isMeshStandardMaterial) return;
          m.color.copy(w.color);
          m.emissive.copy(w.color);
          m.emissiveIntensity = closestHex ? 0.7 : 0.35;
        });
      }

      // Animate buildings
      buildings.forEach((building) => {
        animateBuilding(building);
      });

      renderer.render(scene, cam);

      // ── Project every building top → screen coords, move labels ───
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        for (const ld of BUILDING_LABEL_DATA) {
          const el = buildingLabelRefs.current[ld.name];
          if (!el) continue;
          const topY = buildingTopYRefs.current[ld.name] ?? 10;
          buildingLabelVec.set(ld.x, topY + 1.5, ld.z);
          buildingLabelVec.project(cam);
          const lx = ((buildingLabelVec.x + 1) / 2) * rect.width + rect.left;
          const ly = (-(buildingLabelVec.y - 1) / 2) * rect.height + rect.top;
          el.style.left = `${lx}px`;
          el.style.top  = `${ly}px`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      // Dispose all walkers
      walkersRef.current.forEach((w) => {
        w.group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const mat = (child as THREE.Mesh).material;
            (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
          }
        });
      });
      walkersRef.current = [];
      // Dispose loaded GLTF groups
      loadedGroups.forEach((g) => {
        g.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const mat = (child as THREE.Mesh).material;
            (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
          }
        });
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [emotions]); // Removed isPanelOpen dependency to prevent scene recreation

  // ── Create Building Function ──────────────────────────────────────────
  function createBuilding(emotion: Emotion, x: number, z: number): Building {
    const color = new THREE.Color(emotion.color);
    const height = emotion.intensity === "low" ? 3 : emotion.intensity === "medium" ? 5 : 7;
    const scaleMult = MODEL_SCALES[emotion.name] ?? 1;
    const effectiveSize = BUILDING_SIZE * scaleMult; // actual footprint after model scaling

    // Create main building - now 4x4 to occupy larger grid space
    const geometry = new THREE.BoxGeometry(BUILDING_SIZE, height, BUILDING_SIZE);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: emotion.intensity === "low" ? 0.25 : emotion.intensity === "medium" ? 0.55 : 0.85,
      metalness: 0.3,
      roughness: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (mesh as any).userData = { emotion };

    // Create hover glow - flat ring on the ground that fits any building shape
    const hoverRingSize = effectiveSize * 1.6;
    const hoverGlowGeo = new THREE.PlaneGeometry(hoverRingSize, hoverRingSize);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      map: getHoverRingTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hoverGlow = new THREE.Mesh(hoverGlowGeo, glowMaterial);
    hoverGlow.rotation.x = -Math.PI / 2;
    hoverGlow.position.set(x, 0.04, z); // just above ground glow
    hoverGlow.renderOrder = 2;

    // ── Ground glow halo ──────────────────────────────────────────────
    // Scaled to the actual model footprint so the halo wraps each building properly.
    const glowRadius = effectiveSize * 3.5;
    const groundGlowGeo = new THREE.PlaneGeometry(glowRadius, glowRadius);
    const groundGlowMat = new THREE.MeshBasicMaterial({
      color: color,
      map: getGroundGlowTexture(),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const groundGlow = new THREE.Mesh(groundGlowGeo, groundGlowMat);
    groundGlow.rotation.x = -Math.PI / 2; // lay flat on XZ plane
    groundGlow.position.set(x, 0.02, z);   // just above y=0 to avoid z-fighting

    // ── Point light ───────────────────────────────────────────────────
    // Range and intensity scaled to the model's actual size for proportional illumination.
    const lightRange = effectiveSize * 3;
    const pointLight = new THREE.PointLight(color.getHex(), 2.4, lightRange, 1.5);
    pointLight.position.set(x, 0.6, z);

    // Create particles for effects
    let particles: THREE.Points | undefined;
    if (emotion.intensity === "high" || emotion.intensity === "medium") {
      particles = createParticles(emotion, x, z, height, scaleMult);
    }

    return { mesh, emotion, particles, hoverGlow, groundGlow, pointLight };
  }

  // ── Create Particle System ───────────────────────────────────────────
  function createParticles(emotion: Emotion, x: number, z: number, height: number, scaleMult: number): THREE.Points {
    const particleCount = emotion.intensity === "high" ? 100 : 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Particle spread matches the actual scaled model footprint
    const spreadRadius = (BUILDING_SIZE * scaleMult) / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = x + (Math.random() - 0.5) * spreadRadius * 2;
      positions[i3 + 1] = Math.random() * height;
      positions[i3 + 2] = z + (Math.random() - 0.5) * spreadRadius * 2;

      // Different particle behaviors for different emotions
      if (emotion.name === "Sadness") {
        // Rain falls down
        velocities[i3] = 0;
        velocities[i3 + 1] = -0.02;
        velocities[i3 + 2] = 0;
      } else if (emotion.name === "Anger") {
        // Smoke rises
        velocities[i3] = (Math.random() - 0.5) * 0.01;
        velocities[i3 + 1] = 0.02;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
      } else if (emotion.name === "Joy") {
        // Sparkles float
        velocities[i3] = (Math.random() - 0.5) * 0.02;
        velocities[i3 + 1] = Math.random() * 0.02;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      } else {
        // Default floating
        velocities[i3] = (Math.random() - 0.5) * 0.01;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    (geometry as any).userData = { velocities, baseX: x, baseZ: z, baseHeight: height, emotion };

    const material = new THREE.PointsMaterial({
      color: emotion.color,
      size: emotion.name === "Joy" ? 0.15 : 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  // ── Animate Building ─────────────────────────────────────────────────
  function animateBuilding(building: Building) {
    const time = Date.now() * 0.001;
    const phase = GLOW_PHASES[building.emotion.name] ?? 0;

    // Pulse effect for high intensity procedural buildings
    if (building.emotion.intensity === "high") {
      const pulse = Math.sin(time * 2) * 0.2 + 0.8;
      (building.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 * pulse;

      // Shake for anger
      if (building.emotion.name === "Anger") {
        building.mesh.position.x += Math.sin(time * 10) * 0.02;
        building.mesh.position.z += Math.cos(time * 10) * 0.02;
      }
    }

    // ── Animate ground glow + point light ────────────────────────────
    // Vibrant breathing with wider swing for larger buildings.
    if (building.groundGlow || building.pointLight) {
      const isDisgust  = building.emotion.name === "Disgust";
      const freq       = isDisgust ? 0.9 : 1.6;
      const swing      = isDisgust ? 0.05 : 0.08;
      const baseOpacity =
        building.emotion.intensity === "high"   ? 0.39 :
        building.emotion.intensity === "medium" ? 0.31 : 0.25;

      const breathe = Math.sin(time * freq + phase) * swing + baseOpacity;

      if (building.groundGlow) {
        (building.groundGlow.material as THREE.MeshBasicMaterial).opacity = breathe;
      }
      if (building.pointLight) {
        building.pointLight.intensity = breathe * 1.6;
      }
    }

    // Animate particles
    if (building.particles) {
      const positions = building.particles.geometry.attributes.position.array as Float32Array;
      const velocities = (building.particles.geometry as any).userData.velocities;
      const baseX = (building.particles.geometry as any).userData.baseX;
      const baseZ = (building.particles.geometry as any).userData.baseZ;
      const baseHeight = (building.particles.geometry as any).userData.baseHeight;
      const emotionScale = MODEL_SCALES[building.emotion.name] ?? 1;
      const spreadRadius = (BUILDING_SIZE * emotionScale) / 2;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Reset particles when they go out of bounds
        if (building.emotion.name === "Sadness" && positions[i + 1] < 0) {
          positions[i] = baseX + (Math.random() - 0.5) * spreadRadius * 2;
          positions[i + 1] = baseHeight;
          positions[i + 2] = baseZ + (Math.random() - 0.5) * spreadRadius * 2;
        } else if (building.emotion.name === "Anger" && positions[i + 1] > baseHeight + 3) {
          positions[i] = baseX + (Math.random() - 0.5) * spreadRadius * 2;
          positions[i + 1] = baseHeight;
          positions[i + 2] = baseZ + (Math.random() - 0.5) * spreadRadius * 2;
        } else if (positions[i + 1] > baseHeight + 2 || positions[i + 1] < 0) {
          positions[i] = baseX + (Math.random() - 0.5) * spreadRadius * 2;
          positions[i + 1] = Math.random() * baseHeight;
          positions[i + 2] = baseZ + (Math.random() - 0.5) * spreadRadius * 2;
        }
      }

      building.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Animate GLTF models — vibrant emissive breathing for all emotions
    const materials = gltfMaterialsRef.current[building.emotion.name];
    if (materials && materials.length > 0) {
      materials.forEach((mat) => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        const sm = mat as THREE.MeshStandardMaterial;

        if (building.emotion.name === "Disgust") {
          // Slow, smooth breathing — ~0.9 Hz so it never looks like on/off flicker
          sm.emissiveIntensity = 0.82 + Math.sin(time * 0.9 + phase) * 0.10;
        } else if (building.emotion.intensity === "high") {
          const pulse = Math.sin(time * 2) * 0.25 + 0.85;
          sm.emissiveIntensity = pulse;
        } else {
          // Medium/low — gentle breathe to keep vibrancy
          const baseEm = building.emotion.intensity === "medium" ? 0.55 : 0.40;
          sm.emissiveIntensity = baseEm + Math.sin(time * 1.6 + phase) * 0.12;
        }
      });
    }
  }

  // ── Mouse Move Handler ──────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to check for building hover
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = buildingsRef.current.map((b) => b.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const building = buildingsRef.current.find((b) => b.mesh === intersects[0].object);
      if (building) {
        // Update hover glow (only if not selected)
        buildingsRef.current.forEach((b) => {
          if (b.hoverGlow) {
            const isSelected = selectedEmotion && b.emotion.name === selectedEmotion.name;
            const isHovered = b.emotion.name === building.emotion.name;
            
            if (isSelected) {
              // Keep selected highlight
              (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0.5;
            } else if (isHovered) {
              // Show hover effect
              (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0.3;
            } else {
              // No effect
              (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }
        });
        
        document.body.style.cursor = "pointer";
      }
    } else {
      buildingsRef.current.forEach((b) => {
        if (b.hoverGlow) {
          const isSelected = selectedEmotion && b.emotion.name === selectedEmotion.name;
          if (isSelected) {
            // Keep selected highlight
            (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0.5;
          } else {
            (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }
      });
      document.body.style.cursor = "default";
    }
  }, [selectedEmotion]);

  // ─ Click Handler ─────────────────────────────────────────────────────
  const handleClick = useCallback((e: MouseEvent) => {
    if (isDragging.current) return;

    const container = containerRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = buildingsRef.current.map((b) => b.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const building = buildingsRef.current.find((b) => b.mesh === intersects[0].object);
      if (building) {
        setSelectedEmotion(building.emotion);
        // Highlight selected building
        buildingsRef.current.forEach((b) => {
          if (b.hoverGlow) {
            if (b.emotion.name === building.emotion.name) {
              (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0.5;
            } else {
              (b.hoverGlow.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }
        });
      }
    }
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleClick);
      document.body.style.cursor = "default";
    };
  }, [handleMouseMove, handleClick]);

  /* ── Joystick handlers ─────────────────────────────────────────────── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = joystickRef.current?.getBoundingClientRect();
      if (!rect) return;
      joyOrigin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      lastPos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = true;
      setActive(true);
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      camAngles.current = {
        azimuth: camAngles.current.azimuth + dx * 0.013,
        elevation: Math.max(
          0.05,
          Math.min(
            Math.PI / 2 - 0.02,
            camAngles.current.elevation - dy * 0.013
          )
        ),
      };

      const ox = e.clientX - joyOrigin.current.x;
      const oy = e.clientY - joyOrigin.current.y;
      const dist = Math.sqrt(ox * ox + oy * oy);
      const clmp = Math.min(dist, KNOB_MAX);
      const ang = Math.atan2(oy, ox);
      setKnob({ x: Math.cos(ang) * clmp, y: Math.sin(ang) * clmp });
    },
    []
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    setActive(false);
    setKnob({ x: 0, y: 0 });
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#080808",
      }}
    >
      {/* City Map Container - Transitions to right when panel opens */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          left: isPanelOpen ? "38%" : "0",
          width: isPanelOpen ? "62%" : "100%",
        }}
      >
        {/* Three.js mounts here - with reduced offset for smaller city appearance */}
        <div ref={containerRef} className="city-map-canvas" style={{ position: "absolute", inset: "5px", top: "65px" }} />

        {/* ── Building Labels — one per emotion, position driven by 3D projection each frame ── */}
        {BUILDING_LABEL_DATA.map((ld) => (
          <div
            key={ld.name}
            ref={setLabelRef(ld.name)}
            className="fixed z-20 pointer-events-none flex flex-col items-center"
            style={{ transform: "translate(-50%, -100%)" }}
          >
            <div
              className="rounded-md px-3 py-1"
              style={{
                background: "rgba(13,13,18,0.80)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${hexToRgba(ld.color, 0.45)}`,
                boxShadow: `0 0 16px ${hexToRgba(ld.color, 0.25)}`,
              }}
            >
              <span
                className="text-xs font-mono tracking-widest uppercase"
                style={{
                  color: ld.color,
                  textShadow: `0 0 10px ${hexToRgba(ld.color, 0.8)}`,
                }}
              >
                {ld.name}
              </span>
            </div>
            {/* Thin connector line pointing down toward the building */}
            <div
              className="w-px h-4"
              style={{ background: `linear-gradient(to bottom, ${hexToRgba(ld.color, 0.6)}, transparent)` }}
            />
          </div>
        ))}

        {/* Vignette overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
            radial-gradient(ellipse 72% 72% at 50% 50%,
              rgba(8,8,8,0) 0%,
              rgba(8,8,8,0.03) 45%,
              rgba(8,8,8,0.20) 65%,
              rgba(8,8,8,0.45) 82%,
              rgba(8,8,8,0.70) 100%),
            radial-gradient(ellipse 85% 85% at 50% 50%,
              rgba(8,8,8,0) 0%,
              rgba(8,8,8,0) 55%,
              rgba(8,8,8,0.25) 100%),
            linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0) 15%),
            linear-gradient(to top, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0) 15%),
            linear-gradient(to right, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0) 15%),
            linear-gradient(to left, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0) 15%)
          `,
          }}
        />

        {/* ── Unified Navigation Bar Row ────────────────────────────────── */}
        <div className="absolute left-0 right-0 z-10 flex items-start px-8 pointer-events-none" style={{ top: "-10px", paddingTop: "32px" }}>
          {/* Left: EMOLOGY title — only shown when detail panel is closed */}
          <div className="pointer-events-auto">
            {!isPanelOpen && (
              <div className="backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2.5">
                <h1 className="font-light tracking-tight text-white/90 drop-shadow-lg" style={{ fontSize: "1.5rem", lineHeight: 1.2, marginBottom: "2px" }}>
                  EMOLOGY
                </h1>
                <p className="text-xs text-white/50 tracking-widest uppercase font-mono drop-shadow-md">
                  {userName}{userName.endsWith('s') ? '\'' : '\'s'} Neural Landscape
                </p>
              </div>
            )}
          </div>

          {/* Center: City Health Island */}
          <div className="flex-1 flex justify-center pointer-events-auto">
            <CityHealthIsland balance={cityBalance} emotionCount={emotions.length} />
          </div>

          {/* Right: Logout and Delete Data buttons */}
          <div className="pointer-events-auto logout-button flex gap-2">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="ghost"
              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10 border border-red-400/20 hover:border-red-400/40 transition-all"
            >
              <span className="tracking-wider uppercase text-xs font-mono">
                Delete Data
              </span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white/50 hover:text-white/80 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            >
              <span className="tracking-wider uppercase text-xs font-mono">
                Logout
              </span>
            </Button>
          </div>
        </div>

        {/* Camera joystick */}
        <div
          className="camera-joystick"
          style={{
            position: "absolute",
            bottom: 36,
            right: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            userSelect: "none",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            camera
          </span>

          <div
            ref={joystickRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: active
                ? "rgba(255,255,255,0.07)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.14)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: active ? "grabbing" : "grab",
              position: "relative",
              touchAction: "none",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {/* Crosshair */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "12%",
                  right: "12%",
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                  transform: "translateY(-50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "12%",
                  bottom: "12%",
                  width: 1,
                  background: "rgba(255,255,255,0.1)",
                  transform: "translateX(-50%)",
                }}
              />
            </div>

            <Arrow dir="up" />
            <Arrow dir="down" />
            <Arrow dir="left" />
            <Arrow dir="right" />

            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: active
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(255,255,255,0.14)",
                border: `1px solid rgba(255,255,255,${active ? 0.6 : 0.35})`,
                transform: `translate(${knob.x}px, ${knob.y}px)`,
                transition: active
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), background 0.15s",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            />
          </div>

          <span
            style={{
              color: "rgba(255,255,255,0.16)",
              fontSize: 8,
              letterSpacing: "0.12em",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            drag to orbit
          </span>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          // Trigger tooltips after modal closes, but only if not already completed
          const hasCompletedTour = localStorage.getItem("emology_tooltips_completed");
          if (!hasCompletedTour) {
            setTimeout(() => setShowTooltips(true), 500);
          }
        }}
      />

      {/* Onboarding Tooltips */}
      <OnboardingTooltips
        open={showTooltips}
        onClose={() => setShowTooltips(false)}
      />

      {/* Emotion Insight Panel */}
      <EmotionInsightPanel
        open={isPanelOpen}
        onClose={handleClosePanel}
        emotion={selectedEmotion}
      />

      {/* Demo Panel - Dev only, toggle with Shift + D */}
      {import.meta.env.DEV && (
        <DemoPanel
          emotions={emotions}
          onEmotionChange={setEmotions}
        />
      )}

      {/* Emotion Alert System */}
      <EmotionAlertSystem
        emotions={emotions}
        onBuildingClick={setSelectedEmotion}
        buildingPositions={buildingPositions}
        camera={cameraRef.current}
        containerRef={containerRef}
      />

      {/* Delete Data Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-black border border-red-400/30 rounded-lg shadow-2xl"
            style={{
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.2), inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-red-400/20">
              <h3 className="text-lg font-semibold text-white">Delete All Data</h3>
            </div>
            
            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-white/80 text-sm leading-relaxed">
                Are you sure you want to delete all your emotional data? This action cannot be undone.
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="ghost"
                className="text-white/50 hover:text-white/80 hover:bg-white/10 border border-white/10 hover:border-white/20"
              >
                <span className="tracking-wider uppercase text-xs font-mono">
                  Cancel
                </span>
              </Button>
              <Button
                onClick={handleDeleteData}
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/30 hover:border-red-400/50"
              >
                <span className="tracking-wider uppercase text-xs font-mono">
                  Delete Data
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toaster */}
      <Toaster />
    </div>
  );
}

function Arrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const pos: React.CSSProperties =
    dir === "up"
      ? { top: 7, left: "50%", transform: "translateX(-50%)" }
      : dir === "down"
        ? { bottom: 7, left: "50%", transform: "translateX(-50%)" }
        : dir === "left"
          ? { left: 7, top: "50%", transform: "translateY(-50%)" }
          : { right: 7, top: "50%", transform: "translateY(-50%)" };
  const sym =
    dir === "up" ? "▲" : dir === "down" ? "▼" : dir === "left" ? "◀" : "▶";
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        fontSize: 7,
        color: "rgba(255,255,255,0.22)",
        lineHeight: 1,
        pointerEvents: "none",
      }}
    >
      {sym}
    </div>
  );
}