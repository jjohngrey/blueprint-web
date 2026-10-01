import { AnimatedCountdown } from "@/components/ui/animated-countdown";
import { StoryScroll } from "@/components/story-scroll";
import { ImpactSection } from "@/components/impact-section-v2";
import { AsciiHandBackground } from "@/components/ascii-hand-background";
import { SubscriberForm } from "@/components/subscriber-form";

export default function Home() {
  return (
    <main className="relative isolate mx-auto flex w-full max-w-7xl flex-col gap-16 px-3 pb-26 pt-20">
      <AsciiHandBackground />
      <section data-hero-section className="relative z-10 flex flex-col items-center gap-10 pt-20">
        <div className="relative z-10 max-w-3xl space-y-3 text-center">
          <h3 className="site-eyebrow">UBC BIZTECH PRESENTS</h3>
          <h1 className="site-display-title">BluePrint <span className="text-[var(--highlight-color)] italic tracking-[-0.1em]">Tech Week</span></h1>
          <h2 className="site-hero-subtitle text-balance">
            <span className="relative inline-block">
              Western Canada&apos;s
              <svg
                aria-hidden="true"
                viewBox="0 0 240 12"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible text-[var(--highlight-color)]"
              >
                <defs>
                  <filter id="felt-marker" x="-5%" y="-40%" width="110%" height="180%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="texture" />
                    <feDisplacementMap in="SourceGraphic" in2="texture" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
                <path
                  d="M3 9 L237 3"
                  fill="none"
                  filter="url(#felt-marker)"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="5"
                  opacity="0.9"
                />
              </svg>
            </span>{" "}
            largest tech-conference.
          </h2>
        </div>
        <div className="relative z-10 flex w-full flex-col items-center gap-10">
          <AnimatedCountdown targetDate="2027-01-28T00:00:00-07:00" />
          <SubscriberForm />

          <div className="flex w-full flex-col items-center gap-4">
            <div className="w-full p-2">
              <video
                src="/hero.mp4"
                aria-label="BluePrint Tech Week demo video"
                autoPlay
                loop
                muted
                playsInline
                className="block w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <StoryScroll />
      </div>

      <div className="relative z-10">
        <ImpactSection />
      </div>
    </main>
  );
}
