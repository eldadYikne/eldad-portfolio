"use client";

import { useState, type FormEvent } from "react";
import { profile } from "@/content/portfolio";
import { cardFor, zoneById } from "../world";
import { useGame } from "../store";

/** The pop-up card for the zone the player is standing in. */
export function ZoneCard() {
  const zone = useGame((s) => s.zone);
  if (!zone) return null;
  const z = zoneById[zone];
  const card = cardFor(zone);
  return (
    <section key={zone} className="card" style={{ ["--c" as string]: z.color }} aria-live="polite" aria-labelledby="card-title">
      <div className="card-icon" aria-hidden>
        {z.icon}
      </div>
      <span className="card-kicker">{card.kicker}</span>
      <h2 id="card-title">{card.title}</h2>
      {card.subtitle && <p className="card-sub">{card.subtitle}</p>}
      {card.lines.length > 0 && (
        <ul>
          {card.lines.map((l, i) => (
            <li key={i} style={{ animationDelay: `${120 + i * 70}ms` }}>
              {l}
            </li>
          ))}
        </ul>
      )}
      {card.chips && (
        <>
          <span className="card-label">{card.chipsLabel}</span>
          <div className="chips">
            {card.chips.map((c, i) => (
              <span key={c} style={{ animationDelay: `${200 + i * 30}ms` }}>
                {c}
              </span>
            ))}
          </div>
        </>
      )}
      {zone === "about" && (
        <div className="card-links">
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      )}
      {zone === "contact" && <ContactForm />}
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError("Your name, please (2+ characters).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("That email looks off.");
    if (form.message.trim().length < 10) return setError("Message needs at least 10 characters.");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
      setError(`Couldn't send. Email me at ${profile.email}`);
    }
  };

  if (status === "sent") return <p className="card-sent">📬 Letter delivered! I&apos;ll get back to you soon.</p>;

  const bind = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <form className="card-form" onSubmit={submit} noValidate>
      <input placeholder="Your name" autoComplete="name" aria-label="Your name" {...bind("name")} />
      <input placeholder="Email" type="email" autoComplete="email" aria-label="Email" {...bind("email")} />
      <textarea placeholder="Your message" rows={3} aria-label="Message" {...bind("message")} />
      {error && <p className="card-error" role="alert">{error}</p>}
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send letter ✉️"}
      </button>
    </form>
  );
}
