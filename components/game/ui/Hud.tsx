"use client";

import { useEffect, useRef, useState } from "react";
import { PLAYER_LEVEL, ZONES, islandRadius, zoneById } from "../world";
import { input, player, useGame } from "../store";
import { ZoneCard } from "./ZoneCard";

const AVATAR = "https://res.cloudinary.com/dkfnkf3gl/image/upload/w_120,h_120,c_fill,g_face/v1768326078/portfolio/projects/dtcmayvvyrmwldrt6kub.png";

export function Hud() {
  const started = useGame((s) => s.started);
  const visited = useGame((s) => s.visited);
  const total = ZONES.length;
  const xp = visited.length / total;

  return (
    <div className={`hud ${started ? "in" : ""}`}>
      <div className="badge">
        <div className="badge-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" />
          <span className="badge-lvl">{PLAYER_LEVEL}</span>
        </div>
        <div className="badge-info">
          <strong>Eldad Yikne</strong>
          <em>CTO · Full-Stack Architect</em>
          <div className="xp" aria-label={`Explored ${visited.length} of ${total} places`}>
            <span style={{ width: `${Math.max(4, xp * 100)}%` }} />
            <b>
              {visited.length * 100} / {total * 100} XP
            </b>
          </div>
        </div>
      </div>

      <div className="side">
        <Minimap />
        <Quests />
      </div>

      <RewardPop />
      <ZoneCard />
      <Joystick />
      <p className="hint">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> or click the map to walk
      </p>
    </div>
  );
}

function Quests() {
  const visited = useGame((s) => s.visited);
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
      {left.length === 0 && <p className="quests-done">🏆 Island complete!</p>}
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

/** Touch joystick, shown only on coarse-pointer devices. */
function Joystick() {
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
    input.stick.x = x;
    input.stick.y = y;
    knob.current!.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
  };
  const end = () => {
    input.stick.x = 0;
    input.stick.y = 0;
    knob.current!.style.transform = "";
  };

  return (
    <div
      ref={base}
      className="joystick"
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
