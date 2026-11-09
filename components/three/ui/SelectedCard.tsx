"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { education, experience, profile, projects } from "@/content/portfolio";
import { useWorld, type Selection } from "../store";
import { anchors, selectionKey } from "../anchors";

const world = new THREE.Vector3();
const projected = new THREE.Vector3();
/** Measured size of the open card, so it can be clamped inside the viewport. */
const cardSize = { w: 380, h: 300 };
const TOP_SAFE = 96; // below the HUD nav
const MARGIN = 16;

/** Pin the card above its object, but never let it leave the screen. */
function clampedPosition(el: THREE.Object3D, camera: THREE.Camera, size: { width: number; height: number }) {
  projected.setFromMatrixPosition(el.matrixWorld).project(camera);
  let x = (projected.x * 0.5 + 0.5) * size.width;
  let y = (-projected.y * 0.5 + 0.5) * size.height;
  const halfW = cardSize.w / 2;
  x = THREE.MathUtils.clamp(x, halfW + MARGIN, Math.max(halfW + MARGIN, size.width - halfW - MARGIN));
  // The card's bottom edge sits at y; keep its top below the nav and its bottom on screen.
  y = THREE.MathUtils.clamp(y, TOP_SAFE + cardSize.h, Math.max(TOP_SAFE + cardSize.h, size.height - MARGIN));
  return [x, y];
}

/**
 * The interactive card for whatever is selected. It is a real DOM node (crisp
 * text, selectable, accessible) pinned to the selected rigid body, so it keeps
 * following the object even while you throw it across the room.
 */
export function SelectedCard() {
  const selected = useWorld((s) => s.selected);
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!selected || !group.current) return;
    const a = anchors.get(selectionKey(selected));
    if (!a) return;
    a.getWorldPosition(world);
    world.y += selected.kind === "project" ? 0.4 : selected.kind === "bio" ? 1.2 : 0.9;
    const k = 1 - Math.exp(-14 * dt);
    group.current.position.lerp(world, group.current.userData.init ? k : 1);
    group.current.userData.init = true;
  });

  if (!selected) return null;
  return (
    <group ref={group} key={selectionKey(selected)}>
      <Html calculatePosition={clampedPosition} zIndexRange={[40, 30]} style={{ pointerEvents: "none" }}>
        <CardBody selected={selected} />
      </Html>
    </group>
  );
}

function CardBody({ selected }: { selected: NonNullable<Selection> }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      cardSize.w = el.offsetWidth;
      cardSize.h = el.offsetHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const close = () => useWorld.getState().select(null);
  let kicker = "";
  let title = "";
  let sub = "";
  let body: string[] = [];
  let stack: string[] = [];
  let color = "#22d3ee";

  if (selected.kind === "bio") {
    kicker = "core.about()";
    title = profile.name;
    sub = profile.title;
    body = profile.bio;
    color = "#ffffff";
  } else if (selected.kind === "experience") {
    const e = experience.find((x) => x.id === selected.id)!;
    kicker = e.period;
    title = e.company;
    sub = e.role;
    body = [e.summary, ...e.highlights];
    stack = e.stack;
    color = e.color;
  } else if (selected.kind === "project") {
    const p = projects.find((x) => x.id === selected.id)!;
    kicker = p.kicker;
    title = p.name;
    sub = p.machine;
    body = [p.summary, ...p.highlights];
    stack = p.stack;
    color = "#a855f7";
  } else {
    const ed = education.find((x) => x.id === selected.id)!;
    kicker = ed.year;
    title = ed.title;
    sub = ed.school;
    body = [ed.detail];
    color = "#34d399";
  }

  return (
    <div
      ref={ref}
      className="holo-card"
      role="dialog"
      aria-labelledby="holo-card-title"
      style={{ ["--card-accent" as string]: color }}
    >
      <button className="holo-card-close" onClick={close} aria-label="Close card">
        ✕
      </button>
      <span className="holo-card-kicker">{kicker}</span>
      <h2 id="holo-card-title">{title}</h2>
      {sub && <p className="holo-card-sub">{sub}</p>}
      <ul>
        {body.map((line, i) => (
          <li key={i} style={{ animationDelay: `${80 + i * 60}ms` }}>
            {line}
          </li>
        ))}
      </ul>
      {stack.length > 0 && (
        <div className="holo-card-stack">
          {stack.map((t, i) => (
            <span key={t} style={{ animationDelay: `${200 + i * 40}ms` }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {selected.kind === "bio" && (
        <div className="holo-card-links">
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          <a href={`mailto:${profile.email}`}>Email ↗</a>
        </div>
      )}
    </div>
  );
}
