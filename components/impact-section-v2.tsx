"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const partners = [
  ["RBC", "rbc"],
  ["a16z", "a16z"],
  ["GeoComply", "geocomply"],
  ["Deloitte", "deloitte"],
  ["Tesla", "tesla"],
  ["Kardium", "kardium"],
  ["EA", "ea"],
  ["EY", "ey"],
  ["Fetch.ai", "fetch-ai"],
  ["Investly", "investly"],
  ["TransLink", "translink"],
  ["Boomi", "boomi"],
  ["Internet Backyard", "internet-backyard"],
] as const;
const sprites = [
  ["Google", "google"],
  ["Intuit", "intuit"],
  ["Spring", "spring"],
  ["OPAL", "opal"],
  ["vidIQ", "vidiq"],
] as const;
const facultyMix = [
  ["Science", "36.3%"],
  ["Commerce", "36.1%"],
  ["Engineering", "11.3%"],
  ["Arts", "10.9%"],
  ["Other", "5.4%"],
] as const;
const benefits = [
  [
    "01",
    "Meet and recruit emerging technical talent",
    "Connect directly with students across business and technology.",
  ],
  [
    "02",
    "Share work directly with students",
    "Lead workshops, join panels and bring real challenges into the room.",
  ],
  [
    "03",
    "Build long-term visibility",
    "Create meaningful touchpoints in Vancouver’s technology community.",
  ],
] as const;
const speakers = [
  {
    first: "Anna",
    last: "Baird",
    title: "Former Chief Customer Officer, Generative AI at Google Cloud",
    image: "/speakers/anna-baird.webp",
    linkedin: "https://ca.linkedin.com/in/bairdanna",
    position: "center 72%",
    scale: 1.14,
  },
  {
    first: "Si Jia",
    last: "Wen",
    title: "Founder, Creatorgen",
    image: "/speakers/si-jia-wen-new.jpg",
    linkedin: "https://www.linkedin.com/in/sijiawen",
    position: "center",
    scale: 1,
  },
  {
    first: "Leo",
    last: "Zhang",
    title: "Community Staff, Tech Career North",
    image: "/speakers/leo-zhang.webp",
    linkedin: "https://www.linkedin.com/in/leonidas-zhang/",
    position: "center 48%",
  },
  {
    first: "Cornelius",
    last: "van Heerden",
    title: "Data Analytics Expert, Google Cloud",
    image: "/speakers/cornelius-van-heerden.webp",
    linkedin: "https://ca.linkedin.com/in/corneliusvh",
    position: "center",
    scale: 1.14,
  },
  {
    first: "Jonathan",
    last: "Javier",
    title: "Co-Founder, Wonsulting",
    image: "/speakers/jonathan-javier.webp",
    linkedin: "https://www.linkedin.com/in/jonathan-wonsulting",
    position: "76% center",
  },
  {
    first: "Jeff",
    last: "Nguyen",
    title: "Tech Recruiter and Founder, Tesla & BobaTalks",
    image: "/speakers/jeff-nguyen.webp",
    linkedin: "https://www.linkedin.com/in/jvngyn/",
    position: "center",
  },
] as const;
const testimonials = [
  [
    "Landing an internship at Electronic Arts was a dream come true. It all started with my involvement in BizTech, a club sponsored by EA. Attending BluePrint, gave me direct exposure to the gaming industry and helped me land this opportunity.",
    "Mikayla Liang",
    "Full-time Data Analyst at Electronic Arts",
    "/testimonials/mikayla-liang.webp",
  ],
  [
    "Going to BizTech's BluePrint helped me learn skills outside of the classroom and gave me an opportunity to talk to founders. Those conversations led me to build SetDM, which reached $38K per month and generated $1M for clients in eight months.",
    "Ayden Lum",
    "Founder of SetDM",
    "/testimonials/ayden-lum.webp",
  ],
  [
    "BluePrint gave me direction when I was a first-year student. It introduced me to people, companies and paths, shaping the opportunities I pursued. We want every student to leave with that same sense of direction and opportunities.",
    "Chris Lee",
    "BizTech President",
    "/testimonials/chris-lee.webp",
  ],
] as const;

