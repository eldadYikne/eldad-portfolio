"use client";

import { useEffect } from "react";
import { preloadVoices, setBattleMusic, sfx, unlockAudio, voice } from "./audio";
import { useGame } from "./store";
import { useCombat } from "./combat/state";
import { ZONES } from "./world";

const VOICES = [
  "welcome", "complete", "mission_start", "wave_1", "wave_2", "wave_3", "wave_4", "final_wave", "wave_clear",
  "victory", "defeat", "boss_critter", "boss_octo", "boss_knot",
  "w_sword", "w_pistol", "w_shotgun", "w_laser", "w_rocket",
  ...ZONES.map((z) => `z_${z.id}`),
];

/** Turns game-state changes into sound: no rendering, just subscriptions. */
export function AudioDirector() {
  useEffect(() => {
    let welcomed = false;
    const unlock = () => {
      unlockAudio();
      preloadVoices(VOICES);
      if (!welcomed && useGame.getState().started) {
        welcomed = true;
        setTimeout(() => voice("welcome", { interrupt: false }), 150);
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    const offGame = useGame.subscribe((s, p) => {
      if (s.reward && s.reward !== p.reward) {
        sfx("xp");
        voice(s.visited.length === ZONES.length ? "complete" : `z_${s.reward.id}`);
      }
    });

    const offCombat = useCombat.subscribe((s, p) => {
      setBattleMusic(!!s.mission);
      const m = s.mission;
      const pm = p.mission;
      if (m && s.weaponAt !== p.weaponAt && s.weapon !== "fists") setTimeout(() => voice(`w_${s.weapon}`), 250);
      if (!m) return;
      const changed = !pm || m.phase !== pm.phase || m.wave !== pm.wave;
      if (!changed) return;
      if (m.phase === "intro") {
        sfx("start");
        voice(`boss_${m.boss}`);
      } else if (m.phase === "fight") voice(m.wave === 5 ? "final_wave" : `wave_${m.wave}`);
      else if (m.phase === "clear") {
        sfx("clear");
        voice("wave_clear");
      } else if (m.phase === "victory") {
        sfx("victory");
        setTimeout(() => voice("victory"), 300);
      } else if (m.phase === "defeat") {
        sfx("defeat");
        voice("defeat");
      }
    });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      offGame();
      offCombat();
    };
  }, []);
  return null;
}
