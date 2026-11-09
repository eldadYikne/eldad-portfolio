"use client";

import { createRef, useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useWorld, type ContactField } from "../store";
import { accentA } from "../materials";
import { AgentBody, animateGuard, animateRun, newRig, type Rig } from "./AgentBody";
import { BOARD, FIELDS, FONT_MONO, GLYPH, boardChanged, landed, slotPosition, type Field } from "./model";

const RUNNERS = 10;
const LANE_Z = -7.7;
const SPAWN_X = 13.2;
const PARK_Y = -6; // idle runners wait under the floor
const GUARD_X = [-5.9, -3.3, 3.3, 5.9];
const GUARD_Z = -8.75;
const MAX_FALLING = 60;
/** Fixed pool of glyph meshes, updated imperatively: no React renders per keystroke. */
const POOL = 96;
type Glyph = THREE.Mesh & { text: string; sync: () => void };

type Job = { field: Field; index: number; ch: string };
type Phase = "carry" | "toss" | "direct" | "fall";
type Letter = {
  id: number;
  ch: string;
  field: Field;
  index: number;
  phase: Phase;
  runner: number;
  t: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  vel: THREE.Vector3;
  spin: number;
  obj: Glyph;
  slot: number;
};
type Runner = {
  state: "idle" | "in" | "toss" | "out";
  side: 1 | -1;
  x: number;
  z: number;
  target: number;
  phase: number;
  t: number;
  letter: number | null;
};

const isBlank = (c: string) => /\s/.test(c);
const tmp = new THREE.Vector3();
const ctrl = new THREE.Vector3();
const q = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);

function bezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z
  );
}

/**
 * The contact-form squad. Every character you type becomes a job: a runner
 * sprints in from the side holding the glyph overhead, stops under its slot
 * and tosses it onto the board. Delete a character and it drops off the
 * board. Type faster than they can run and the letters start flying in on
 * their own.
 */