function AnimatedStat({
  target,
  suffix = "",
  decimals = 0,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const visualRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const visual = visualRef.current;
    if (!trigger || !visual) return;

    let frameId = 0;
    let flipAnimation: Animation | null = null;
    let started = false;
    const finalValue = `${target.toFixed(decimals)}${suffix}`;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const start = () => {
      if (started) return;
      started = true;
      if (reducedMotion) {
        visual.textContent = finalValue;
        return;
      }

      const duration = 1800;
      let startTime: number | null = null;
      let previousValue = "";
      flipAnimation = visual.animate(
        [
          {
            opacity: 0.18,
            transform: "perspective(700px) translateY(-18%) rotateX(-72deg)",
          },
          {
            opacity: 1,
            transform: "perspective(700px) translateY(0) rotateX(0deg)",
          },
        ],
        {
          duration: 1100,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        }
      );

      const update = (time: number) => {
        startTime ??= time;
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const nextValue = `${(target * eased).toFixed(decimals)}${suffix}`;
        if (nextValue !== previousValue) {
          visual.textContent = nextValue;
          previousValue = nextValue;
        }
        if (progress < 1) frameId = requestAnimationFrame(update);
      };

      frameId = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        start();
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(trigger);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      flipAnimation?.cancel();
    };
  }, [decimals, suffix, target]);

  const finalValue = `${target.toFixed(decimals)}${suffix}`;
  return (
    <span
      ref={triggerRef}
      className="impact-stat-value"
      aria-label={finalValue}
    >
      <span
        ref={visualRef}
        className="impact-stat-flip"
        aria-hidden="true"
      >{`${(0).toFixed(decimals)}${suffix}`}</span>
    </span>
  );
}

