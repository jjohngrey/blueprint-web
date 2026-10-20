"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  ["Partners", "/#our-partners"],
  ["FAQ", "/faq"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const headerRef = useRef<HTMLElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollPosition = useRef(0);
  const scrollFrame = useRef(0);

  useEffect(() => {
    lastScrollPosition.current = window.scrollY;
    const updateBannerOffset = () => {
      const header = headerRef.current;
      if (header) header.style.setProperty("--banner-offset", `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    };
    updateBannerOffset();

    const handleScroll = () => {
      if (scrollFrame.current) return;
      scrollFrame.current = requestAnimationFrame(() => {
        const nextPosition = window.scrollY;
        updateBannerOffset();
        const delta = nextPosition - lastScrollPosition.current;
        if (nextPosition < 24 || delta < -3) setNavVisible(true);
        else if (delta > 6) setNavVisible(false);
        lastScrollPosition.current = nextPosition;
        scrollFrame.current = 0;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(scrollFrame.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, [pathname]);

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
    <header ref={headerRef} className="site-header-sticky w-full">
      {pathname === "/" && <a
        className="news-banner"
        href="https://globalnews.ca/video/11648924/ubc-biztechs-2026-blueprint-conference"
        rel="noreferrer"
        target="_blank"
      >
        <span>UBC BizTech&apos;s BluePrint on Global News</span>
        <span className="news-banner-link">WATCH VIDEO <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 16 16 4M6 4h10v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      </a>}
      <nav className="site-scroll-navbar w-full" data-visible={navVisible} onFocusCapture={() => setNavVisible(true)}>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center gap-6 px-3 py-4 max-sm:grid-cols-[1fr_auto] max-sm:gap-x-4 max-sm:gap-y-3">
          <div className="flex flex-wrap gap-4 max-sm:order-3 max-sm:col-span-2 max-sm:justify-center">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href} className="site-nav-link site-nav-underline">
                {label}
              </Link>
            ))}
          </div>
          <div className="justify-self-center max-sm:order-1 max-sm:justify-self-start">
            <Link href="/" className="site-wordmark site-nav-underline">
              BluePrint Tech Week
            </Link>
          </div>
          <div className="relative justify-self-end max-sm:order-2">
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
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer relative isolate w-full overflow-hidden border-t border-black/15">
      <div className="footer-video-wrap mx-auto w-full max-w-7xl px-3 pt-8">
        <video src="/hero.mp4" aria-label="BluePrint Tech Week video" autoPlay loop muted playsInline className="block w-full rounded-lg" />
      </div>
      <div className="site-footer-inner relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between px-3 pb-6 pt-8">
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
                <span>ubcbiztech</span>
              </a>
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="https://www.linkedin.com/company/ubcbiztech/">
                <LinkedInIcon className="h-4 w-4 shrink-0 fill-current" />
                <span>ubcbiztech</span>
              </a>
              <a className="site-nav-underline inline-flex w-fit items-center gap-2" href="mailto:blueprint@ubcbiztech.com">
                <EmailIcon className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.75]" />
                <span>blueprint@ubcbiztech.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
