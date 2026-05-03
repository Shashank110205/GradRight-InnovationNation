"use client";

import { useEffect, useState } from "react";

export function CountUp({
  to,
  duration = 1200,
}: {
  to: number;
  duration?: number;
}) {
  const [v, setV] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setV(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <span className="tabular-nums">{v}</span>;
}
