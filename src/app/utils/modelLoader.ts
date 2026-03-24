/**
 * modelLoader.ts
 * ─────────────────────────────────────────────────────────────
 * Async helper for loading GLTF / GLB models into Three.js scenes.
 *
 * COLOR CONTROL (set per-emotion in MODEL_COLORS inside CityMap.tsx):
 *
 *   overrideColor   — completely replaces every material's base color.
 *                     Use this if your model is grey/white and you want
 *                     to paint it with the emotion's colour.
 *
 *   emissiveColor   — adds a glow on top of the existing material color.
 *                     Use this to keep the model's textures but add a
 *                     colored inner light effect.
 *
 *   emissiveIntensity — strength of the glow (0 = none, 1 = full).
 *
 *   Leave both as "" / undefined to keep the model's original colors.
 * ─────────────────────────────────────────────────────────────
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();

/** Cache already-loaded models so each URL is only fetched once. */
const cache = new Map<string, THREE.Group>();

/** Cache raw GLTF objects for animation-preserving loads. */
const gltfRawCache = new Map<string, GLTF>();

export interface ModelColorOptions {
  /** Replaces the model's base color on every mesh. e.g. "#ff4444" */
  overrideColor?: string;
  /** Adds a glow tint on top of the existing material. e.g. "#ff4444" */
  emissiveColor?: string;
  /** Glow strength 0–1. Defaults to 0.3. */
  emissiveIntensity?: number;
}

export interface LoadedModel {
  group: THREE.Group;
  bbox: THREE.Box3;
  size: THREE.Vector3;
}

export interface LoadedModelWithAnimations extends LoadedModel {
  animations: THREE.AnimationClip[];
}

/**
 * Applies color options to every mesh inside a Group.
 * Called internally after loading and cloning.
 */
function applyColors(group: THREE.Group, options: ModelColorOptions) {
  const { overrideColor, emissiveColor, emissiveIntensity = 0.3 } = options;

  if (!overrideColor && !emissiveColor) return;

  group.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    mats.forEach((mat) => {
      // Clone the material so it doesn't affect the cached original
      const m = mat.clone() as THREE.MeshStandardMaterial;

      if (overrideColor) {
        m.color = new THREE.Color(overrideColor);
      }

      if (emissiveColor && m.isMeshStandardMaterial) {
        m.emissive = new THREE.Color(emissiveColor);
        m.emissiveIntensity = emissiveIntensity;
      }

      m.needsUpdate = true;

      // Re-assign the cloned material back to the mesh
      if (Array.isArray(mesh.material)) {
        const idx = (mesh.material as THREE.Material[]).indexOf(mat);
        (mesh.material as THREE.Material[])[idx] = m;
      } else {
        mesh.material = m;
      }
    });
  });
}

/**
 * Loads a GLTF/GLB model from `url` and returns a **cloned** Group.
 * Cached after first fetch — subsequent calls are instant.
 */
export async function loadModel(
  url: string,
  colorOptions: ModelColorOptions = {}
): Promise<LoadedModel> {
  if (!cache.has(url)) {
    const gltf = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load(url, (g) => resolve(g.scene), undefined, reject);
    });
    cache.set(url, gltf);
  }

  // Deep-clone so each building instance is fully independent
  const group = cache.get(url)!.clone(true);

  applyColors(group, colorOptions);

  const bbox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  return { group, bbox, size };
}

/**
 * Scales a loaded model so it fits within targetSize × targetHeight.
 * Also floor-aligns the group so its bottom sits at y = 0.
 */
export function fitModelToSize(
  group: THREE.Group,
  bbox: THREE.Box3,
  size: THREE.Vector3,
  targetSize: number,
  targetHeight: number
): void {
  const scaleXZ = targetSize / Math.max(size.x, size.z, 0.001);
  const scaleY = targetHeight / Math.max(size.y, 0.001);
  const uniformScale = Math.min(scaleXZ, scaleY);
  group.scale.setScalar(uniformScale);

  // Re-measure after scaling so we can floor-align
  const scaledBbox = new THREE.Box3().setFromObject(group);
  group.position.y = -scaledBbox.min.y;
}

/**
 * Loads a GLTF/GLB model and returns the scene group WITH its animations intact.
 * Caches the raw GLTF after first fetch; subsequent calls return a fresh clone
 * of the scene so each caller gets an independent, animatable group.
 */
export async function loadModelWithAnimations(
  url: string
): Promise<LoadedModelWithAnimations> {
  if (!gltfRawCache.has(url)) {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
    gltfRawCache.set(url, gltf);
  }

  const cached = gltfRawCache.get(url)!;
  // Use SkeletonUtils.clone to properly clone skinned meshes & skeletons
  const group = skeletonClone(cached.scene) as THREE.Group;
  const bbox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  return { group, bbox, size, animations: cached.animations };
}