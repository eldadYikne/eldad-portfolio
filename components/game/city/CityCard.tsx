"use client";

import { useEffect, useState } from "react";
import { useCity } from "./state";

/** Repo card while standing next to a building, plus the warp flash. */
export function CityCard() {
  const near = useCity((s) => s.near);
  const b = useCity((s) => (s.near >= 0 ? s.buildings[s.near] : null));
  if (near < 0 || !b) return null;
  const pushed = new Date(b.pushedAt);
  return (
    <section key={b.name} className="card" style={{ ["--c" as string]: b.color }} aria-live="polite">
      <div className="card-icon" aria-hidden>🏢</div>
      <span className="card-kicker">{b.language ?? "Repo"}</span>
      <h2>{b.name}</h2>
      <p className="card-sub">{b.description ?? "No description yet."}</p>
      <div className="chips meta">
        <span>⭐ {b.stars}</span>
        <span>🍴 {b.forks}</span>
        <span>📦 {(b.size / 1024).toFixed(1)} MB</span>
        <span>🕒 {pushed.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
        {b.fresh && <span>🔥 active</span>}
      </div>
      {b.stack.length > 0 && (
        <>
          <span className="card-label">Stack</span>
          <div className="chips stack">
            {b.stack.map((t, i) => (
              <span key={t} style={{ animationDelay: `${120 + i * 40}ms` }}>
                {t}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="card-links">
        <a href={b.url} target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>
      </div>
    </section>
  );
}

export function WarpFlash() {
  const at = useCity((s) => s.warpAt);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!at) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 600);
    return () => clearTimeout(id);
  }, [at]);
  return show ? <div key={at} className="warp-flash" /> : null;
}
