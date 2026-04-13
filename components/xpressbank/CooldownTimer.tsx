"use client";

import { useState, useEffect } from "react";

interface Props {
  initialSeconds?: number;
  onComplete: () => void;
}

export default function CooldownTimer({ initialSeconds = 30, onComplete }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const size = 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const progress = (seconds / initialSeconds) * circ;

  useEffect(() => {
    if (seconds <= 0) { onComplete(); return; }
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds, onComplete]);

  const stroke = seconds > 10 ? "#ef4444" : "#f97316";

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={8}
        strokeDasharray={`${progress} ${circ}`}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.9s linear" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={stroke} fontSize="22" fontWeight="bold">
        {seconds}
      </text>
    </svg>
  );
}
