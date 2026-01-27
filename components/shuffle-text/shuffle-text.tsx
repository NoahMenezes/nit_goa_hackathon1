"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ShuffleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: "left" | "right";
  duration?: number;
  ease?: string;
  threshold?: number;
  shuffleTimes?: number;
  animationMode?: "evenodd" | "random";
  stagger?: number;
  triggerOnce?: boolean;
  triggerOnHover?: boolean;
  respectReducedMotion?: boolean;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  textAlign?: "left" | "center" | "right";
  onShuffleComplete?: () => void;
}

export function ShuffleText({
  text,
  className = "",
  style = {},
  shuffleDirection = "right",
  duration = 1.2,
  ease = "power3.out",
  threshold = 0.1,
  shuffleTimes = 2,
  animationMode = "evenodd",
  stagger = 0.05,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
  tag = "h1",
  textAlign = "center",
  onShuffleComplete,
}: ShuffleProps) {
  const ref = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      return document.fonts.status === "loaded";
    }
    return true;
  });
  const [ready, setReady] = useState(false);

  const wrappersRef = useRef<HTMLElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const playingRef = useRef(false);
  const hoverHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      "fonts" in document &&
      document.fonts.status !== "loaded"
    ) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (
        respectReducedMotion &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setReady(true);
        onShuffleComplete?.();
        return;
      }

      const el = ref.current;
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

      const removeHover = () => {
        if (hoverHandlerRef.current && ref.current) {
          ref.current.removeEventListener(
            "mouseenter",
            hoverHandlerRef.current,
          );
          hoverHandlerRef.current = null;
        }
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current.forEach((wrap) => {
            const inner = wrap.firstElementChild as HTMLElement;
            const orig = inner?.querySelector('[data-orig="1"]') as HTMLElement;
            if (orig && wrap.parentNode) {
              wrap.parentNode.replaceChild(orig, wrap);
            }
          });
          wrappersRef.current = [];
        }
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        const chars = text.split("");
        wrappersRef.current = [];

        el.innerHTML = "";

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = (set: string) =>
          set.charAt(Math.floor(Math.random() * set.length)) || "";

        chars.forEach((ch) => {
          const tempSpan = document.createElement("span");
          tempSpan.textContent = ch;
          tempSpan.style.cssText =
            "display:inline-block;visibility:hidden;position:absolute;";
          el.appendChild(tempSpan);
          const w = tempSpan.getBoundingClientRect().width || 10;
          el.removeChild(tempSpan);

          const wrap = document.createElement("span");
          Object.assign(wrap.style, {
            display: "inline-block",
            overflow: "hidden",
            width: w + "px",
            verticalAlign: "baseline",
          });

          const inner = document.createElement("span");
          Object.assign(inner.style, {
            display: "inline-block",
            whiteSpace: "nowrap",
            willChange: "transform",
          });

          el.appendChild(wrap);
          wrap.appendChild(inner);

          const firstOrig = document.createElement("span");
          firstOrig.textContent = ch;
          Object.assign(firstOrig.style, {
            display: "inline-block",
            width: w + "px",
            textAlign: "center",
          });

          const realChar = document.createElement("span");
          realChar.textContent = ch;
          realChar.setAttribute("data-orig", "1");
          Object.assign(realChar.style, {
            display: "inline-block",
            width: w + "px",
            textAlign: "center",
          });

          inner.appendChild(firstOrig);
          for (let k = 0; k < rolls; k++) {
            const c = document.createElement("span");
            c.textContent = ch === " " ? " " : rand(charset);
            Object.assign(c.style, {
              display: "inline-block",
              width: w + "px",
              textAlign: "center",
            });
            inner.appendChild(c);
          }
          inner.appendChild(realChar);

          const steps = rolls + 1;
          let startX = 0;
          let finalX = -steps * w;

          if (shuffleDirection === "right") {
            const firstCopy = inner.firstElementChild;
            const real = inner.lastElementChild;
            if (real) inner.insertBefore(real, inner.firstChild);
            if (firstCopy) inner.appendChild(firstCopy);
            startX = -steps * w;
            finalX = 0;
          }

          gsap.set(inner, { x: startX, force3D: true });
          inner.setAttribute("data-final-x", String(finalX));
          inner.setAttribute("data-start-x", String(startX));

          wrappersRef.current.push(wrap);
        });
      };

      const inners = () =>
        wrappersRef.current.map((w) => w.firstElementChild).filter(Boolean);

      const cleanupToStill = () => {
        wrappersRef.current.forEach((w) => {
          const strip = w.firstElementChild as HTMLElement;
          if (!strip) return;
          const real = strip.querySelector('[data-orig="1"]');
          if (!real) return;
          strip.replaceChildren(real);
          strip.style.transform = "none";
          strip.style.willChange = "auto";
        });
      };

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;

        const tl = gsap.timeline({
          smoothChildTiming: true,
          onComplete: () => {
            playingRef.current = false;
            cleanupToStill();
            onShuffleComplete?.();
            armHover();
          },
        });

        if (animationMode === "evenodd") {
          const odd = strips.filter((_, i) => i % 2 === 1);
          const even = strips.filter((_, i) => i % 2 === 0);
          const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
          const evenStart = odd.length ? oddTotal * 0.7 : 0;

          if (odd.length) {
            tl.to(
              odd,
              {
                x: (i, t) =>
                  parseFloat(
                    (t as HTMLElement).getAttribute("data-final-x") || "0",
                  ),
                duration,
                ease,
                force3D: true,
                stagger,
              },
              0,
            );
          }
          if (even.length) {
            tl.to(
              even,
              {
                x: (i, t) =>
                  parseFloat(
                    (t as HTMLElement).getAttribute("data-final-x") || "0",
                  ),
                duration,
                ease,
                force3D: true,
                stagger,
              },
              evenStart,
            );
          }
        } else {
          tl.to(strips, {
            x: (i, t) =>
              parseFloat(
                (t as HTMLElement).getAttribute("data-final-x") || "0",
              ),
            duration,
            ease,
            force3D: true,
            stagger,
          });
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          build();
          play();
        };
        hoverHandlerRef.current = handler;
        ref.current.addEventListener("mouseenter", handler);
      };

      const create = () => {
        build();
        play();
        setReady(true);
      };

      const startPct = (1 - threshold) * 100;
      const start = `top ${startPct}%`;

      const st = ScrollTrigger.create({
        trigger: el,
        start,
        once: triggerOnce,
        onEnter: create,
      });

      return () => {
        st.kill();
        removeHover();
        teardown();
        setReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        ease,
        threshold,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        stagger,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
      ],
      scope: ref,
    },
  );
  const commonStyle: React.CSSProperties = {
    textAlign,
    display: "inline-block",
    whiteSpace: "normal",
    wordWrap: "break-word",
    visibility: ready ? "visible" : "hidden",
    ...style,
  };

  const classes = `shuffle-parent ${ready ? "is-ready" : ""} ${className}`;

  if (tag === "h1")
    return (
      <h1
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "h2")
    return (
      <h2
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "h3")
    return (
      <h3
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "h4")
    return (
      <h4
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "h5")
    return (
      <h5
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "h6")
    return (
      <h6
        ref={ref as React.RefObject<HTMLHeadingElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "p")
    return (
      <p
        ref={ref as React.RefObject<HTMLParagraphElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "span")
    return (
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className={classes}
        style={commonStyle}
      />
    );
  if (tag === "div")
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={classes}
        style={commonStyle}
      />
    );

  return (
    <h1
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={classes}
      style={commonStyle}
    />
  );
}
