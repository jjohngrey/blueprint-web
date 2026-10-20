"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ImagePlaceholder } from "@/components/layout-primitives";

type StoryPage = {
  paragraphs: ReactNode[];
  images: {
    label: string;
    ratio: string;
    src?: string;
    objectPosition?: string;
  }[];
};

const pages: StoryPage[] = [
  {
    paragraphs: [
      <>BluePrint started 10 years ago in 2016.</>,
      <>Across the years, we&apos;ve welcomed over 2000+ attendees.</>,
      <>We&apos;ve partnered with hundreds of companies to bring to students the <strong>best in tech.</strong></>,
    ],
    images: [
      { label: "BluePrint opening ceremonies fireside panel", ratio: "3 / 2", src: "/YALDA24-23.jpg" },
    ],
  },
  {
    paragraphs: [
      <>Our goal and vision for BluePrint this year hasn&apos;t wavered.</>,
      <>We&apos;re committed to a <strong>bigger and better</strong>{" "}<span className="inline-block pl-[0.2em]">BluePrint.</span></>,
      <>This year, BluePrint evolves from a one-day event into three days of conversations, office tours, workshops and hands-on experiences.</>,
    ],
    images: [
      {
        label: "BluePrint event director addressing the audience",
        ratio: "16 / 10",
        src: "/BP-56.jpg",
        objectPosition: "center top",
      },
    ],
  },
  {
    paragraphs: [
      <>This year, BluePrint takes on 3 separate days.</>,
      <><strong>Kickoff, showcase, and networking.</strong></>,
      <>We aim to help students build foundational relationships, discover what&apos;s possible and leave inspired to shape the future.</>,
    ],
    images: [
      { label: "BizTech's in-house NFC card demonstration", ratio: "1 / 1", src: "/DSC04416.jpg" },
      { label: "Formula Electric car showcase", ratio: "1 / 1", src: "/YALDA24-47.jpg" },
      { label: "On-stage mock interviews led by recruiter", ratio: "16 / 9", src: "/YALDA24-96.jpg" },
    ],
  },
];

export function StoryScroll() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let animationFrame = 0;
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const storyPages = Array.from(section.querySelectorAll<HTMLElement>("[data-story-page]"));
      const focusLine = window.innerHeight * 0.5;
      let activePage = 0;

      storyPages.forEach((page, pageIndex) => {
        const { top, height } = page.getBoundingClientRect();
        const bottom = top + height;
        const lines = page.querySelectorAll<HTMLElement>("[data-story-line]");

        if (top <= focusLine && bottom > focusLine) activePage = pageIndex;
        lines.forEach((line) => {
          const fill = line.querySelector<HTMLElement>(".story-line-fill");
          if (!fill) return;
          if (reducedMotion) {
            fill.style.clipPath = "none";
            return;
          }

          const { top: lineTop, height: lineHeightTotal } = line.getBoundingClientRect();
          const litHeight = Math.min(lineHeightTotal, Math.max(0, focusLine - lineTop));
          fill.style.clipPath = `inset(0 0 ${lineHeightTotal - litHeight}px 0)`;
        });
      });

      section.querySelectorAll<HTMLElement>("[data-story-dot]").forEach((dot, index) => {
        const isActive = index === activePage;
        dot.dataset.active = String(isActive);
        dot.parentElement?.setAttribute("aria-current", isActive ? "step" : "false");
      });
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section id="our-story" ref={sectionRef} data-story-section className="relative scroll-mt-8">
      <hr className="section-divider" />
      <div data-story-label className="sticky-section-label sticky-section-label-story flex items-center gap-4">
        <p className="site-eyebrow">Our story</p>
        <ol aria-label="Story progress" className="flex items-center gap-1.5">
          {pages.map((_, index) => (
            <li key={index} aria-label={`Story page ${index + 1}`}>
              <span
                data-story-dot
                data-active={String(index === 0)}
                aria-hidden="true"
                className="story-progress-dot block size-1.5 rounded-full"
              />
            </li>
          ))}
        </ol>
      </div>
      {pages.map((page, index) => (
        <article
          data-story-page
          key={index}
          className="story-page"
        >
          <div className="grid grid-cols-2 items-center gap-10 py-20 max-md:grid-cols-1 max-md:gap-8 max-md:py-12">
            <div className="max-w-xl space-y-3 text-2xl leading-tight sm:text-3xl">
              {page.paragraphs.map((paragraph, paragraphIndex) => (
                <p className="story-line" data-story-line key={paragraphIndex}>
                  <span className="story-line-base">{paragraph}</span>
                  <span className="story-line-fill" aria-hidden="true">{paragraph}</span>
                </p>
              ))}
            </div>
            <div className={page.images.length === 1 ? "w-full" : "grid w-full grid-cols-2 gap-4"}>
              {page.images.map((image, imageIndex) => (
                <div key={image.label} className={page.images.length === 3 && imageIndex === 2 ? "col-span-2" : ""}>
                  <ImagePlaceholder
                    label={image.label}
                    ratio={image.ratio}
                    caption={image.label}
                    src={image.src}
                    objectPosition={image.objectPosition}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
