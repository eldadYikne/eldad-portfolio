"use client";

import { useEffect, useRef, useState } from "react";
import { useWorld } from "../store";
import { motion } from "./motion";

const W = 64;
const H = 48;
const THRESHOLD = 32;

/**
 * Lightweight in-browser motion tracking: frame differencing on a 64×48
 * downsample, then the centroid of changed pixels. No ML model to download,
 * runs in well under a millisecond per frame, and nothing leaves the device.
 */
export function MotionLab() {
  const on = useWorld((s) => s.motionLab);
  const setOn = useWorld((s) => s.setMotionLab);
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    const work = document.createElement("canvas");
    work.width = W;
    work.height = H;
    const ctx = work.getContext("2d", { willReadFrequently: true })!;
    let prev: Uint8ClampedArray | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        setError(null);
        motion.active = true;
        loop();
      } catch {
        setError("Camera unavailable or permission denied.");
        setOn(false);
      }
    })();

    function loop() {
      raf = requestAnimationFrame(loop);
      const v = video.current;
      if (!v || v.readyState < 2) return;
      ctx.save();
      ctx.scale(-1, 1); // mirror, so moving right pushes things right
      ctx.drawImage(v, -W, 0, W, H);
      ctx.restore();
      const frame = ctx.getImageData(0, 0, W, H);
      const px = frame.data;
      const gray = new Uint8ClampedArray(W * H);
      for (let i = 0; i < W * H; i++) gray[i] = (px[i * 4] * 77 + px[i * 4 + 1] * 150 + px[i * 4 + 2] * 29) >> 8;

      const o = overlay.current?.getContext("2d");
      const heat = o ? o.createImageData(W, H) : null;
      if (prev) {
        let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (Math.abs(gray[i] - prev[i]) > THRESHOLD) {
              sx += x; sy += y; n++;
              if (heat) {
                heat.data[i * 4] = 34; heat.data[i * 4 + 1] = 211; heat.data[i * 4 + 2] = 238; heat.data[i * 4 + 3] = 220;
              }
            }
          }
        const energy = n / (W * H);
        motion.energy = motion.energy * 0.6 + energy * 0.4;
        if (n > 12) {
          motion.x = motion.x * 0.5 + (sx / n / W) * 0.5;
          motion.y = motion.y * 0.5 + (sy / n / H) * 0.5;
        }
      }
      if (o && heat) o.putImageData(heat, 0, 0);
      prev = gray;
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      motion.active = false;
      motion.energy = 0;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, setOn]);

  if (!on && !error) return null;
  return (
    <div className="motion-lab" role="status" aria-live="polite">
      {on ? (
        <>
          <div className="motion-lab-feed">
            <video ref={video} muted playsInline />
            <canvas ref={overlay} width={W} height={H} />
          </div>
          <div className="motion-lab-meta">
            <span className="dot-live" /> MOTION LAB · wave your hands to push objects
            <button onClick={() => setOn(false)}>stop</button>
          </div>
        </>
      ) : (
        <div className="motion-lab-meta">
          {error}
          <button onClick={() => setError(null)}>ok</button>
        </div>
      )}
    </div>
  );
}
