"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Lilita_One } from "next/font/google";
import { input, useGame } from "./store";
import { Hud } from "./ui/Hud";
import "./game.css";

const game = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-game" });

// three.js only ever loads in the browser, in its own chunk.
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

const MOVE_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

/**
 * `children` is the server-rendered semantic portfolio: always present for
 * crawlers and screen readers, and shown instead of the game without WebGL.
 */
export function GameHome({ children }: { children: ReactNode }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const ready = useGame((s) => s.ready);

  useEffect(() => {
    try {
      setWebgl(!!document.createElement("canvas").getContext("webgl2"));
    } catch {
      setWebgl(false);
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!MOVE_KEYS.has(k) || (e.target as HTMLElement)?.closest("input, textarea")) return;
      e.preventDefault();
      input.keys.add(k);
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    const blur = () => input.keys.clear();
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
    <div className={`game-root ${game.variable}`}>
      <div className="sr-only">{children}</div>
      <div className="game-canvas">{webgl && <Scene />}</div>
      <Hud />
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
