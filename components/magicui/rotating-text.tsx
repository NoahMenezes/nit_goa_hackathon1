"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface RotatingTextProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}

export function RotatingText({
  text,
  className,
  duration = 0.5,
  delay = 0.03,
}: RotatingTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={cn("inline-block", className)}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            animation: isVisible
              ? `rotateIn ${duration}s ease-out ${index * delay}s both`
              : "none",
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes rotateIn {
          0% {
            opacity: 0;
            transform: rotateY(-90deg) translateY(-20px);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg) translateY(0px);
          }
        }
      `}</style>
    </span>
  );
}
