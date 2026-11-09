"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useWorld } from "./store";
import { Hud } from "./ui/Hud";
import "./immersive.css";

// three / rapier (WASM) / postprocessing only ever load in the browser,
// in their own chunk, after the page shell has already painted.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * `children` is the server-rendered semantic version of the portfolio. It is
 * always in the DOM for crawlers and screen readers, and becomes the visible
 * page when WebGL2 is not available.
 */
export function ImmersiveHome({ children }: { children: ReactNode }) {
  const [support, setSupport] = useState<"pending" | "yes" | "no">("pending");
  const ready = useWorld((s) => s.ready);

  useEffect(() => {
    setSupport(hasWebGL2() ? "yes" : "no");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    useWorld.getState().setReducedMotion(mq.matches);
    // Start conservative on small / low-power screens; PerformanceMonitor adapts from there.
    if (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4) {
      useWorld.getState().setQuality("medium");
    }
  }, []);

  if (support === "no") {
    return <div className="fallback-content">{children}</div>;
  }

  return (
    <div className="immersive-root">
      <div className="sr-only">{children}</div>
      {support === "yes" && (
        <div className="immersive-canvas" aria-hidden={false}>
          <Scene />
        </div>
      )}
      <Hud />
      <Loader done={ready} />
    </div>
  );
}

function Loader({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(id);
  }, [done]);
  if (gone) return null;
  return (
    <div className={`loader ${done ? "loader-out" : ""}`} aria-live="polite">
      <div className="loader-inner">
        <span className="loader-kicker">initializing physics world</span>
        <div className="loader-bar">
          <span />
        </div>
        <span className="loader-name">ELDAD YIKNE</span>
      </div>
    </div>
  );
}
