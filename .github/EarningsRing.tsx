"use client";

import { formatRupees } from "@/lib/i18n";

interface EarningsRingProps {
  earnedPaise: number;      // direct earnings so far today
  topupPaise: number;       // welfare top-up credited/eligible so far
  targetPaise: number;      // state minimum wage target for the day
  size?: number;
}

/**
 * Signature element: a diya (oil lamp) ring that fills like oil rising
 * toward the wick as the worker earns. The direct-earning arc fills in
 * turmeric gold; once earnings alone don't reach the state minimum, a
 * second, visibly distinct gold-white arc shows the welfare top-up
 * completing the flame — so a worker can see at a glance whether
 * today's income is coming from customers or from the safety net,
 * without reading numbers.
 */
export default function EarningsRing({
  earnedPaise,
  topupPaise,
  targetPaise,
  size = 220,
}: EarningsRingProps) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const safeTarget = Math.max(targetPaise, 1);

  const earnedFraction = Math.min(earnedPaise / safeTarget, 1);
  const topupFraction = Math.min((earnedPaise + topupPaise) / safeTarget, 1) - earnedFraction;

  const earnedLength = circumference * earnedFraction;
  const topupLength = circumference * Math.max(topupFraction, 0);
  const center = size / 2;

  const reachedTarget = earnedPaise + topupPaise >= targetPaise;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E8DFC9"
          strokeWidth={14}
        />
        {/* direct earnings arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E8A83C"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${earnedLength} ${circumference - earnedLength}`}
          className="transition-all duration-700 ease-out"
        />
        {/* welfare top-up arc, offset to start where earnings left off */}
        {topupLength > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F2C14E"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${topupLength} ${circumference - topupLength}`}
            strokeDashoffset={-earnedLength}
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* flame glyph at the wick position, lit once target is reached */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <span className="text-2xl" aria-hidden>
          {reachedTarget ? "🪔" : "🪔"}
        </span>
        <span className="font-tabular text-2xl font-extrabold text-indigo mt-1">
          {formatRupees(earnedPaise + topupPaise)}
        </span>
        <span className="font-tabular text-xs text-ink/60">
          {formatRupees(targetPaise)} target
        </span>
      </div>
    </div>
  );
}
