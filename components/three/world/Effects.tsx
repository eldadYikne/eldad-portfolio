"use client";

import { useEffect, useRef } from "react";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import * as THREE from "three";
import { useWorld } from "../store";
import { focusTarget } from "./CameraRig";

const chroma = new THREE.Vector2(0.0006, 0.0006);

export function Effects() {
  const quality = useWorld((s) => s.quality);
  const reducedMotion = useWorld((s) => s.reducedMotion);
  const dof = useRef<DepthOfFieldEffect>(null);

  // Point DoF at the shared, per-frame-updated focus vector (by reference).
  useEffect(() => {
    if (dof.current) dof.current.target = focusTarget;
  });

  const high = quality === "high";
  return (
    <EffectComposer multisampling={high ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={high ? 1.25 : 0.9} radius={0.75} />
      <>{high && !reducedMotion && <DepthOfField ref={dof} focusRange={9} bokehScale={2.2} />}</>
      {/* Tone map before the grain / vignette so they blend LDR colour, not raw HDR. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <ChromaticAberration
        offset={chroma}
        radialModulation
        modulationOffset={0.35}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.85} />
      <Noise premultiply opacity={0.18} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  );
}