function PartnerCarousel() {
  return (
    <div className="partner-carousel" data-visible="true">
      <div className="partner-track">
        {[false, true].map((duplicate) => (
          <div
            className="partner-group"
            aria-hidden={duplicate}
            key={String(duplicate)}
          >
            {partners.map(([name, asset]) => (
              <span className="partner-logo-frame" key={`${duplicate}-${name}`}>
                <Image
                  src={`/partners/${asset}.svg`}
                  alt={duplicate ? "" : name}
                  className={`partner-logo partner-logo-${asset}`}
                  width={160}
                  height={64}
                />
              </span>
            ))}
            {sprites.map(([name, sprite]) => (
              <span className="partner-logo-frame" key={`${duplicate}-${name}`}>
                <span
                  className={`partner-sprite partner-sprite-${sprite}`}
                  role={duplicate ? undefined : "img"}
                  aria-label={duplicate ? undefined : name}
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [quote, name, role] = testimonials[active];
  const advance = (direction: number) => setActive((index) =>
    (index + direction + testimonials.length) % testimonials.length);

  return (
    <div
      className="testimonial-shell"
      role="region"
      aria-roledescription="carousel"
      aria-label="Attendee testimonials"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          advance(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <p className="site-eyebrow">Testimonials</p>
      <article
        className="testimonial-card"
        aria-live="polite"
        aria-atomic="true"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1);
        }}
      >
        <div className="testimonial-avatar">
          {testimonials.map(([, person, , portrait], index) => (
            <Image
              key={portrait}
              alt={index === active ? `${person} portrait` : ""}
              fill
              hidden={index !== active}
              loading="eager"
              sizes="(max-width: 768px) 112px, 160px"
              src={portrait}
              style={person === "Ayden Lum" ? { transform: "scale(1.24) translate(-7%, -3%)" } : undefined}
            />
          ))}
        </div>
        <blockquote className="testimonial-quote">“{quote}”</blockquote>
        <footer>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-black/55">{role}</p>
        </footer>
      </article>
      <div className="testimonial-controls">
        <button className="testimonial-control" type="button" onClick={() => advance(-1)} aria-label="Previous testimonial"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m14 5-7 7 7 7M7 12h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <div className="flex" aria-label="Choose a testimonial">
          {testimonials.map((item, index) => (
            <button
              className="testimonial-dot"
              data-active={index === active}
              aria-current={index === active ? "true" : undefined}
              aria-label={`Show testimonial ${index + 1}: ${item[1]}`}
              key={index}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
        <button className="testimonial-control" type="button" onClick={() => advance(1)} aria-label="Next testimonial"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m10 5 7 7-7 7m7-7H4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      </div>
    </div>
  );
}

function BenefitCard({ index }: { index: number }) {
  const [number, title, description] = benefits[index];
  return (
    <article className="partner-benefit-card">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

type StatGraphicVariant =
  | "attendees"
  | "partners"
  | "score"
  | "award"
  | "impressions";

function StatGraphic({ variant }: { variant: StatGraphicVariant }) {
  return (
    <svg
      aria-hidden="true"
      className="impact-stat-graphic"
      data-variant={variant}
      viewBox="0 0 96 72"
    >
      {variant === "attendees" && (
        <>
          <circle cx="38" cy="27" r="10" />
          <circle cx="61" cy="31" r="7" />
          <path d="M18 61c2-15 10-23 20-23s19 8 21 23M51 61c1-11 6-17 14-17 7 0 12 6 13 17" />
        </>
      )}
      {variant === "partners" && (
        <>
          <rect x="17" y="24" width="62" height="39" rx="6" />
          <path d="M36 24v-8h24v8M17 38c13 8 49 8 62 0M43 39h10v9H43z" />
        </>
      )}
      {variant === "score" && (
        <>
          <path d="M13 57 35 37l14 11 30-33" />
          <path d="M63 15h16v16" />
        </>
      )}
      {variant === "award" && (
        <>
          <path d="M31 13h34v13c0 14-7 23-17 23S31 40 31 26V13Z" />
          <path d="M31 20H19v7c0 9 5 14 14 15M65 20h12v7c0 9-5 14-14 15M48 49v10M35 63h26" />
        </>
      )}
      {variant === "impressions" && (
        <>
          <circle cx="48" cy="36" r="5" />
          <path d="M35 24a18 18 0 0 0 0 24M61 24a18 18 0 0 1 0 24M25 15a30 30 0 0 0 0 42M71 15a30 30 0 0 1 0 42" />
        </>
      )}
    </svg>
  );
}

function StatCard({
  className,
  target,
  suffix,
  decimals,
  label,
  detail,
  graphic,
}: {
  className: string;
  target: number;
  suffix?: string;
  decimals?: number;
  label: string;
  detail?: string;
  graphic: StatGraphicVariant;
}) {
  return (
    <article
      className={`impact-card impact-stat-card ${className}`}
    >
      <div className="impact-stat-card-layout">
        <div>
          <AnimatedStat target={target} suffix={suffix} decimals={decimals} />
          <h3>{label}</h3>
          {detail ? <p>{detail}</p> : null}
        </div>
        <StatGraphic variant={graphic} />
      </div>
    </article>
  );
}

function AwardCard({ className, year }: { className: string; year: string }) {
  return (
    <article
      className={`impact-card impact-stat-card ${className}`}
    >
      <div className="impact-stat-card-layout">
        <div>
          <span className="impact-stat-value">
            <span className="impact-stat-flip">{year}</span>
          </span>
          <h3>Conference of the Year</h3>
        </div>
        <StatGraphic variant="award" />
      </div>
    </article>
  );
}

function SpeakerGrid() {
  return (
    <div className="speaker-section space-y-5">
      <p className="site-eyebrow">Past speakers</p>
      <div className="speaker-compact-grid">
        {speakers.map((speaker) => (
          <a className="speaker-card" key={speaker.last} href={speaker.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`View ${speaker.first} ${speaker.last} on LinkedIn`}>
            <div className="speaker-headshot">
              <Image
                alt={`${speaker.first} ${speaker.last}`}
                fill
                sizes="(max-width: 768px) 50vw, 17vw"
                src={speaker.image}
                style={{
                  objectFit: "cover",
                  objectPosition: speaker.position,
                  transform: `scale(${"scale" in speaker ? speaker.scale : 1})`,
                }}
              />
            </div>
            <h3>
              {speaker.first} <span>{speaker.last}</span>
            </h3>
            <p>{speaker.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ImpactSection() {
  const impactGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = impactGridRef.current;
    if (!grid) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) grid.dataset.visible = "true";
      },
      { threshold: 0 }
    );
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-28">
      <section
        id="our-partners"
        className="scroll-mt-28"
      >
        <div className="sticky-section-label">
          <p className="site-eyebrow">Past partners &amp; represented companies</p>
        </div>
        <div className="space-y-16 pb-8 pt-8">
          <div className="partner-intro">
            <a className="impact-section-title partner-email-link" href="mailto:blueprint@ubcbiztech.com?subject=BluePrint%20Tech%20Week%20Partnership">Partner with BluePrint. <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
          </div>
          <div className="partner-carousel-block">
            <PartnerCarousel />
            <p className="partner-carousel-caption">Companies represented at past BluePrint events. 2027 partners will be announced.</p>
          </div>
          <div className="why-partner-layout">
            <div className="why-partner-heading">
              <h2 className="text-balance">Why partner.</h2>
              <a
                href="https://drive.google.com/file/d/1EJk7pqLWyb52iTiXHVL-3F0QkUm_GfzP/view"
                className="partner-cta button-roll"
                target="_blank"
                rel="noreferrer"
              >
                <span className="button-roll-window" aria-hidden="true">
                  <span className="button-roll-label button-roll-current">View partnership package</span>
                  <span className="button-roll-label button-roll-next">View partnership package</span>
                </span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="sr-only">View partnership package in a new tab</span>
              </a>
            </div>
            <div className="partner-benefit-grid">
              <BenefitCard index={0} />
              <div className="partner-benefit-image">
                <Image
                  alt="Students and industry partners connecting at BluePrint"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  src="/why-partner/meet-and-recruit.webp"
                />
              </div>
              <BenefitCard index={2} />
              <div className="partner-benefit-image">
                <Image
                  alt="Industry speaker presenting at a BizTech event"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  src="/why-partner/build-visibility.webp"
                />
              </div>
              <BenefitCard index={1} />
              <div className="partner-benefit-image partner-benefit-image-share">
                <Image
                  alt="Students exploring a partner demonstration"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  src="/why-partner/share-work.webp"
                />
              </div>
            </div>
          </div>
          <SpeakerGrid />
        </div>
      </section>

      <hr className="section-divider" />
      <section
        id="our-impact"
        data-impact-section
        className="scroll-mt-28"
      >
        <div className="sticky-section-label">
          <p className="site-eyebrow">Our impact</p>
        </div>
        <div className="impact-sticky-stage">
          <div className="impact-sticky-frame">
            <h2 className="impact-section-title text-balance">
              Last year&apos;s numbers
            </h2>
            <div
              ref={impactGridRef}
              className="impact-grid"
              data-visible="false"
            >
              <StatCard
                className="impact-attendees"
                target={380}
                suffix="+"
                label="Attendee registrations"
                graphic="attendees"
              />
              <StatCard
                className="impact-partners"
                target={100}
                suffix="+"
                label="Partners"
                graphic="partners"
              />
              <StatCard
                className="impact-nps"
                target={87}
                suffix="%"
                label="Net promoter score"
                graphic="score"
              />
              <article className="impact-card impact-faculties">
                <div>
                  <h3 className="text-xl">Faculty representation</h3>
                </div>
                <dl className="impact-faculty-list">
                  {facultyMix.map(([faculty, value]) => (
                    <div key={faculty}>
                      <dt>{faculty}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
              <AwardCard className="impact-award-2025" year="2025" />
              <AwardCard className="impact-award-2026" year="2026" />
              <StatCard
                className="impact-impressions"
                target={1.3}
                suffix="M+"
                decimals={1}
                label="Social media impressions"
                graphic="impressions"
              />
              <a
                className="impact-card impact-news"
                href="https://globalnews.ca/video/11648924/ubc-biztechs-2026-blueprint-conference"
                rel="noreferrer"
                target="_blank"
              >
                <div className="impact-news-content">
                  <p className="site-eyebrow">Featured on Global News</p>
                  <span className="impact-news-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
        <TestimonialCarousel />
      </section>
    </div>
  );
}
