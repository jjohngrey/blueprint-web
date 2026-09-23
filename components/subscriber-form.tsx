"use client";

import { useState, type FormEvent } from "react";

function BellIcon() {
  return (
    <svg aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.75]" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </svg>
  );
}

export function SubscriberForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "duplicate" | "error">("idle");

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), website: data.get("website") }),
      });
      const result = (await response.json()) as { alreadySubscribed?: boolean };
      if (!response.ok) throw new Error("Subscription failed");
      setStatus(result.alreadySubscribed ? "duplicate" : "success");
      if (!result.alreadySubscribed) form.reset();
    } catch {
      setStatus("error");
    }
  };

  const message = status === "success"
    ? "You’re on the list."
    : status === "duplicate"
      ? "You’re already on the list."
      : status === "error"
        ? "Could not subscribe. Try again."
        : "";
  const buttonLabel = status === "submitting" ? "Adding you" : "Stay up to date";

  return (
    <form className="subscriber-form" onSubmit={subscribe}>
      <label className="sr-only" htmlFor="subscriber-email">Email address</label>
      <input id="subscriber-email" name="email" type="email" autoComplete="email" placeholder="Email address" required className="subscriber-input" />
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button className="subscriber-button button-roll" type="submit" disabled={status === "submitting"}>
        <span className="button-roll-window" aria-hidden="true">
          <span className="button-roll-label button-roll-current">{buttonLabel}</span>
          <span className="button-roll-label button-roll-next">{buttonLabel}</span>
        </span>
        <BellIcon />
        <span className="sr-only">{buttonLabel}</span>
      </button>
      <span className="subscriber-status" role="status" aria-live="polite">{message}</span>
    </form>
  );
}
