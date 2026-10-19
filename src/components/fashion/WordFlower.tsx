import React, { useEffect, useRef } from "react";
import styles from "./WordFlower.module.css";
import {
  buildSprites,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  WordSprite,
} from "./flowerGeometry";

/** Seconds for the whole flower to finish fading in. */
const GROW_DURATION = 5;
/** Seconds each individual word takes to fade in. */
const WORD_FADE = 0.9;
/** Peak horizontal sway of the flower head, in design units. */
const SWAY_AMPLITUDE = 14;
/** Seconds per full sway cycle. */
const SWAY_PERIOD = 7;
/** Per-word wobble in design units, on top of the sway. */
const WOBBLE = 1.6;
/** How far the design may overflow the viewport (>1 crops the stem bottoms). */
const FIT_HEIGHT = 1.02;
const FIT_WIDTH = 1.15;
/** Font size multiplier bounds, so words stay legible on small screens. */
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.25;

const WORD_FONT = '"Cormorant Garamond", "Times New Roman", Georgia, serif';

const WordFlower: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sprites: WordSprite[] = buildSprites();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;
    let raf = 0;
    let start = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = (elapsed: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const scale = Math.min(
        (width * FIT_WIDTH) / DESIGN_WIDTH,
        (height * FIT_HEIGHT) / DESIGN_HEIGHT,
      );
      const fontScale = Math.min(
        MAX_FONT_SCALE,
        Math.max(MIN_FONT_SCALE, scale),
      );
      const originX = (width - DESIGN_WIDTH * scale) / 2;
      const originY = height - DESIGN_HEIGHT * scale * 0.97;
      const sway = reduced
        ? 0
        : Math.sin((elapsed / SWAY_PERIOD) * Math.PI * 2) * SWAY_AMPLITUDE;
      const progress = reduced ? 2 : elapsed / GROW_DURATION;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const s of sprites) {
        const fade = Math.min(
          1,
          Math.max(0, (progress - s.reveal) / (WORD_FADE / GROW_DURATION)),
        );
        if (fade <= 0) continue;

        // Words near the top of the design move more, like a real stem.
        const lift = Math.pow(Math.max(0, 1 - s.y / DESIGN_HEIGHT), 1.6);
        const wobble = reduced
          ? 0
          : Math.sin(elapsed * 1.3 + s.phase) * WOBBLE * lift;
        const dx = sway * lift + wobble;

        ctx.save();
        ctx.translate(originX + (s.x + dx) * scale, originY + s.y * scale);
        ctx.rotate(s.angle + (dx / 400) * (s.y < 700 ? 1 : 0.5));
        ctx.globalAlpha = s.alpha * fade;
        ctx.fillStyle = `hsl(${s.hue} 68% ${s.light}%)`;
        ctx.font = `${s.size * fontScale}px ${WORD_FONT}`;
        ctx.fillText(s.text, 0, 0);
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      if (!start) start = now;
      draw((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      resize();
      if (reduced) {
        draw(0);
      } else {
        start = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      run();
    };

    run();
    window.addEventListener("resize", onResize);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
};

export default WordFlower;
