import type * as THREE from "three";
import type { Selection } from "./store";

/** Object3Ds that detail cards attach to, keyed by selectionKey(). */
export const anchors = new Map<string, THREE.Object3D>();

export function selectionKey(s: NonNullable<Selection>) {
  return s.kind === "bio" ? "bio" : `${s.kind}:${s.id}`;
}
