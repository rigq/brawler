/** Axis-aligned rectangle. (x, y) is the top-left corner; y grows downwards. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** True if the rectangles share some area. Touching edges do not count. */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
