"use client";

import { cn } from "@/lib/utils";

interface RetroGridProps {
  className?: string;
  angle?: number;
}

export function RetroGrid({ className, angle = 65 }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-70 perspective-[300px]",
        className,
      )}
      style={{ "--grid-angle": `${angle}deg` } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="absolute inset-0 transform-[rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "absolute inset-0 bg-repeat bg-size-[70px_70px] h-[400vh] ml-[-50%] origin-[100%_0_0] w-[800vw]",
            // Light styles
            "bg-[linear-gradient(to_right,rgba(0,0,0,0.5)_1.5px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.5)_1.5px,transparent_0)]",
            // Dark styles
            "dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1.5px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1.5px,transparent_0)]",
          )}
        />
      </div>

      {/* Gradient overlay for fade effect */}
      <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent dark:from-black" />

      <style jsx>{`
        @keyframes grid {
          0% {
            transform: translateY(0) translateZ(0); /* ADDED translateZ(0) */
          }
          100% {
            transform: translateY(calc(-50% + 70px)) translateZ(0); /* ADDED translateZ(0) */
          }
        }

        .animate-grid {
          /* CHANGED ease-in-out to linear */
          animation: grid 100s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
