import { useEffect, useState } from "react";

const COLORS = ["hsl(262 83% 63%)", "hsl(340 82% 63%)", "hsl(24 95% 63%)", "hsl(150 80% 55%)", "hsl(190 90% 60%)"];

interface Props {
  fire: boolean;
  onDone?: () => void;
}

/** Lightweight CSS confetti burst — no dependency, no layout impact. */
export function Confetti({ fire, onDone }: Props) {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (!fire) return;
    setPieces(Array.from({ length: 40 }, (_, i) => i));
    const t = setTimeout(() => {
      setPieces([]);
      onDone?.();
    }, 1600);
    return () => clearTimeout(t);
  }, [fire, onDone]);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.25;
        const duration = 1 + Math.random() * 0.6;
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute top-[-10px] rounded-[2px] animate-fabuos-confetti"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
