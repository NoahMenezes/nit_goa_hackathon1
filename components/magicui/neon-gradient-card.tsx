"use client";

import { cn } from "@/lib/utils";
import React, { CSSProperties, ReactNode, useEffect, useRef } from "react";

interface NeonGradientCardProps {
  className?: string;
  children?: ReactNode;
  borderSize?: number;
  borderRadius?: number;
  neonColors?: {
    firstColor: string;
    secondColor: string;
  };
}

export function NeonGradientCard({
  className,
  children,
  borderSize = 2,
  borderRadius = 20,
  neonColors = {
    firstColor: "#ff2975",
    secondColor: "#00FFF1",
  },
}: NeonGradientCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateGradient = (e: MouseEvent) => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      container.style.setProperty("--pointer-x", `${x}px`);
      container.style.setProperty("--pointer-y", `${y}px`);
    };

    container.addEventListener("mousemove", updateGradient);

    return () => {
      container.removeEventListener("mousemove", updateGradient);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-(--border-radius) p-(--border-size) transition-all duration-300 ease-out cursor-pointer",
        className,
      )}
      style={
        {
          "--border-size": `${borderSize}px`,
          "--border-radius": `${borderRadius}px`,
          "--neon-first-color": neonColors.firstColor,
          "--neon-second-color": neonColors.secondColor,
          "--pointer-x": "50%",
          "--pointer-y": "50%",
        } as CSSProperties
      }
    >
      {/* Animated gradient border */}
      <div
        className="pointer-events-none absolute inset-0 z-1 opacity-100"
        style={{
          background: `
            radial-gradient(
              600px circle at var(--pointer-x) var(--pointer-y),
              var(--neon-first-color),
              transparent 40%
            )
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-1 opacity-100"
        style={{
          background: `
            radial-gradient(
              800px circle at var(--pointer-x) var(--pointer-y),
              var(--neon-second-color),
              transparent 40%
            )
          `,
        }}
      />

      {/* Rotating gradient effect */}
      <div
        className="absolute inset-0 z-0 animate-spin-slow opacity-80"
        style={{
          background: `
            conic-gradient(
              from 0deg,
              var(--neon-first-color),
              var(--neon-second-color),
              var(--neon-first-color)
            )
          `,
          animationDuration: "4s",
          filter: "blur(40px)",
        }}
      />

      {/* Card content with white background in light mode, black in dark mode */}
      <div
        className="relative z-2 flex h-full w-full flex-col rounded-[calc(var(--border-radius)-var(--border-size))] bg-white dark:bg-black text-black dark:text-white p-6"
        style={{
          borderRadius: `calc(${borderRadius}px - ${borderSize}px)`,
        }}
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
