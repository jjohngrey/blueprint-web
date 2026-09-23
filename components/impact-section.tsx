"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const PARTNERSHIP_EMAIL = "blueprint@ubcbiztech.com";

const partners = [
  { name: "RBC", asset: "rbc" },
  { name: "a16z", asset: "a16z" },
  { name: "GeoComply", asset: "geocomply" },
  { name: "Deloitte", asset: "deloitte" },
  { name: "Tesla", asset: "tesla" },
  { name: "Google", sprite: "google" },
  { name: "Intuit", sprite: "intuit" },
  { name: "Kardium", asset: "kardium" },
  { name: "EA", asset: "ea" },
  { name: "EY", asset: "ey" },
  { name: "Fetch.ai", asset: "fetch-ai" },
  { name: "Spring", sprite: "spring" },
  { name: "OPAL", sprite: "opal" },
  { name: "Investly", asset: "investly" },
  { name: "TransLink", asset: "translink" },
  { name: "vidIQ", sprite: "vidiq" },
  { name: "Boomi", asset: "boomi" },
  { name: "Internet Backyard", asset: "internet-backyard" },
] as const;

const speakers = [
  { first: "Anna", last: "Baird", title: "Former Chief Customer Officer, Generative AI at Google Cloud" },
  { first: "Si Jia", last: "Wen", title: "Founder, Creatorgen" },
  { first: "Leo", last: "Zhang", title: "Community Staff, Tech Career North" },
  { first: "Cornelius", last: "van Heerden", title: "Data Analytics Expert, Google Cloud" },
  { first: "Jonathan", last: "Javier", title: "Co-Founder, Wonsulting" },
  { first: "Jeff", last: "Nguyen", title: "Tech Recruiter and Founder, Tesla & BobaTalks" },
] as const;

function PartnerCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        carousel.dataset.visible = String(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={carouselRef} className="partner-carousel" data-visible="false">
      <div className="partner-track">
        {[false, true].map((duplicate) => (
          <div className="partner-group" aria-hidden={duplicate} key={String(duplicate)}>
            {partners.map((partner) => (
              <span className="partner-logo-frame" key={`${duplicate}-${partner.name}`}>
                {"asset" in partner ? (
                  <Image
                    src={`/partners/${partner.asset}.svg`}
                    alt={duplicate ? "" : partner.name}
                    className={`partner-logo partner-logo-${partner.asset}`}
                    width={160}
                    height={64}
                  />
                ) : (
                  <span
                    className={`partner-sprite partner-sprite-${partner.sprite}`}
                    role={duplicate ? undefined : "img"}
                    aria-label={duplicate ? undefined : partner.name}
                  />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImpactSection() {
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const copyPartnershipEmail = async () => {
    try {
      await navigator.clipboard.writeText(PARTNERSHIP_EMAIL);
      setCopyStatus("copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = PARTNERSHIP_EMAIL;
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
    <section id="our-impact" data-impact-section className="scroll-mt-8 space-y-20 border-t border-black/15 pt-10">
      <div className="flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start">
        <div className="space-y-4">
          <p className="site-eyebrow">Our impact</p>
          <h2 className="site-page-title text-balance impact-title-roll">
            <span className="impact-title-roll-window">
              <span className="impact-title-roll-label impact-title-roll-current">
                Who we partner with.
              </span>
              <span
                aria-hidden="true"
                className="impact-title-roll-label impact-title-roll-next"
              >
                Who we partner with.
              </span>
            </span>
          </h2>
        </div>
        <div className="flex min-h-14 flex-col items-end gap-1.5 max-sm:items-start">
          <a
            href="mailto:blueprint@ubcbiztech.com?subject=BluePrint%20Tech%20Week%20Partnership"
            className="partner-cta button-roll"
            onClick={() => void copyPartnershipEmail()}
          >
            <span className="button-roll-window" aria-hidden="true">
              <span className="button-roll-label button-roll-current">Partner with us</span>
              <span className="button-roll-label button-roll-next">Partner with us</span>
            </span>
            <span className="sr-only">Partner with us by email</span>
          </a>
          <span className="min-h-4 text-xs text-[var(--highlight-color)]" role="status" aria-live="polite">
            {copyStatus === "copied" ? "Email copied" : copyStatus === "failed" ? "Could not copy email" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <p className="site-eyebrow">Past partners</p>
        <PartnerCarousel />
      </div>

      <div className="space-y-6">
        <p className="site-eyebrow">Past speakers</p>
        <div className="grid grid-cols-3 border-l border-t border-black/15 max-md:grid-cols-2 max-sm:grid-cols-1">
          {speakers.map((speaker) => (
            <article className="flex min-h-40 flex-col justify-between border-b border-r border-black/15 p-4" key={speaker.last}>
              <h3 className="font-serif text-2xl leading-none tracking-[-0.05em]">
                {speaker.first}{" "}<span className="font-normal text-[var(--highlight-color)] italic tracking-[-0.1em]">{speaker.last}</span>
              </h3>
              <p className="max-w-64 text-xs leading-snug tracking-[-0.03em]">{speaker.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
