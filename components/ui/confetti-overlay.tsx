"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

const PIECES = 24;

export function ConfettiOverlay({ active = false }: { active?: boolean }) {
  const piecesRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => {
      piecesRef.current.forEach((piece) => {
        if (!piece) return;
        piece.style.setProperty("animation", "none");
        void piece.offsetHeight;
        piece.style.removeProperty("animation");
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="h-full w-full">
        {Array.from({ length: PIECES }).map((_, index) => (
          <span
            key={index}
            ref={(node) => {
              if (node) piecesRef.current[index] = node;
            }}
            className={clsx(
              "absolute block h-2 w-2 rounded-sm",
              index % 3 === 0 && "bg-accent-neon",
              index % 3 === 1 && "bg-rose-400",
              index % 3 === 2 && "bg-amber-300",
              `confetti-piece confetti-piece-${index % 6}`,
            )}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.6}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