export function AgentSquad() {
  const fly = useRef(new Map<number, Letter>());
  const pool = useRef<(Glyph | null)[]>([]);
  const free = useRef<number[]>(Array.from({ length: POOL }, (_, i) => POOL - 1 - i));
  const queue = useRef<Job[]>([]);
  const nextId = useRef(1);
  const prev = useRef<Record<ContactField, string>>({ ...useWorld.getState().contact });
  const nextSide = useRef<1 | -1>(1);

  const rigs = useMemo(() => Array.from({ length: RUNNERS }, newRig), []);
  // Rapier's RigidBody only accepts object refs (callback refs are silently ignored).
  const bodies = useMemo<RefObject<RapierRigidBody | null>[]>(() => rigs.map(() => createRef<RapierRigidBody>()), [rigs]);
  const runners = useRef<Runner[]>(
    Array.from({ length: RUNNERS }, (_, i) => ({
      state: "idle",
      side: 1,
      x: SPAWN_X + 2,
      z: LANE_Z + (i % 3) * 0.35 - 0.35,
      target: 0,
      phase: Math.random() * 6,
      t: 0,
      letter: null,
    }))
  );

  // Whatever is already typed counts as delivered when the squad arrives.
  useEffect(() => {
    const c = useWorld.getState().contact;
    FIELDS.forEach((f) => (landed[f] = c[f].split("").map(() => true)));
    prev.current = { ...c };
    boardChanged();
    return () => {
      FIELDS.forEach((f) => (landed[f] = null));
      boardChanged();
    };
  }, []);

  const spawnLetter = (l: Omit<Letter, "id" | "obj" | "slot">) => {
    const slot = free.current.pop();
    const obj = slot != null ? pool.current[slot] : null;
    if (slot == null || !obj) return null;
    const id = nextId.current++;
    obj.text = l.ch;
    obj.sync();
    obj.visible = true;
    obj.position.copy(l.from);
    obj.rotation.set(0, 0, 0);
    obj.scale.setScalar(1);
    fly.current.set(id, { ...l, id, obj, slot });
    return id;
  };

  const releaseLetter = (l: Letter) => {
    l.obj.visible = false;
    fly.current.delete(l.id);
    free.current.push(l.slot);
  };

  const dropLetter = (l: Letter) => {
    l.phase = "fall";
    l.t = 0;
    l.vel.set((Math.random() - 0.5) * 3, 2 + Math.random() * 3, 2.5 + Math.random() * 2);
    l.spin = (Math.random() - 0.5) * 14;
  };

  // Diff every keystroke against the previous value of each field. Subscribing
  // directly (instead of selecting state) keeps typing from re-rendering the squad.
  const onType = (contact: Record<ContactField, string>) => {
    let changed = false;
    let falling = 0;
    for (const f of FIELDS) {
      const old = prev.current[f];
      const neu = contact[f];
      if (old === neu) continue;
      changed = true;
      const arr = (landed[f] ??= []);
      let p = 0;
      while (p < old.length && p < neu.length && old[p] === neu[p]) p++;

      // Removed characters fall off the board.
      for (let i = p; i < old.length; i++) {
        if (!arr[i] || isBlank(old[i]) || falling >= MAX_FALLING) continue;
        const pos = slotPosition(f, old, i);
        if (!pos) continue;
        falling++;
        const id = spawnLetter({
          ch: old[i], field: f, index: i, phase: "fall", runner: -1, t: 0,
          from: pos.clone(), to: pos.clone(), vel: new THREE.Vector3(), spin: 0,
        });
        if (id != null) dropLetter(fly.current.get(id)!);
      }
      // In-flight letters for removed slots get dropped too.
      fly.current.forEach((l) => {
        if (l.field === f && l.index >= p && l.phase !== "fall") dropLetter(l);
      });
      queue.current = queue.current.filter((j) => !(j.field === f && j.index >= p));
      arr.length = p;

      // New characters become delivery jobs.
      for (let i = p; i < neu.length; i++) {
        const ch = neu[i];
        const skip = isBlank(ch) || !slotPosition(f, neu, i);
        arr.push(skip);
        if (!skip) queue.current.push({ field: f, index: i, ch });
      }
    }
    prev.current = { ...contact };
    if (changed) boardChanged();
  };
  const onTypeRef = useRef(onType);
  onTypeRef.current = onType;
  useEffect(
    () =>
      useWorld.subscribe((s, p) => {
        if (s.contact !== p.contact) onTypeRef.current(s.contact);
      }),
    []
  );

  const stillWanted = (l: { field: Field; index: number; ch: string }) =>
    useWorld.getState().contact[l.field][l.index] === l.ch && landed[l.field]?.[l.index] === false;

  useFrame((state, dt) => {
    dt = Math.min(dt, 1 / 30);
    const rs = runners.current;
    const backlog = queue.current.length;

    /* 1. hand out jobs */
    let directBudget = 3;
    while (queue.current.length) {
      const job = queue.current[0];
      if (!stillWanted(job)) {
        queue.current.shift();
        continue;
      }
      const to = slotPosition(job.field, useWorld.getState().contact[job.field], job.index);
      if (!to || free.current.length === 0) {
        // Reflowed off the board, or every glyph is airborne: just commit it.
        queue.current.shift();
        landed[job.field]![job.index] = true;
        boardChanged();
        continue;
      }
      const ri = rs.findIndex((r) => r.state === "idle");
      if (ri >= 0) {
        queue.current.shift();
        const r = rs[ri];
        const side = (nextSide.current = (nextSide.current * -1) as 1 | -1);
        r.state = "in";
        r.side = side;
        r.x = side * SPAWN_X;
        r.target = THREE.MathUtils.clamp(to.x, -SPAWN_X + 1, SPAWN_X - 1);
        r.letter = spawnLetter({
          ch: job.ch, field: job.field, index: job.index, phase: "carry", runner: ri, t: 0,
          from: new THREE.Vector3(), to: to.clone(), vel: new THREE.Vector3(), spin: 0,
        });
      } else if (queue.current.length > 6 && directBudget-- > 0) {
        // Squad is saturated: letters launch themselves from the wings.
        queue.current.shift();
        const side = (nextSide.current = (nextSide.current * -1) as 1 | -1);
        spawnLetter({
          ch: job.ch, field: job.field, index: job.index, phase: "direct", runner: -1, t: 0,
          from: new THREE.Vector3(side * 14, 0.6, LANE_Z), to: to.clone(), vel: new THREE.Vector3(), spin: side * 10,
        });
      } else break;
    }

    /* 2. runners */
    const speed = Math.min(19, 10 + backlog * 0.9);
    rs.forEach((r, i) => {
      const rig = rigs[i];
      const body = bodies[i].current;
      let yaw = -r.side * (Math.PI / 2);
      let y = 0;
      if (r.state === "idle") {
        y = PARK_Y;
      } else if (r.state === "in") {
        const dir = Math.sign(r.target - r.x);
        r.x += dir * speed * dt;
        r.phase += dt * speed * 1.5;
        animateRun(rig, r.phase, true);
        if (Math.sign(r.target - r.x) !== dir) {
          r.x = r.target;
          r.state = "toss";
          r.t = 0;
          const l = r.letter != null ? fly.current.get(r.letter) : undefined;
          if (l && l.phase === "carry") {
            l.phase = "toss";
            l.t = 0;
            l.from.set(r.x, 2.55, r.z);
          }
        }
      } else if (r.state === "toss") {
        r.t += dt;
        yaw = Math.PI; // turn to the board
        const k = Math.min(1, r.t / 0.22);
        const swing = Math.sin(k * Math.PI);
        if (rig.armL) rig.armL.rotation.set(-Math.PI * (0.92 - swing * 0.25), 0, 0.25);
        if (rig.armR) rig.armR.rotation.set(-Math.PI * (0.92 - swing * 0.25), 0, -0.25);
        if (rig.legL) rig.legL.rotation.x = 0;
        if (rig.legR) rig.legR.rotation.x = 0;
        if (rig.hips) rig.hips.position.y = swing * 0.12;
        if (r.t > 0.24) {
          r.state = "out";
          r.letter = null;
        }
      } else {
        // Keep running the same way: the squad is a relay, not a shuttle.
        r.x -= r.side * speed * dt;
        r.phase += dt * speed * 1.5;
        animateRun(rig, r.phase, false);
        if (Math.abs(r.x) > SPAWN_X + 0.5) r.state = "idle";
      }
      if (rig.root) rig.root.visible = r.state !== "idle";
      if (body) {
        body.setNextKinematicTranslation({ x: r.x, y, z: r.z });
        q.setFromAxisAngle(up, yaw);
        body.setNextKinematicRotation(q);
      }
    });

    /* 3. letters */
    const done: Letter[] = [];
    let landedAny = false;
    fly.current.forEach((l) => {
      const o = l.obj;
      if (l.phase === "carry") {
        const r = rs[l.runner];
        tmp.set(r.x, 2.55 + (rigs[l.runner].hips?.position.y ?? 0), r.z);
        o.position.copy(tmp);
        o.rotation.set(0, Math.sin(state.clock.elapsedTime * 6 + l.id) * 0.25, 0);
        o.scale.setScalar(1.7);
        return;
      }
      if (l.phase === "toss" || l.phase === "direct") {
        const dur = l.phase === "toss" ? 0.5 : 0.85;
        l.t = Math.min(1, l.t + dt / dur);
        ctrl.copy(l.from).lerp(l.to, 0.5);
        ctrl.y = Math.max(l.from.y, l.to.y) + (l.phase === "toss" ? 1.4 : 3);
        ctrl.z += 1.5;
        bezier(l.from, ctrl, l.to, l.t, tmp);
        o.position.copy(tmp);
        o.rotation.set(0, (1 - l.t) * l.spin, (1 - l.t) * l.spin * 0.3);
        o.scale.setScalar(THREE.MathUtils.lerp(1.7, 1, l.t));
        if (l.t >= 1) {
          if (stillWanted(l)) {
            landed[l.field]![l.index] = true;
            landedAny = true;
            done.push(l);
          } else dropLetter(l);
        }
        return;
      }
      // fall
      l.t += dt;
      l.vel.y -= 16 * dt;
      l.from.addScaledVector(l.vel, dt);
      o.position.copy(l.from);
      o.rotation.x += l.spin * dt;
      o.rotation.z += l.spin * 0.6 * dt;
      if (l.t > 1.6 || l.from.y < -0.5) done.push(l);
    });
    done.forEach(releaseLetter);
    if (landedAny) boardChanged();
  });

  const glyphColor = useMemo(() => new THREE.Color(accentA).multiplyScalar(3), []);

  return (
    <>
      {rigs.map((rig, i) => (
        <RigidBody
          key={i}
          ref={bodies[i]}
          type="kinematicPosition"
          colliders={false}
          position={[SPAWN_X + 2, PARK_Y, LANE_Z]}
        >
          {/* Agents bowl over anything in their lane. */}
          <CapsuleCollider args={[0.55, 0.3]} position={[0, 0.9, 0]} />
          <AgentBody rig={rig} />
        </RigidBody>
      ))}

      {Array.from({ length: POOL }, (_, i) => (
        <Text
          key={i}
          ref={(o: THREE.Mesh | null) => void (pool.current[i] = o as Glyph | null)}
          font={FONT_MONO}
          fontSize={GLYPH}
          color={glyphColor}
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          visible={false}
          frustumCulled={false}
        >
          {" "}
        </Text>
      ))}

      <Guards />
    </>
  );
}

