"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#34D399", "#FBBF24", "#3B82F6"];

function buildPieces(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: -40 - Math.random() * 80,
    rot: (Math.random() - 0.5) * 720,
    delay: Math.random() * 0.12,
    color: COLORS[i % COLORS.length]!,
    w: 4 + Math.random() * 4,
    h: 6 + Math.random() * 8,
  }));
}

export function ConfettiBurst({ count = 40 }: { count?: number }) {
  const [pieces] = useState(() => buildPieces(count));

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: p.y,
            rotate: p.rot,
            scale: 0.4,
          }}
          transition={{
            duration: 1.35,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute left-1/2 top-1/2 rounded-[2px]"
          style={{
            marginLeft: -p.w / 2,
            marginTop: -p.h / 2,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
