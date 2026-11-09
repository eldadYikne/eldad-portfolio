"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWorld, type ContactField } from "../store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Real inputs (keyboard, autofill, screen readers, mobile keyboards all just
 * work); every keystroke is mirrored into the 3D squad via the store.
 */
export function ContactForm() {
  const open = useWorld((s) => s.section === "contact");
  const contact = useWorld((s) => s.contact);
  const status = useWorld((s) => s.contactStatus);
  const setContact = useWorld((s) => s.setContact);
  const setStatus = useWorld((s) => s.setContactStatus);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Give the guards a beat to land before focusing.
    if (open) {
      const id = setTimeout(() => first.current?.focus(), 900);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  const bind = (field: ContactField) => ({
    value: contact[field],
    onChange: (e: { target: { value: string } }) => {
      setError(null);
      setContact(field, e.target.value);
    },
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (contact.name.trim().length < 2) return setError("Agents need a name (2+ characters).");
    if (!EMAIL.test(contact.email.trim())) return setError("That email won't reach base.");
    if (contact.message.trim().length < 10) return setError("Message must be at least 10 characters.");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name.trim(),
          email: contact.email.trim(),
          message: contact.message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Transmission failed. Try again, or email eldadykn@gmail.com.");
    }
  };

  return (
    <form className="contact-panel" onSubmit={submit} aria-labelledby="contact-title" noValidate>
      <div className="contact-head">
        <span className="dot-live" />
        <h2 id="contact-title">Secure channel</h2>
        <button type="button" className="contact-close" aria-label="Close contact" onClick={() => useWorld.getState().goTo("hero")}>
          ✕
        </button>
      </div>
      <p className="contact-sub">Type it. The agents will deliver every letter.</p>
      <label>
        <span>Name</span>
        <input ref={first} {...bind("name")} autoComplete="name" maxLength={44} required />
      </label>
      <label>
        <span>Email</span>
        <input {...bind("email")} type="email" autoComplete="email" maxLength={44} required />
      </label>
      <label>
        <span>Message</span>
        <textarea {...bind("message")} rows={4} maxLength={1000} required />
        <em className="contact-count">
          {Math.min(contact.message.length, 220)}/220 on the board
        </em>
      </label>
      {error && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="contact-send" disabled={status === "sending"}>
        {status === "sending" ? "Transmitting…" : status === "sent" ? "Delivered ✓ Send another" : "Transmit →"}
      </button>
    </form>
  );
}
