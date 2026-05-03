"use client";

import { useEffect, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function CountUp({
  to,
  duration = 1.35,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const durMs = duration * 1000;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durMs);
      setN(Math.round(from + (to - from) * easeOutCubic(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <span className={className}>{n}</span>;
}
