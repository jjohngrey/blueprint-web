"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ImagePlaceholder } from "@/components/layout-primitives";

type StoryPage = {
  lines: ReactNode[];
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
      <>BluePrint started 10 years ago in 2016.</>,
      <>Across the years, we&apos;ve welcomed over 2000+ attendees.</>,
      <>We&apos;ve partnered with hundreds of companies to bring to students the <strong>best in tech.</strong></>,
    ],
    images: [
      { label: "BluePrint opening ceremonies fireside panel", ratio: "3 / 2", src: "/YALDA24-23.jpg" },
    ],
  },
  {
    lines: [
      <>Our goal and vision for BluePrint this year hasn&apos;t wavered.</>,
      <>We&apos;re committed to a <strong>bigger and better</strong> BluePrint.</>,
      <>Students will go to the workplaces where this incredible work is being done.</>,
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
      <>This year, BluePrint takes on 3 separate days.</>,
      <><strong>Kickoff, showcase, and networking.</strong></>,
      <>We&apos;re aiming to inspire the next generation, unveil what&apos;s possible, and bridge the gap for you to build relationships.</>,
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
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const labelBottom = section.querySelector<HTMLElement>("[data-story-label]")?.getBoundingClientRect().bottom ?? 0;
      const storyPages = Array.from(section.querySelectorAll<HTMLElement>("[data-story-page]"));
      const focusLine = window.innerHeight * 0.45;
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
          const underLabel = Math.min(1, Math.max(0, (labelBottom - lineTop) / 80));

          line.style.setProperty("--reveal", `${reveal * 100}%`);
          line.style.setProperty("--conceal", `${(1 - reveal) * 100}%`);
          line.style.setProperty("--under-story", String(underLabel));
        });
      });

      section.querySelectorAll<HTMLElement>("[data-story-dot]").forEach((dot, index) => {
        const isActive = index === activePage;
        dot.dataset.active = String(isActive);
        dot.parentElement?.setAttribute("aria-current", isActive ? "step" : "false");
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <section id="our-story" ref={sectionRef} data-story-section className="relative scroll-mt-8 border-t border-black/15">
      <div data-story-label className="sticky top-8 z-10 flex w-fit items-center gap-4 py-1">
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
          className="h-[240svh]"
        >
          <div className="sticky top-0 grid min-h-svh grid-cols-2 items-center gap-10 py-16 max-sm:grid-cols-1">
            <div className="max-w-xl space-y-4 text-2xl leading-tight sm:text-3xl">
              {page.lines.map((line, lineIndex) => (
                <p className="story-line" data-story-line key={lineIndex}>
                  <span className="story-line-base">{line}</span>
                  <span className="story-line-fill" aria-hidden="true">{line}</span>
                </p>
              ))}
            </div>
            <div className={page.images.length === 1 ? "" : "grid grid-cols-2 gap-3"}>
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
