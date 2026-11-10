"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FLOWERS, GRASS, PALETTE, ROCKS, TREES, type Prop } from "../world";
import { toon, windToon } from "../toon";

const dummy = new THREE.Object3D();

/** Fill an InstancedMesh from a prop list: one draw call per kind of thing. */
function useInstances(
  ref: React.RefObject<THREE.InstancedMesh | null>,
  props: Prop[],
  place: (p: Prop, o: THREE.Object3D) => void,
  color?: (p: Prop, c: THREE.Color) => void
) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    props.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.r, 0);
      dummy.scale.setScalar(p.s);
      place(p, dummy);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (color) {
        color(p, c);
        mesh.setColorAt(i, c);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Nature() {
  return (
    <>
      <Grass />
      <Flowers />
      <Trees />
      <Rocks />
    </>
  );
}

function Grass() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    // Three blades fanned out: a chunky stylised tuft.
    const blade = new THREE.ConeGeometry(0.07, 0.42, 3, 1);
    blade.translate(0, 0.21, 0);
    const parts = [-0.35, 0, 0.35].map((a, i) => {
      const g = blade.clone();
      g.rotateZ(a * 0.6);
      g.translate(Math.sin(a) * 0.12, 0, (i - 1) * 0.05);
      return g;
    });
    const merged = mergeGeometries(parts);
    return merged;
  }, []);
  const { material, uniforms } = useMemo(() => windToon("#ffffff", 0.22), []);
  useFrame((s) => (uniforms.uTime.value = s.clock.elapsedTime));
  useInstances(ref, GRASS, () => {}, (p, c) => c.set(p.v > 0.5 ? PALETTE.grassDark : "#5cc46c"));
  return <instancedMesh ref={ref} args={[geometry, material, GRASS.length]} />;
}

function Flowers() {
  const stems = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const colors = [PALETTE.pink, PALETTE.yellow, PALETTE.white, PALETTE.purple, PALETTE.coral];
  useInstances(stems, FLOWERS, (_, o) => o.position.setY(0.15));
  useInstances(
    heads,
    FLOWERS,
    (_, o) => o.position.setY(0.34),
    (p, c) => c.set(colors[Math.floor(p.v * colors.length)])
  );
  return (
    <>
      <instancedMesh ref={stems} args={[undefined, toon(PALETTE.grassDark), FLOWERS.length]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, toon("#ffffff"), FLOWERS.length]}>
        <icosahedronGeometry args={[0.09, 0]} />
      </instancedMesh>
    </>
  );
}

function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const low = useRef<THREE.InstancedMesh>(null);
  const top = useRef<THREE.InstancedMesh>(null);
  const greens = ["#3fae5a", "#55c46a", "#2f9e6e", "#7ccf5a"];
  const { material: leaves, uniforms } = useMemo(() => windToon("#ffffff", 0.05), []);
  useFrame((s) => (uniforms.uTime.value = s.clock.elapsedTime));
  useInstances(trunks, TREES, (p, o) => o.position.setY(0.5 * p.s));
  useInstances(low, TREES, (p, o) => o.position.setY(1.55 * p.s), (p, c) => c.set(greens[Math.floor(p.v * greens.length)]));
  useInstances(
    top,
    TREES,
    (p, o) => {
      o.position.setY(2.35 * p.s);
      o.scale.setScalar(p.s * 0.72);
    },
    (p, c) => c.set(greens[Math.floor(p.v * greens.length)]).offsetHSL(0, 0, 0.06)
  );
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, toon("#a0663a"), TREES.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1, 6]} />
      </instancedMesh>
      <instancedMesh ref={low} args={[undefined, leaves, TREES.length]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
      <instancedMesh ref={top} args={[undefined, leaves, TREES.length]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
    </>
  );
}

function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, ROCKS, (p, o) => {
    o.position.setY(0.15 * p.s);
    o.scale.set(p.s, p.s * 0.65, p.s * 0.9);
  });
  return (
    <instancedMesh ref={ref} args={[undefined, toon("#b9b3cf"), ROCKS.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.6, 0]} />
    </instancedMesh>
  );
}

/** Minimal non-indexed merge (avoids pulling in three/examples for one call). */
function mergeGeometries(list: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const nor: number[] = [];
  for (const g of list) {
    const ng = g.index ? g.toNonIndexed() : g;
    ng.computeVertexNormals();
    pos.push(...(ng.getAttribute("position").array as Float32Array));
    nor.push(...(ng.getAttribute("normal").array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
