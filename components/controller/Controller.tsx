"use client";

import { useEffect, useRef, useState } from "react";
import type { DataConnection } from "peerjs";
import { Lilita_One } from "next/font/google";
import type { HostMsg, PhoneMsg } from "@/components/game/social/phone";
import "./controller.css";

const game = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-game" });

/** The phone side: two sticks streaming input to the desktop game over WebRTC. */
export function Controller() {
  const [status, setStatus] = useState<"connecting" | "ready" | "lost" | "noid">("connecting");
  const [state, setState] = useState<Extract<HostMsg, { t: "state" }> | null>(null);
  const conn = useRef<DataConnection | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return setStatus("noid");
    let peer: import("peerjs").Peer | null = null;
    let cancelled = false;
    import("peerjs").then(({ Peer }) => {
      if (cancelled) return;
      peer = new Peer({ debug: 0 });
      peer.on("open", () => {
        const c = peer!.connect(id, { serialization: "json" });
        conn.current = c;
        c.on("open", () => {
          setStatus("ready");
          c.send({ t: "hello" } satisfies PhoneMsg);
        });
        c.on("data", (d) => {
          const m = d as HostMsg;
          if (m.t === "state") setState(m);
          if (m.t === "hurt") navigator.vibrate?.(60);
        });
        c.on("close", () => setStatus("lost"));
      });
      peer.on("error", () => setStatus("lost"));
    });
    return () => {
      cancelled = true;
      peer?.destroy();
    };
  }, []);

  const send = (m: PhoneMsg) => conn.current?.open && conn.current.send(m);

  return (
    <div className={`pad ${game.variable}`}>
      <header className="pad-top">
        <span className={`pad-dot ${status}`} />
        <strong>
          {status === "ready" ? (state?.zone ?? "Exploring the island") : status === "connecting" ? "Connecting…" : status === "noid" ? "Scan the QR on the big screen" : "Connection lost: rescan the QR"}
        </strong>
        {state?.mission && (
          <div className="pad-hp">
            <span style={{ width: `${state.hp}%` }} />
          </div>
        )}
      </header>

      <div className="pad-sticks">
        <Stick label="MOVE" color="#60a5fa" onMove={(x, y) => send({ t: "move", x, y })} onEnd={() => send({ t: "move", x: 0, y: 0 })} />
        <div className="pad-center">
          {state?.near && (
            <button className="pad-start" onClick={() => send({ t: "start" })}>
              ⚔️ START
            </button>
          )}
          <p className="pad-tip">Tip: turn your phone sideways</p>
        </div>
        <Stick
          label={state?.mission ? "AIM · FIRE" : "AIM"}
          color="#f87171"
          onMove={(x, y) => send({ t: "aim", x, y, active: true })}
          onEnd={() => send({ t: "aim", x: 0, y: 0, active: false })}
        />
      </div>
    </div>
  );
}

function Stick({ label, color, onMove, onEnd }: { label: string; color: string; onMove: (x: number, y: number) => void; onEnd: () => void }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const last = useRef(0);

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    knob.current!.style.transform = `translate(${x * 46}px, ${y * 46}px)`;
    // ~40 updates per second is plenty and keeps the data channel calm.
    const now = performance.now();
    if (now - last.current > 25) {
      last.current = now;
      onMove(+x.toFixed(3), +y.toFixed(3));
    }
  };
  const end = () => {
    knob.current!.style.transform = "";
    onEnd();
  };

  return (
    <div className="pad-stick-wrap">
      <div
        ref={base}
        className="pad-stick"
        style={{ ["--c" as string]: color }}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* pointer already released */
          }
          navigator.vibrate?.(8);
          update(e);
        }}
        onPointerMove={(e) => e.buttons && update(e)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div ref={knob} className="pad-knob" />
      </div>
      <span>{label}</span>
    </div>
  );
}
