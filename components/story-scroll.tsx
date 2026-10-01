"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ImagePlaceholder } from "@/components/layout-primitives";

type StoryPage = {
  lines: {
    content: ReactNode;
    groupEnd?: boolean;
  }[];
  images: {
    label: string;
    ratio: string;
    src?: string;
    objectPosition?: string;
  }[];
};

const pages: StoryPage[] = [
  {
    lines: [
      { content: <>BluePrint started 10 years ago in 2016.</>, groupEnd: true },
      { content: <>Across the years, we&apos;ve welcomed over</> },
      { content: <>2000+ attendees.</>, groupEnd: true },
      { content: <>We&apos;ve partnered with hundreds of companies</> },
      { content: <>to bring to students the <strong>best in tech.</strong></>, groupEnd: true },
    ],
    images: [
      { label: "BluePrint opening ceremonies fireside panel", ratio: "3 / 2", src: "/YALDA24-23.jpg" },
    ],
  },
  {
    lines: [
      { content: <>Our goal and vision for BluePrint this year</> },
      { content: <>hasn&apos;t wavered.</>, groupEnd: true },
      { content: <>We&apos;re committed to a <strong>bigger and better</strong></> },
      { content: <>BluePrint.</>, groupEnd: true },
      { content: <>This year, BluePrint evolves from a one-day</> },
      { content: <>event into three days of conversations,</> },
      { content: <>office tours, workshops and hands-on</> },
      { content: <>experiences.</>, groupEnd: true },
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
    lines: [
      { content: <>This year, BluePrint takes on 3 separate days.</>, groupEnd: true },
      { content: <><strong>Kickoff, showcase, and networking.</strong></>, groupEnd: true },
      { content: <>We aim to help students build foundational</> },
      { content: <>relationships, discover what&apos;s possible and</> },
      { content: <>leave inspired to shape the future.</>, groupEnd: true },
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

      const labelBottom = section.querySelector<HTMLElement>("[data-story-label]")?.getBoundingClientRect().bottom ?? 0;
      const labelFadeLead = 112;
      const storyPages = Array.from(section.querySelectorAll<HTMLElement>("[data-story-page]"));
      const focusLine = window.innerHeight * 0.45;
      const lineUpdates: Array<{ line: HTMLElement; reveal: number; underLabel: number }> = [];
      let activePage = 0;

      storyPages.forEach((page, pageIndex) => {
        const { top, height } = page.getBoundingClientRect();
        const bottom = top + height;
        const scrollDistance = Math.max(1, height - window.innerHeight);
        const pageProgress = Math.min(1, Math.max(0, -top / scrollDistance));
        const lines = page.querySelectorAll<HTMLElement>("[data-story-line]");

        if (top <= focusLine && bottom > focusLine) activePage = pageIndex;

        lines.forEach((line, index) => {
          const reveal = Math.min(1, Math.max(0, pageProgress * lines.length - index));
          const lineTop = line.getBoundingClientRect().top;
          const underLabel = Math.min(1, Math.max(0, (labelBottom + labelFadeLead - lineTop) / (labelFadeLead + 80)));

          lineUpdates.push({ line, reveal, underLabel });
        });
      });

      lineUpdates.forEach(({ line, reveal, underLabel }) => {
        line.style.setProperty("--reveal", `${reveal * 100}%`);
        line.style.setProperty("--conceal", `${(1 - reveal) * 100}%`);
        line.style.setProperty("--under-story", String(underLabel));
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
    <section id="our-story" ref={sectionRef} data-story-section className="relative scroll-mt-8 border-t border-black/15">
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
          className="h-[240svh] max-sm:h-[300svh]"
        >
          <div className="sticky top-0 grid min-h-svh grid-cols-2 items-center gap-10 py-16 max-sm:grid-cols-1 max-sm:content-center max-sm:gap-8 max-sm:py-12">
            <div className="max-w-xl space-y-1 text-2xl leading-tight sm:text-3xl">
              {page.lines.map((line, lineIndex) => (
                <p className={`story-line${line.groupEnd ? " mb-3" : ""}`} data-story-line key={lineIndex}>
                  <span className="story-line-base">{line.content}</span>
                  <span className="story-line-fill" aria-hidden="true">{line.content}</span>
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
