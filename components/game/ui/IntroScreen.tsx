"use client";

import { useEffect, useRef, useState } from "react";
import { experience, profile } from "@/content/portfolio";
import { YEARS_EXPERIENCE } from "../world";
import { intro, useGame } from "../store";

const AVATAR = "https://res.cloudinary.com/dkfnkf3gl/image/upload/w_160,h_160,c_fill,g_face/v1768326078/portfolio/projects/dtcmayvvyrmwldrt6kub.png";
/** Scrolling past this point commits you to entering the island. */
const COMMIT = 0.04;

/**
 * Game-style title screen over a cinematic orbit of the island. Scroll down,
 * press ↓ / Enter / Space, or hit PLAY to dive in. One-way: progress never
 * goes back, and a refresh in the same tab skips straight to the game.
 */
export function IntroScreen() {
  const entered = useGame((s) => s.entered);
  const ready = useGame((s) => s.ready);
  const root = useRef<HTMLDivElement>(null);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("island-entered") === "1";
    } catch {
      /* ignore */
    }
    if (seen) {
      intro.p = intro.target = 1;
      setSkip(true);
      useGame.getState().setEntered();
    }
  }, []);

  useEffect(() => {
    if (entered || skip) return;
    const push = (amount: number) => {
      if (!useGame.getState().ready) return; // wait for the island to load
      intro.target = Math.min(1, intro.target + amount);
      if (intro.target >= COMMIT) intro.target = 1;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) push(e.deltaY / 1200); // scrolling up does nothing: no way back
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      if (dy > 0) push(dy / 500);
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "Enter", "Space", "NumpadEnter"].includes(e.code)) {
        e.preventDefault();
        push(1);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      intro.p += (intro.target - intro.p) * (1 - Math.exp(-dt * (intro.target >= 1 ? 1.6 : 6)));
      if (intro.target >= 1 && intro.p > 0.998) intro.p = 1;
      const el = root.current;
      if (el) {
        const k = Math.min(1, intro.p * 2.2);
        el.style.opacity = String(1 - k);
        el.style.transform = `translateY(${-k * 90}px) scale(${1 + k * 0.06})`;
        el.style.pointerEvents = k > 0.5 ? "none" : "auto";
      }
      if (intro.p >= 1) {
        useGame.getState().setEntered();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [entered, skip]);

  if (entered || skip) return null;

  const current = experience[0];
  return (
    <div ref={root} className={`intro ${ready ? "in" : ""}`}>
      <div className="intro-title">
        <span className="intro-kicker">a playable portfolio</span>
        <h1>
          ELDAD&apos;S <em>ISLAND</em>
        </h1>
      </div>

      <section className="intro-card" aria-label="Eldad at a glance">
        <div className="intro-who">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="Eldad Yikne" />
          <div>
            <h2>{profile.name}</h2>
            <p>{profile.title}</p>
          </div>
        </div>
        <ul className="intro-facts">
          <li>
            <b>{YEARS_EXPERIENCE}+</b> years building production web apps
          </li>
          <li>
            <b>{current.role}</b> at {current.company}, since {current.period.split(" — ")[0]}
          </li>
          <li>
            <b>Stack</b> Angular · React · Next.js · TypeScript · Node.js
          </li>
          <li>
            <b>AI</b> Claude AI · OpenAI · MCP · AI agents
          </li>
        </ul>
        <div className="intro-links">
          <a href={profile.cv} target="_blank" rel="noopener noreferrer" className="cv">
            📄 CV
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={`mailto:${profile.email}`}>Email</a>
        </div>
      </section>

      <button className="intro-play" onClick={() => (intro.target = 1)} disabled={!ready}>
        {ready ? "▶ PLAY" : "Loading…"}
      </button>
      <p className="intro-scroll" aria-hidden>
        <span>scroll to enter the island</span>
        <i>⌄</i>
      </p>
    </div>
  );
}
