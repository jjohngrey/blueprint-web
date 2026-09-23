import { PageIntro } from "@/components/layout-primitives";

const groups = [
  {
    title: "General",
    questions: [
      {
        question: "What is BluePrint Tech Week?",
        answer: "A 3-day initiative that brings together people interested in technology across firesides, workshops, office tours, and more.",
      },
      {
        question: "When and where is BluePrint Tech Week?",
        answer: "Thursday to Saturday, January 28 to 30, 2027, in Vancouver, BC, Canada.",
      },
      {
        question: "Who can attend BluePrint Tech Week?",
        answer: "Absolutely anybody interested in tech.",
      },
      {
        question: "What can I expect at BluePrint Tech Week?",
        answer: "Speakers from across the roles and verticals of tech, recruiters from various companies, and the very best experience, including lots of food, brought to you by the BizTech team.",
      },
      {
        question: "How will it be different from previous iterations?",
        answer: "This year will consist of 3 days instead of 1, with office tours on day 2 and premier speakers joining us for an evening on day 1.",
      },
    ],
  },
  {
    title: "Events",
    questions: [
      {
        question: "When can I expect the schedule and events to be released?",
        answer: "Closer to the event date.",
      },
    ],
  },
  {
    title: "Tickets",
    questions: [
      {
        question: "How much does a ticket cost to attend?",
        answer: "We’re aiming to keep it as affordable as possible. You can expect ticket prices between $15 and $30.",
      },
      {
        question: "When will tickets drop?",
        answer: "December 1.",
      },
      {
        question: "What does a ticket comprise of?",
        answer: "Access to all 3 days of events, food, meals, and everything else we have to offer.",
      },
    ],
  },
] as const;

export default function FaqPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-3 py-20">
      <section className="space-y-10">
        <PageIntro eyebrow="Frequently asked questions" title="Questions." />
      </section>
      <section className="space-y-14">
        {groups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="site-eyebrow">{group.title}</h2>
            <dl className="border-t border-black/15">
              {group.questions.map((item) => (
                <div key={item.question} className="grid grid-cols-2 gap-8 border-b border-black/15 py-5 max-sm:grid-cols-1 max-sm:gap-2">
                  <dt className="text-lg font-semibold">{item.question}</dt>
                  <dd className="max-w-xl text-base leading-relaxed tracking-[-0.03em]">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <p className="border-t border-black/15 pt-10 text-lg">
          Other questions?{" "}
          <a className="faq-contact-link site-nav-underline" href="mailto:blueprint@ubcbiztech.com">
            blueprint@ubcbiztech.com
          </a>
        </p>
      </section>
    </main>
  );
}
