import * as THREE from "three";

/**
 * Shared materials. Re-using the same instances across meshes keeps shader
 * programs and state changes to a minimum. The accent colours are mutated in
 * place by <PaletteDriver/> so world-mode transitions are smooth and free.
 */
export const accentA = new THREE.Color("#22d3ee");
export const accentB = new THREE.Color("#a855f7");

const glow = (c: THREE.Color, intensity: number) => {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.color.copy(c).multiplyScalar(intensity);
  return m;
};

export const materials = {
  glowA: glow(accentA, 4),
  glowB: glow(accentB, 4),
  glowWhite: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), toneMapped: false }),
  darkMetal: new THREE.MeshStandardMaterial({
    color: "#0b0d14",
    metalness: 0.9,
    roughness: 0.28,
    envMapIntensity: 1.2,
  }),
  panel: new THREE.MeshPhysicalMaterial({
    color: "#0c1020",
    metalness: 0.6,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  }),
};

/** Called every frame by PaletteDriver after accentA / accentB were lerped. */
export function syncGlowMaterials() {
  materials.glowA.color.copy(accentA).multiplyScalar(4);
  materials.glowB.color.copy(accentB).multiplyScalar(4);
}

/**
 * Standard material whose per-instance colour also feeds the emissive term,
 * so one InstancedMesh can hold many differently glowing objects in a single
 * draw call.
 */
export function createInstanceGlowMaterial(emissiveBoost = 0.9) {
  const m = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    metalness: 0.25,
    roughness: 0.42,
    envMapIntensity: 0.9,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      #ifdef USE_INSTANCING_COLOR
        totalEmissiveRadiance += vColor * ${emissiveBoost.toFixed(2)};
      #endif`
    );
  };
  m.customProgramCacheKey = () => `instance-glow-${emissiveBoost}`;
  return m;
}
