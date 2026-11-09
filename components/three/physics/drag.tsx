"use client";

import { useEffect } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ARENA } from "./arena";

/**
 * Velocity-driven dragging: instead of teleporting a grabbed body we steer its
 * linear velocity toward the cursor. It keeps colliding with everything while
 * held, and on release it simply keeps that velocity, which is the throw.
 */
const drag = {
  body: null as RapierRigidBody | null,
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  ndc: new THREE.Vector2(),
  target: new THREE.Vector3(),
  startX: 0,
  startY: 0,
  moved: false,
  onClick: null as null | (() => void),
};

const CLICK_SLOP = 6; // px

export function beginDrag(
  body: RapierRigidBody | null | undefined,
  e: ThreeEvent<PointerEvent>,
  onClick?: () => void
) {
  if (!body) return;
  e.stopPropagation();
  drag.body = body;
  drag.onClick = onClick ?? null;
  drag.moved = false;
  drag.startX = e.nativeEvent.clientX;
  drag.startY = e.nativeEvent.clientY;
  const lift = Math.max(body.translation().y, 1.2) + 0.9;
  drag.plane.set(new THREE.Vector3(0, 1, 0), -lift);
  drag.ndc.copy(e.pointer);
  body.wakeUp();
  document.body.style.cursor = "grabbing";
}

export function isDragging() {
  return drag.body !== null;
}

export function DragController() {
  const { camera, gl, raycaster } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (ev: PointerEvent) => {
      if (!drag.body) return;
      const r = el.getBoundingClientRect();
      drag.ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) > CLICK_SLOP) drag.moved = true;
    };
    const onUp = () => {
      if (!drag.body) return;
      const click = !drag.moved ? drag.onClick : null;
      drag.body = null;
      drag.onClick = null;
      document.body.style.cursor = "";
      click?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  useFrame(() => {
    const body = drag.body;
    if (!body || !drag.moved) return;
    raycaster.setFromCamera(drag.ndc, camera);
    if (!raycaster.ray.intersectPlane(drag.plane, drag.target)) return;
    const t = drag.target;
    t.x = THREE.MathUtils.clamp(t.x, -ARENA.halfX + 1, ARENA.halfX - 1);
    t.z = THREE.MathUtils.clamp(t.z, ARENA.minZ + 1, ARENA.maxZ - 1);
    const p = body.translation();
    const k = 14;
    let vx = (t.x - p.x) * k;
    let vy = (t.y - p.y) * k;
    let vz = (t.z - p.z) * k;
    const len = Math.hypot(vx, vy, vz);
    const max = 28;
    if (len > max) {
      vx = (vx / len) * max;
      vy = (vy / len) * max;
      vz = (vz / len) * max;
    }
    body.setLinvel({ x: vx, y: vy, z: vz }, true);
    const w = body.angvel();
    body.setAngvel({ x: w.x * 0.9, y: w.y * 0.9, z: w.z * 0.9 }, true);
  });

  return null;
}
