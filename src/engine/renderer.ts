// Re-export PosterEngine and helpers for renderer
export * from './posterEngine';
export * from './builtinAssets';
export * from './engineSource';

// Common color and math utilities
export function hexToRgb(h: string): [number, number, number] {
  const clean = h.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

export function mixColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function rgbToCss(c: [number, number, number], alpha?: number): string {
  if (alpha === undefined) {
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
