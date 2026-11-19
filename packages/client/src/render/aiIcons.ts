import type Phaser from 'phaser';

/**
 * Riga's roulette icons, drawn in code: our own simple shapes that call each AI
 * to mind (an orange spark, a green knot, a blue-violet star), not their logos.
 */
export type AiIcon = 'claude' | 'chatgpt' | 'gemini';

const BADGE = { size: 22, fill: 0x0b1026, line: 0xf4f1de } as const;
const SPARK = { color: 0xd97757, rays: 8, outer: 8, width: 2.5 } as const;
const KNOT = { back: 0x10a37f, line: 0xffffff, radius: 9, inner: 5 } as const;
const STAR = { outer: 0x4e8cff, inner: 0xa57bff, size: 9 } as const;

/** Draws `icon` on a dark badge centred at (x, y); `scale` 1 = 22 px. */
export function drawAiIcon(g: Phaser.GameObjects.Graphics, icon: AiIcon, x: number, y: number, scale = 1): void {
  const half = (BADGE.size / 2) * scale;
  g.fillStyle(BADGE.fill, 0.92).fillRoundedRect(x - half, y - half, half * 2, half * 2, 4 * scale);
  g.lineStyle(1.5, BADGE.line, 0.9).strokeRoundedRect(x - half, y - half, half * 2, half * 2, 4 * scale);
  if (icon === 'claude') drawSpark(g, x, y, scale);
  else if (icon === 'chatgpt') drawKnot(g, x, y, scale);
  else drawStar(g, x, y, scale, STAR.outer, STAR.inner);
}

/** Rays round a centre, like an asterisk. Render only: trigonometry is fine here. */
function drawSpark(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
  g.lineStyle(SPARK.width * scale, SPARK.color, 1);
  for (let i = 0; i < SPARK.rays / 2; i++) {
    const angle = (i / SPARK.rays) * Math.PI * 2;
    const dx = Math.cos(angle) * SPARK.outer * scale;
    const dy = Math.sin(angle) * SPARK.outer * scale;
    g.lineBetween(x - dx, y - dy, x + dx, y + dy);
  }
  g.fillStyle(SPARK.color, 1).fillCircle(x, y, 2 * scale);
}

/** A green disc with a white knot: two hexagons, one turned against the other. */
function drawKnot(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
  g.fillStyle(KNOT.back, 1).fillCircle(x, y, KNOT.radius * scale);
  g.lineStyle(1.5 * scale, KNOT.line, 1);
  for (const turn of [0, Math.PI / 6]) {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2 + turn;
      return { x: x + Math.cos(angle) * KNOT.inner * scale, y: y + Math.sin(angle) * KNOT.inner * scale };
    });
    g.strokePoints(points, true);
  }
}

/** A four-pointed star, also the shape of the Gemini shots. */
export function drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, outer: number, inner: number): void {
  const s = STAR.size * scale;
  const t = s * 0.28;
  const star = [
    { x, y: y - s }, { x: x + t, y: y - t }, { x: x + s, y }, { x: x + t, y: y + t },
    { x, y: y + s }, { x: x - t, y: y + t }, { x: x - s, y }, { x: x - t, y: y - t },
  ];
  g.fillStyle(outer, 1).fillPoints(star, true);
  g.fillStyle(inner, 1).fillCircle(x, y, t);
}

/** A white speech bubble with "…" (the ChatGPT shots), centred at (x, y). */
export function drawBubble(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
  g.fillStyle(0xffffff, 1).fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
  g.fillTriangle(x - width / 2 + 3, y + height / 2 - 1, x - width / 2 + 9, y + height / 2 - 1, x - width / 2 + 2, y + height / 2 + 4);
  g.lineStyle(1, 0x2b3a67, 1).strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
  g.fillStyle(0x10a37f, 1);
  for (let i = -1; i <= 1; i++) g.fillCircle(x + i * 4, y, 1.4);
}
