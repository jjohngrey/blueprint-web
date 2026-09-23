"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const initialTime: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function getTimeLeft(targetDate: string): TimeLeft {
  const totalSeconds = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1_000));

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function AnimatedCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(targetDate));
    update();
    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="countdown" aria-label="Countdown to BluePrint Tech Week">
      {(Object.entries(timeLeft) as [keyof TimeLeft, number][]).map(([unit, value]) => (
        <div className="countdown-unit" key={unit}>
          <span className="countdown-number">{String(value).padStart(2, "0")}</span>
          <span className="countdown-label">{unit}</span>
        </div>
      ))}
    </div>
  );
}
