import * as THREE from "three";

/** Three hard light bands: the cel-shaded, "chunky mobile game" look. */
const gradient = (() => {
  const data = new Uint8Array([90, 170, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
})();

const cache = new Map<string, THREE.MeshToonMaterial>();

/** Shared toon material per colour: same colour, same material, fewer shader switches. */
export function toon(color: string, opts: { emissive?: string; emissiveIntensity?: number } = {}) {
  const key = `${color}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    if (opts.emissive) {
      m.emissive.set(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity ?? 1;
    }
    cache.set(key, m);
  }
  return m;
}

/** Toon material whose vertices sway in the wind (grass, flowers, canopies). */
export function windToon(color: string, strength = 0.18) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
  const uniforms = { uTime: { value: 0 } };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(0.0);
        #endif
        float sway = sin(uTime * 1.8 + ip.x * 0.35 + ip.z * 0.25) * ${strength.toFixed(3)};
        transformed.x += sway * max(position.y, 0.0);
        transformed.z += sway * 0.5 * max(position.y, 0.0);`
      );
  };
  m.customProgramCacheKey = () => `wind-${strength}`;
  return { material: m, uniforms };
}
