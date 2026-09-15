/** Small colour helpers for the theme; hex in, hex or rgba out. */

export function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex) ?? [0, 0, 0];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const rgb = parseHex(hex) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Linear mix toward another colour: `mix(green, '#FFFFFF', 0.22)` lifts it for dark mode. */
export function mix(hex: string, towards: string, amount: number): string {
  const a = parseHex(hex) ?? [0, 0, 0];
  const b = parseHex(towards) ?? [255, 255, 255];
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * amount);
  return `#${[channel(0), channel(1), channel(2)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
