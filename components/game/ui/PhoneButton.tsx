"use client";

import { useEffect, useState } from "react";
import { usePhone } from "../social/phone";

/** HUD button + QR modal for the phone controller (desktop only). */
export function PhoneButton() {
  const status = usePhone((s) => s.status);
  const open = usePhone((s) => s.open);
  const url = usePhone((s) => s.url);
  const [qr, setQr] = useState<string | null>(null);
  const [touch, setTouch] = useState(true);

  useEffect(() => setTouch(window.matchMedia("(pointer: coarse)").matches), []);
  useEffect(() => {
    if (!url) return;
    import("qrcode").then((Q) => Q.toDataURL(url, { margin: 1, width: 260, color: { dark: "#2a1f3d", light: "#ffffff" } }).then(setQr));
  }, [url]);

  if (touch) return null; // you're already holding the phone
  return (
    <>
      <button className={`phone-btn ${status === "connected" ? "on" : ""}`} onClick={() => usePhone.getState().setOpen(!open)} title="Use your phone as a controller">
        <span>📱</span>
        <small>{status === "connected" ? "LINKED" : "PHONE"}</small>
      </button>
      {open && (
        <div className="end-backdrop" onClick={() => usePhone.getState().setOpen(false)}>
          <div className="phone-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="phone-title">
            <h2 id="phone-title">Play with your phone</h2>
            <p>Scan with your phone camera. It becomes a controller over a direct peer-to-peer link, no app needed.</p>
            <div className="phone-qr">
              {status === "error" ? (
                <span>😵 Couldn&apos;t open a link. Try again later.</span>
              ) : qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR code to open the phone controller" />
              ) : (
                <span className="npc-dots"><i /><i /><i /></span>
              )}
            </div>
            {url && (
              <a className="phone-link" href={url} target="_blank" rel="noopener noreferrer">
                or open the controller link
              </a>
            )}
            <p className="phone-status">{status === "connected" ? "✅ Phone connected!" : "Waiting for your phone…"}</p>
            <button onClick={() => usePhone.getState().setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
