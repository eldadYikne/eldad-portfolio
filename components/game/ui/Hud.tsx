"use client";

import { useEffect, useRef, useState } from "react";
import { NESTS, PLAYER_LEVEL, ZONES, islandRadius, zoneById } from "../world";
import { BOSSES } from "../combat/defs";
import { useCombat } from "../combat/state";
import { MissionHud } from "./MissionHud";
import { isMuted, onMute, setMuted } from "../audio";
import { input, player, useGame } from "../store";
import { ZoneCard } from "./ZoneCard";

const AVATAR = "https://res.cloudinary.com/dkfnkf3gl/image/upload/w_120,h_120,c_fill,g_face/v1768326078/portfolio/projects/dtcmayvvyrmwldrt6kub.png";

export function Hud() {
  const started = useGame((s) => s.started);
  const visited = useGame((s) => s.visited);
  const defeated = useCombat((s) => s.defeated);
  const inMission = useCombat((s) => !!s.mission);
  const earned = visited.length * 100 + defeated.length * 500;
  const max = ZONES.length * 100 + NESTS.length * 500;
  const xp = earned / max;

  return (
    <div className={`hud ${started ? "in" : ""} ${inMission ? "mission" : ""}`}>
      <div className="badge">
        <div className="badge-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" />
          <span className="badge-lvl">{PLAYER_LEVEL}</span>
        </div>
        <div className="badge-info">
          <strong>Eldad Yikne</strong>
          <em>CTO · Full-Stack Architect</em>
          <div className="xp" aria-label={`${earned} of ${max} XP`}>
            <span style={{ width: `${Math.max(4, xp * 100)}%` }} />
            <b>
              {earned} / {max} XP
            </b>
          </div>
        </div>
      </div>

      <div className="side">
        <Minimap />
        <Quests />
      </div>

      <MuteButton />
      <RewardPop />
      {!inMission && <ZoneCard />}
      <MissionHud />
      <Joystick mode="move" />
      {inMission && <Joystick mode="aim" />}
      <p className="hint">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> or click the map to walk · 🔫 missions: aim with the mouse, hold click to fire
      </p>
    </div>
  );
}

function Quests() {
  const visited = useGame((s) => s.visited);
  const defeated = useCombat((s) => s.defeated);
  const [open, setOpen] = useState(true);
  const left = ZONES.filter((z) => !visited.includes(z.id));
  return (
    <div className="quests">
      <button className="quests-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🗺️ Explore the island <span>{visited.length}/{ZONES.length}</span>
      </button>
      {open && (
        <ul>
          {ZONES.map((z) => (
            <li key={z.id} className={visited.includes(z.id) ? "done" : ""}>
              <span>{visited.includes(z.id) ? "✓" : z.icon}</span>
              {z.label}
            </li>
          ))}
        </ul>
      )}
      <div className="quests-sub">⚔️ Boss missions <span>{defeated.length}/{NESTS.length}</span></div>
      {open && (
        <ul>
          {NESTS.map((n) => (
            <li key={n.id} className={defeated.includes(n.id) ? "done" : ""}>
              <span>{defeated.includes(n.id) ? "✓" : BOSSES[n.id].icon}</span>
              {BOSSES[n.id].name}
            </li>
          ))}
        </ul>
      )}
      {left.length === 0 && defeated.length === NESTS.length && <p className="quests-done">🏆 Island complete!</p>}
    </div>
  );
}

/** SVG minimap; the player dot is moved directly every frame (no React renders). */
function Minimap() {
  const dot = useRef<SVGGElement>(null);
  const visited = useGame((s) => s.visited);
  const S = 30; // world half-size shown
  const coast = Array.from({ length: 90 }, (_, i) => {
    const t = (i / 90) * Math.PI * 2;
    const r = islandRadius(t);
    // Rounded so server and client render identical markup.
    return `${(Math.cos(t) * r).toFixed(2)},${(Math.sin(t) * r).toFixed(2)}`;
  }).join(" ");

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      dot.current?.setAttribute(
        "transform",
        `translate(${player.x} ${player.z}) rotate(${(-player.heading * 180) / Math.PI + 180})`
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg className="minimap" viewBox={`${-S} ${-S} ${S * 2} ${S * 2}`} role="img" aria-label="Island map">
      <circle r={S} fill="#2a8fd6" />
      <polygon points={coast} fill="#6fd47a" stroke="#f7d9a0" strokeWidth={1.2} />
      {ZONES.map((z) => (
        <g
          key={z.id}
          transform={`translate(${z.pos[0]} ${z.pos[1]})`}
          onClick={() => (input.target = { x: z.ring[0], z: z.ring[1] })}
          style={{ cursor: "pointer" }}
        >
          <circle r={2.6} fill={visited.includes(z.id) ? "#ffffff" : z.color} stroke="#2a1f3d" strokeWidth={0.8} />
          <text fontSize={3} textAnchor="middle" dy={1.1}>
            {z.icon}
          </text>
        </g>
      ))}
      {NESTS.map((n) => (
        <g key={n.id} transform={`translate(${n.pos[0]} ${n.pos[1]})`} onClick={() => (input.target = { x: n.ring[0], z: n.ring[1] })} style={{ cursor: "pointer" }}>
          <circle r={2.8} fill="#ef4444" stroke="#2a1f3d" strokeWidth={0.8} />
          <text fontSize={3} textAnchor="middle" dy={1.1}>
            {BOSSES[n.id].icon}
          </text>
        </g>
      ))}
      <g ref={dot}>
        <circle r={2.1} fill="#41d1ff" stroke="#fff" strokeWidth={0.9} />
        <path d="M0 -3.6 L1.6 -1.2 L-1.6 -1.2 Z" fill="#fff" />
      </g>
    </svg>
  );
}

function RewardPop() {
  const reward = useGame((s) => s.reward);
  const [show, setShow] = useState<typeof reward>(null);
  useEffect(() => {
    if (!reward) return;
    setShow(reward);
    const id = setTimeout(() => setShow(null), 1800);
    return () => clearTimeout(id);
  }, [reward]);
  if (!show) return null;
  return (
    <div key={show.at} className="reward" aria-live="polite">
      <span>+100 XP</span>
      <small>Discovered {zoneById[show.id].label}</small>
    </div>
  );
}

function MuteButton() {
  const [m, setM] = useState(false);
  useEffect(() => {
    setM(isMuted());
    return onMute(setM);
  }, []);
  return (
    <button className="mute" onClick={() => setMuted(!m)} aria-label={m ? "Unmute sound" : "Mute sound"} aria-pressed={m}>
      {m ? "🔇" : "🔊"}
    </button>
  );
}

/**
 * Touch sticks, shown only on coarse-pointer devices: the left one moves,
 * the right one (in missions) aims and fires while held.
 */
function Joystick({ mode }: { mode: "move" | "aim" }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(window.matchMedia("(pointer: coarse)").matches), []);
  if (!touch) return null;

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    if (mode === "move") {
      input.stick.x = x;
      input.stick.y = y;
    } else {
      Object.assign(input.aimStick, { x, y, active: true });
      input.firing = Math.hypot(x, y) > 0.3;
    }
    knob.current!.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
  };
  const end = () => {
    if (mode === "move") {
      input.stick.x = 0;
      input.stick.y = 0;
    } else {
      Object.assign(input.aimStick, { x: 0, y: 0, active: false });
      input.firing = false;
    }
    knob.current!.style.transform = "";
  };

  return (
    <div
      ref={base}
      className={`joystick ${mode}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.buttons && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  );
}
