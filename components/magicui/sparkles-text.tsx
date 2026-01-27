"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  children: React.ReactNode;
  className?: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

const DEFAULT_COLORS = {
  first: "#9E7AFF",
  second: "#FE8BBB",
};

const SparkleIcon: React.FC<{
  color: string;
  delay: number;
  scale: number;
}> = ({ color, delay, scale }) => {
  return (
    <motion.svg
      className="pointer-events-none absolute"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 1, 0],
        scale: [0, scale, scale * 1.2, scale, 0],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
        repeatDelay: 0,
      }}
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 13.3991 5.46315 14.7034 6.34721L16.3277 7.43762C16.9008 7.79169 16.9008 8.60431 16.3277 8.95838L14.7034 10.0488C13.3991 10.9329 12.4006 12.2037 11.8618 13.6758L11.1746 15.5522C10.9446 16.1808 10.0553 16.1808 9.82531 15.5522L9.13812 13.6758C8.59931 12.2037 7.60082 10.9329 6.29653 10.0488L4.67219 8.95838C4.09913 8.60431 4.09913 7.79169 4.67219 7.43762L6.29653 6.34721C7.60082 5.46315 8.59931 4.19229 9.13812 2.72026L9.82531 0.843845Z"
        fill={color}
      />
    </motion.svg>
  );
};

export function SparklesText({
  children,
  className,
  sparklesCount = 10,
  colors = DEFAULT_COLORS,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = React.useState<Sparkle[]>([]);

  React.useEffect(() => {
    const generateSparkles = (): Sparkle[] => {
      return Array.from({ length: sparklesCount }, (_, i) => ({
        id: `sparkle-${i}-${Date.now()}`,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        color: i % 2 === 0 ? colors.first : colors.second,
        delay: Math.random() * 2.5,
        scale: 0.5 + Math.random() * 0.8,
        lifespan: 2.5,
      }));
    };

    setSparkles(generateSparkles());
  }, [sparklesCount, colors.first, colors.second]);

  return (
    <div
      className={cn("relative inline-block", className)}
      style={
        {
          "--sparkles-first-color": colors.first,
          "--sparkles-second-color": colors.second,
        } as CSSProperties
      }
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 overflow-hidden">
        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="absolute"
            style={{
              left: sparkle.x,
              top: sparkle.y,
            }}
          >
            <SparkleIcon
              color={sparkle.color}
              delay={sparkle.delay}
              scale={sparkle.scale}
            />
          </span>
        ))}
      </span>
    </div>
  );
}
