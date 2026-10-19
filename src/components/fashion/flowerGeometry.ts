export interface Point {
  x: number;
  y: number;
}

export interface WordSprite {
  text: string;
  x: number;
  y: number;
  angle: number;
  size: number;
  alpha: number;
  hue: number;
  light: number;
  phase: number;
  /** 0..1 moment (as fraction of the grow-in timeline) this word starts fading in. */
  reveal: number;
}

interface Part {
  /** Cubic bezier spine [p0, p1, p2, p3]. Stems run bottom -> top so they "grow" upward. */
  spine: [Point, Point, Point, Point];
  /** Max half-width of the band words are scattered across, in design units. */
  halfWidth: number;
  /** Words per design unit of spine length. */
  density: number;
  /** How the band thickness varies along the spine. */
  profile: "stem" | "petal";
  /** Reveal timeline offset (0..1) for t = 0 on this part. */
  delay: number;
  /** Reveal timeline span (0..1) covered between t = 0 and t = 1. */
  span: number;
  /** Min / max font size in design units. */
  size: [number, number];
}

/** Everything is authored in a 1000 x 1400 box; the canvas scales it to fit. */
export const DESIGN_WIDTH = 1000;
export const DESIGN_HEIGHT = 1400;

/**
 * The silhouette: tweak these curves to reshape the flower.
 * Points are [start, control1, control2, end].
 */
const PARTS: Part[] = [
  {
    spine: [
      { x: 320, y: 1430 },
      { x: 400, y: 1000 },
      { x: 440, y: 740 },
      { x: 520, y: 520 },
    ],
    halfWidth: 16,
    density: 0.035,
    profile: "stem",
    delay: 0,
    span: 0.45,
    size: [16, 21],
  },
  {
    spine: [
      { x: 400, y: 1430 },
      { x: 520, y: 1160 },
      { x: 640, y: 1000 },
      { x: 710, y: 850 },
    ],
    halfWidth: 16,
    density: 0.035,
    profile: "stem",
    delay: 0.05,
    span: 0.4,
    size: [16, 21],
  },
  {
    spine: [
      { x: 710, y: 850 },
      { x: 700, y: 760 },
      { x: 660, y: 660 },
      { x: 640, y: 540 },
    ],
    halfWidth: 12,
    density: 0.045,
    profile: "stem",
    delay: 0.35,
    span: 0.15,
    size: [15, 19],
  },
  {
    spine: [
      { x: 540, y: 540 },
      { x: 580, y: 420 },
      { x: 640, y: 300 },
      { x: 600, y: 140 },
    ],
    halfWidth: 74,
    density: 0.14,
    profile: "petal",
    delay: 0.5,
    span: 0.3,
    size: [15, 22],
  },
  {
    spine: [
      { x: 480, y: 520 },
      { x: 570, y: 500 },
      { x: 680, y: 450 },
      { x: 800, y: 400 },
    ],
    halfWidth: 92,
    density: 0.2,
    profile: "petal",
    delay: 0.55,
    span: 0.3,
    size: [15, 22],
  },
  {
    spine: [
      { x: 470, y: 380 },
      { x: 380, y: 360 },
      { x: 270, y: 340 },
      { x: 170, y: 335 },
    ],
    halfWidth: 52,
    density: 0.14,
    profile: "petal",
    delay: 0.6,
    span: 0.25,
    size: [15, 20],
  },
  {
    spine: [
      { x: 640, y: 380 },
      { x: 720, y: 340 },
      { x: 790, y: 300 },
      { x: 840, y: 290 },
    ],
    halfWidth: 40,
    density: 0.12,
    profile: "petal",
    delay: 0.65,
    span: 0.2,
    size: [15, 20],
  },
];

export const WORDS = [
  "Linen shirts",
  "Slow mornings",
  "Worn-in denim",
  "Thrifted finds",
  "Soft knits",
  "Everyday uniform",
  "Tailored hems",
  "Favorite cardigan",
  "Layering up",
  "Sunday outfit",
  "Vintage buttons",
  "Wool coats",
  "Silk scarves",
  "Good fit",
  "Dressing for the day",
  "Leather loafers",
  "Texture over trend",
  "Mending a seam",
  "Neutral palette",
  "Quiet details",
  "Cotton tote",
  "Well-loved",
  "Fresh pressed",
  "Pocket squares",
  "Ease",
];

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bezier(p: Part["spine"], t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
  };
}

function bezierTangent(p: Part["spine"], t: number): Point {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const c = 3 * t * t;
  return {
    x: a * (p[1].x - p[0].x) + b * (p[2].x - p[1].x) + c * (p[3].x - p[2].x),
    y: a * (p[1].y - p[0].y) + b * (p[2].y - p[1].y) + c * (p[3].y - p[2].y),
  };
}

function approxLength(p: Part["spine"]) {
  let len = 0;
  let prev = bezier(p, 0);
  for (let i = 1; i <= 24; i++) {
    const cur = bezier(p, i / 24);
    len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    prev = cur;
  }
  return len;
}

/** Deterministically scatters words along every part of the silhouette. */
export function buildSprites(seed = 7): WordSprite[] {
  const rand = mulberry32(seed);
  const sprites: WordSprite[] = [];

  for (const part of PARTS) {
    const count = Math.round(approxLength(part.spine) * part.density);

    for (let i = 0; i < count; i++) {
      const t = (i + rand() * 0.9) / count;
      const center = bezier(part.spine, t);
      const tangent = bezierTangent(part.spine, t);
      const len = Math.hypot(tangent.x, tangent.y) || 1;
      const nx = -tangent.y / len;
      const ny = tangent.x / len;

      const envelope =
        part.profile === "petal" ? Math.pow(Math.sin(Math.PI * t), 0.7) : 1;
      const offset = (rand() * 2 - 1) * part.halfWidth * envelope;

      let angle = Math.atan2(tangent.y, tangent.x);
      angle += (rand() - 0.5) * (part.profile === "petal" ? 0.7 : 0.18);
      if (Math.cos(angle) < 0) angle += Math.PI;

      sprites.push({
        text: WORDS[Math.floor(rand() * WORDS.length)],
        x: center.x + nx * offset + (rand() - 0.5) * 6,
        y: center.y + ny * offset + (rand() - 0.5) * 6,
        angle,
        size: part.size[0] + rand() * (part.size[1] - part.size[0]),
        alpha: 0.5 + rand() * 0.45,
        hue: 62 + rand() * 18,
        light: 74 + rand() * 12,
        phase: rand() * Math.PI * 2,
        reveal: Math.min(0.98, part.delay + t * part.span + rand() * 0.06),
      });
    }
  }

  return sprites;
}
