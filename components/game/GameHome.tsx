"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Lilita_One } from "next/font/google";
import { input, isTyping, useGame } from "./store";
import { Hud } from "./ui/Hud";
import { AudioDirector } from "./AudioDirector";
import { IntroScreen } from "./ui/IntroScreen";
import { useCombat } from "./combat/state";
import "./game.css";

const game = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-game" });

// three.js only ever loads in the browser, in its own chunk.
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

/**
 * Physical key → movement direction. Uses KeyboardEvent.code, not .key, so it
 * works with any keyboard layout (on a Hebrew layout W types "'", A types "ש").
 */
const MOVE_CODES: Record<string, string> = {
  KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d",
  ArrowUp: "arrowup", ArrowDown: "arrowdown", ArrowLeft: "arrowleft", ArrowRight: "arrowright",
};

/**
 * `children` is the server-rendered semantic portfolio: always present for
 * crawlers and screen readers, and shown instead of the game without WebGL.
 */
export function GameHome({ children }: { children: ReactNode }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const ready = useGame((s) => s.ready);
  const aiming = useCombat((s) => !!s.mission);

  useEffect(() => {
    try {
      setWebgl(!!document.createElement("canvas").getContext("webgl2"));
    } catch {
      setWebgl(false);
    }
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = true;
      if (e.code === "Space") {
        e.preventDefault(); // no page scroll / button activation
        if (!e.repeat) input.jump = true;
        return;
      }
      const k = MOVE_CODES[e.code];
      if (!k) return;
      e.preventDefault();
      input.keys.add(k);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = false;
      const k = MOVE_CODES[e.code];
      if (k) input.keys.delete(k);
    };
    const blur = () => {
      input.keys.clear();
      input.sprint = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  if (webgl === false) return <div className="game-fallback">{children}</div>;

  return (
    <div className={`game-root ${game.variable} ${aiming ? "aiming" : ""}`}>
      <AudioDirector />
      <div className="sr-only">{children}</div>
      <div className="game-canvas">{webgl && <Scene />}</div>
      <Hud />
      <IntroScreen />
      <Loader done={ready} />
    </div>
  );
}

function Loader({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(id);
  }, [done]);
  if (gone) return null;
  return (
    <div className={`loader ${done ? "out" : ""}`}>
      <div className="loader-logo">EY</div>
      <p>Loading the island…</p>
      <div className="loader-bar">
        <span />
      </div>
    </div>
  );
}
