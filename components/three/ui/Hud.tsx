"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/content/portfolio";
import { useWorld, type Section } from "../store";
import { MotionLab } from "../interaction/MotionLab";
import { ContactForm } from "./ContactForm";

const NAV: { id: Section; label: string; key: string }[] = [
  { id: "hero", label: "Origin", key: "1" },
  { id: "experience", label: "Experience", key: "2" },
  { id: "projects", label: "Projects", key: "3" },
  { id: "skills", label: "Skills", key: "4" },
  { id: "education", label: "Education", key: "5" },
];

export function Hud() {
  const section = useWorld((s) => s.section);
  const goTo = useWorld((s) => s.goTo);
  const mode = useWorld((s) => s.mode);
  const zeroG = useWorld((s) => s.zeroG);
  const motionLab = useWorld((s) => s.motionLab);
  const shattered = useWorld((s) => s.shattered);
  const ready = useWorld((s) => s.ready);

  // Keyboard: 1-5 / arrows jump between areas, Esc closes cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const s = useWorld.getState();
      const idx = Math.max(0, NAV.findIndex((n) => n.id === s.section));
      if (e.key === "Escape") s.select(null);
      else if (e.key === "ArrowRight") s.goTo(NAV[(idx + 1) % NAV.length].id);
      else if (e.key === "ArrowLeft") s.goTo(NAV[(idx - 1 + NAV.length) % NAV.length].id);
      else {
        const hit = NAV.find((n) => n.key === e.key);
        if (hit) s.goTo(hit.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`hud ${ready ? "hud-in" : ""}`}>
      <header className="hud-top">
        <button className="hud-brand" onClick={() => goTo("hero")} aria-label="Back to origin">
          <span className="hud-logo">EY</span>
          <span className="hud-brand-text">
            <strong>{profile.name}</strong>
            <em>{profile.title}</em>
          </span>
        </button>
        <nav className="hud-nav" aria-label="Scene sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => goTo(n.id)}
              aria-current={section === n.id ? "true" : undefined}
              className={section === n.id ? "active" : ""}
            >
              <kbd>{n.key}</kbd>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="hud-links">
          <button
            className={`hud-cta ${section === "contact" ? "active" : ""}`}
            onClick={() => goTo(section === "contact" ? "hero" : "contact")}
          >
            {section === "contact" ? "Close channel" : "Contact"}
          </button>
        </div>
      </header>

      <div className="hud-controls" role="group" aria-label="World controls">
        <Toggle on={mode === "heroes"} onClick={() => useWorld.getState().toggleMode()} label="Heroes mode" />
        <Toggle on={zeroG} onClick={() => useWorld.getState().toggleZeroG()} label="Zero-G" />
        <Toggle on={motionLab} onClick={() => useWorld.getState().setMotionLab(!motionLab)} label="Motion lab" />
        {shattered && (
          <button className="hud-rebuild" onClick={() => useWorld.getState().reassemble()}>
            ⟲ Rewind time
          </button>
        )}
      </div>

      <p className="hud-hint">
        <span>Drag</span> to throw · <span>Click</span> to inspect · <span>1–5</span> to travel
      </p>
      <Fps />
      <Tooltip />
      <MotionLab />
      <ContactForm />
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`hud-toggle ${on ? "on" : ""}`} onClick={onClick} aria-pressed={on}>
      <span className="hud-toggle-led" />
      {label}
    </button>
  );
}

/** Follows the mouse with the name of whatever is under it. */
function Tooltip() {
  const tooltip = useWorld((s) => s.tooltip);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (el.current) el.current.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 18}px, 0)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div
      ref={el}
      className={`hud-tooltip ${tooltip ? "show" : ""}`}
      style={{ ["--tip" as string]: tooltip?.color ?? "#fff" }}
      aria-hidden
    >
      {tooltip?.text}
    </div>
  );
}

function Fps() {
  const el = useRef<HTMLSpanElement>(null);
  const quality = useWorld((s) => s.quality);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames++;
      if (t - last >= 500) {
        if (el.current) el.current.textContent = String(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="hud-fps" aria-hidden>
      <span ref={el}>--</span> fps · {quality}
    </div>
  );
}
