"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "blueprint@ubcbiztech.com";

type ContactIconProps = {
  className?: string;
};

function GlobeIcon({ className }: ContactIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

function InstagramIcon({ className }: ContactIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon({ className }: ContactIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.41v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.1 20.45H3.54V8.98H7.1v11.47Z" />
    </svg>
  );
}

function EmailIcon({ className }: ContactIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

const navigation = [
  // Standalone routes parked for now:
  // ["About", "/about"],
  // ["Partners", "/partners"],
  ["About", "/#our-story"],
  ["Partners", "/#our-impact"],
  ["FAQ", "/faq"],
] as const;

export function SiteHeader() {
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const copyContactEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopyStatus("copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = CONTACT_EMAIL;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      setCopyStatus(copied ? "copied" : "failed");
    }

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCopyStatus(null), 2200);
  };

  return (
    <header className="w-full border-b border-black/15">
      <nav className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center gap-6 px-3 py-4 max-sm:grid-cols-1">
        <div className="flex flex-wrap gap-4">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className="site-nav-link site-nav-underline">
              {label}
            </Link>
          ))}
        </div>
        <div className="justify-self-center">
          <Link href="/" className="site-wordmark site-nav-underline">
            BluePrint Tech Week
          </Link>
        </div>
        <div className="relative justify-self-end max-sm:justify-self-center">
          <a
            href="mailto:blueprint@ubcbiztech.com?subject=BluePrint%20Tech%20Week"
            className="site-nav-link site-nav-underline"
            onClick={() => void copyContactEmail()}
          >
            Contact
          </a>
          <span
            className="absolute right-0 top-full mt-1 whitespace-nowrap text-[0.625rem] text-[var(--highlight-color)] max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            {copyStatus === "copied" ? "Email copied" : copyStatus === "failed" ? "Could not copy email" : ""}
          </span>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full pt-20">
      <div className="mx-auto w-full max-w-7xl border-t border-black/15 px-3 pb-8 pt-8">
        <div className="flex w-full justify-between gap-8 max-sm:flex-col">
          <div className="space-y-3">
            <p className="site-eyebrow">Contacts</p>
            <div className="flex flex-col gap-2">
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="https://www.ubcbiztech.com">
                <GlobeIcon className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.75]" />
                <span>www.ubcbiztech.com</span>
              </a>
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="https://www.instagram.com/ubcbiztech">
                <InstagramIcon className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.75]" />
                <span>@ubcbiztech</span>
              </a>
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="https://www.linkedin.com/company/ubcbiztech/">
                <LinkedInIcon className="h-4 w-4 shrink-0 fill-current" />
                <span>company/ubcbiztech</span>
              </a>
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="mailto:blueprint@ubcbiztech.com">
                <EmailIcon className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.75]" />
                <span>blueprint@ubcbiztech.com</span>
              </a>
            </div>
          </div>
          <p className="site-wordmark">BluePrint Tech Week</p>
        </div>
      </div>
    </footer>
  );
}
