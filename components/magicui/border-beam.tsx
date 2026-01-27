"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  duration?: number;
  delay?: number;
}

export function BorderBeam({
  className,
  duration = 3,
  delay = 0,
}: BorderBeamProps) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
          className,
        )}
      >
        {/* Main animated border */}
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            padding: "2px",
            background: `linear-gradient(45deg,
              #ff00ff,
              #00ffff,
              #ffff00,
              #ff00ff,
              #00ffff)`,
            backgroundSize: "300% 300%",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: `borderRotate ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
            filter: "blur(0.5px)",
          }}
        />

        {/* Glowing blur effect */}
        <div
          className="absolute -inset-1 rounded-[inherit] opacity-60 -z-10"
          style={{
            background: `linear-gradient(45deg,
              rgba(255, 0, 255, 0.5),
              rgba(0, 255, 255, 0.5),
              rgba(255, 255, 0, 0.5))`,
            backgroundSize: "300% 300%",
            animation: `borderRotate ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
            filter: "blur(20px)",
          }}
        />

        {/* Lightning bolts */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-0.5 h-full opacity-0"
            style={{
              left: "20%",
              background:
                "linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)",
              animation: `lightning 2s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
          <div
            className="absolute w-0.5 h-full opacity-0"
            style={{
              left: "50%",
              background:
                "linear-gradient(to bottom, transparent, rgba(255, 0, 255, 0.8), transparent)",
              animation: `lightning 2s ease-in-out infinite`,
              animationDelay: `${delay + 0.7}s`,
            }}
          />
          <div
            className="absolute w-0.5 h-full opacity-0"
            style={{
              left: "80%",
              background:
                "linear-gradient(to bottom, transparent, rgba(255, 255, 0, 0.8), transparent)",
              animation: `lightning 2s ease-in-out infinite`,
              animationDelay: `${delay + 1.4}s`,
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes borderRotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes lightning {
          0%,
          100% {
            opacity: 0;
            transform: translateY(-100%);
          }
          5% {
            opacity: 1;
          }
          10% {
            opacity: 0;
            transform: translateY(100%);
          }
        }
      `}</style>
    </>
  );
}