/* ---------------- the four guards who rappel in from the ceiling ---------------- */

function Guards() {
  const rigs = useMemo(() => GUARD_X.map(newRig), []);
  const ropes = useRef<(THREE.Mesh | null)[]>([]);
  const t0 = useRef<number | null>(null);
  const landedFlags = useRef(GUARD_X.map(() => false));
  const salute = useRef(0);

  useFrame((state, dt) => {
    if (t0.current == null) t0.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - t0.current;
    const sent = useWorld.getState().contactStatus === "sent";
    salute.current = THREE.MathUtils.damp(salute.current, sent ? 1 : 0, 6, dt);

    rigs.forEach((rig, i) => {
      const local = t - 0.15 - i * 0.22;
      const k = THREE.MathUtils.clamp(local / 1.0, 0, 1);
      // Fast drop, brake at the end, tiny bounce on landing.
      const e = 1 - Math.pow(1 - k, 3);
      const bounce = k >= 1 ? Math.max(0, Math.sin((local - 1) * 18) * Math.exp(-(local - 1) * 8) * 0.12) : 0;
      const y = THREE.MathUtils.lerp(BOARD.y + 9, 0, e) + bounce;
      if (rig.root) {
        rig.root.position.set(GUARD_X[i], y, GUARD_Z);
        rig.root.rotation.y = 0;
      }
      if (k < 1) {
        // Hanging on the rope, both hands up.
        if (rig.armL) rig.armL.rotation.set(-Math.PI * 0.95, 0, 0.1);
        if (rig.armR) rig.armR.rotation.set(-Math.PI * 0.95, 0, -0.1);
        if (rig.legL) rig.legL.rotation.x = -0.3;
        if (rig.legR) rig.legR.rotation.x = 0.15;
      } else {
        if (!landedFlags.current[i]) {
          landedFlags.current[i] = true;
          useWorld.getState().kick(0.12);
        }
        animateGuard(rig, state.clock.elapsedTime + i, salute.current);
        if (rig.head) rig.head.rotation.y = THREE.MathUtils.damp(rig.head.rotation.y, state.pointer.x * 0.7, 4, dt);
      }
      // Rope from the ceiling to the hands, retracting after landing.
      const rope = ropes.current[i];
      if (rope) {
        const top = 13;
        const retract = THREE.MathUtils.clamp((local - 1.1) / 0.5, 0, 1);
        const bottom = THREE.MathUtils.lerp(y + 2.3, top, retract);
        const len = Math.max(0.001, top - bottom);
        rope.visible = local > -0.2 && retract < 1;
        rope.position.set(GUARD_X[i], bottom + len / 2, GUARD_Z);
        rope.scale.set(1, len, 1);
      }
    });
  });

  return (
    <>
      {rigs.map((rig, i) => (
        <group key={i}>
          <AgentBody rig={rig} />
          <mesh ref={(m) => void (ropes.current[i] = m)} visible={false}>
            <cylinderGeometry args={[0.018, 0.018, 1, 6]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
}
