"use client";

import { useEffect, useState } from "react";
import { BOSSES, PLAYER_MAX_HP, WAVES, WEAPONS, waveStats } from "../combat/defs";
import { useCombat } from "../combat/state";

export function MissionHud() {
  const near = useCombat((s) => s.nearNest);
  const mission = useCombat((s) => s.mission);
  const defeated = useCombat((s) => s.defeated);

  // Enter / E starts the mission you're standing at.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const st = useCombat.getState();
      if ((e.key === "Enter" || e.key.toLowerCase() === "e") && st.nearNest && !st.mission) st.start(st.nearNest);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mission) {
    if (!near) return null;
    const b = BOSSES[near];
    const done = defeated.includes(near);
    return (
      <div className="mission-prompt" style={{ ["--c" as string]: b.color }}>
        <div className="mission-prompt-icon">{b.icon}</div>
        <div className="mission-prompt-body">
          <span className="mission-kicker">{done ? "Defeated · play again?" : `Boss mission · ${"★".repeat(b.tier + 1)}`}</span>
          <h3>{b.name}</h3>
          <p>{b.blurb} 5 waves, a new weapon every wave, and the boss joins in wave 5.</p>
        </div>
        <button onClick={() => useCombat.getState().start(near)}>
          Start <kbd>Enter</kbd>
        </button>
      </div>
    );
  }

  return (
    <>
      <MissionBar />
      <HpBar />
      <WeaponSlot />
      <Banner />
      <HurtFlash />
      {(mission.phase === "victory" || mission.phase === "defeat") && <EndModal />}
    </>
  );
}

function MissionBar() {
  const m = useCombat((s) => s.mission)!;
  const b = BOSSES[m.boss];
  return (
    <div className="mission-bar" style={{ ["--c" as string]: b.color }}>
      <div className="mission-bar-top">
        <span className="mission-bar-icon">{b.icon}</span>
        <strong>{b.name}</strong>
        <div className="wave-pips" aria-label={`Wave ${m.wave} of ${WAVES}`}>
          {Array.from({ length: WAVES }, (_, i) => (
            <span key={i} className={i + 1 < m.wave || (i + 1 === m.wave && m.phase === "clear") ? "done" : i + 1 === m.wave ? "now" : ""} />
          ))}
        </div>
        <button className="mission-leave" onClick={() => useCombat.getState().leave()} aria-label="Leave mission">
          ✕
        </button>
      </div>
      {m.phase === "fight" && (
        <div className="mission-left">
          👾 {m.left} left
        </div>
      )}
      {m.bossHp != null && m.phase === "fight" && (
        <div className="boss-hp">
          <span style={{ width: `${m.bossHp * 100}%` }} />
          <b>BOSS</b>
        </div>
      )}
    </div>
  );
}

function HpBar() {
  const hp = useCombat((s) => s.hp);
  const hurtAt = useCombat((s) => s.hurtAt);
  const k = hp / PLAYER_MAX_HP;
  return (
    <div key={hurtAt} className={`hp ${hurtAt ? "shake" : ""}`} aria-label={`Health ${Math.ceil(hp)} of ${PLAYER_MAX_HP}`}>
      <span className="hp-heart">❤️</span>
      <div className="hp-track">
        <span style={{ width: `${k * 100}%`, background: k > 0.5 ? "#22c55e" : k > 0.25 ? "#facc15" : "#ef4444" }} />
        <b>{Math.ceil(hp)}</b>
      </div>
    </div>
  );
}

function WeaponSlot() {
  const weapon = useCombat((s) => s.weapon);
  const at = useCombat((s) => s.weaponAt);
  const w = WEAPONS[weapon];
  const fresh = performance.now() - at < 1800;
  return (
    <div key={at} className={`weapon-slot ${fresh ? "fresh" : ""}`} style={{ ["--c" as string]: w.color }}>
      {fresh && <span className="weapon-new">NEW!</span>}
      <div className="weapon-icon">{w.icon}</div>
      <span>{w.name}</span>
    </div>
  );
}

/** Big centre-screen text: mission start, wave N, wave clear. */
function Banner() {
  const m = useCombat((s) => s.mission)!;
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    const id = setTimeout(() => setShow(false), m.phase === "intro" ? 1800 : 1500);
    return () => clearTimeout(id);
  }, [m.bannerAt, m.phase]);
  if (!show || m.phase === "victory" || m.phase === "defeat") return null;
  const b = BOSSES[m.boss];
  const stats = waveStats(b, m.wave);
  let big = "";
  let small = "";
  if (m.phase === "intro") {
    big = "MISSION START";
    small = `${b.name}: ${b.title}`;
  } else if (m.phase === "fight") {
    big = m.wave === WAVES ? "FINAL WAVE" : `WAVE ${m.wave}`;
    small = m.wave === WAVES ? `${b.name} boss incoming!` : `${stats.count} monsters · grab the new weapon!`;
  } else if (m.phase === "clear") {
    big = "WAVE CLEAR!";
    small = m.wave < WAVES ? "+40 HP · next wave incoming" : "";
  }
  return (
    <div key={`${m.bannerAt}${m.phase}`} className="wave-banner" style={{ ["--c" as string]: b.color }}>
      <span>{big}</span>
      {small && <small>{small}</small>}
    </div>
  );
}

function HurtFlash() {
  const hurtAt = useCombat((s) => s.hurtAt);
  if (!hurtAt) return null;
  return <div key={hurtAt} className="hurt-flash" />;
}

function EndModal() {
  const m = useCombat((s) => s.mission)!;
  const b = BOSSES[m.boss];
  const won = m.phase === "victory";
  return (
    <div className="end-backdrop">
      <div className={`end-modal ${won ? "won" : "lost"}`} style={{ ["--c" as string]: b.color }}>
        <div className="end-icon">{won ? "🏆" : "💀"}</div>
        <h2>{won ? "VICTORY!" : "DEFEATED"}</h2>
        <p>{won ? `You beat all ${WAVES} waves of the ${b.name}.` : `The ${b.name} got you on wave ${m.wave}.`}</p>
        {won && <div className="end-xp">+500 XP</div>}
        <div className="end-actions">
          {!won && (
            <button className="retry" onClick={() => useCombat.getState().start(m.boss)}>
              Retry
            </button>
          )}
          <button onClick={() => useCombat.getState().leave()}>{won ? "Back to the island" : "Leave"}</button>
        </div>
      </div>
    </div>
  );
}
