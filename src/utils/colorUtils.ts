export interface HSB {
  h: number;
  s: number;
  b: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hsbToRgb(hsb: HSB): RGB {
  const { h, s, b } = hsb;
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const bri = Math.max(0, Math.min(1, b));

  const c = bri * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = bri - c;

  let r = 0,
    g = 0,
    bl = 0;

  if (hue < 60) {
    r = c;
    g = x;
    bl = 0;
  } else if (hue < 120) {
    r = x;
    g = c;
    bl = 0;
  } else if (hue < 180) {
    r = 0;
    g = c;
    bl = x;
  } else if (hue < 240) {
    r = 0;
    g = x;
    bl = c;
  } else if (hue < 300) {
    r = x;
    g = 0;
    bl = c;
  } else {
    r = c;
    g = 0;
    bl = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((bl + m) * 255),
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hsbToHex(hsb: HSB): string {
  return rgbToHex(hsbToRgb(hsb));
}

export function hsbToRgba(hsb: HSB, alpha = 1): string {
  const { r, g, b } = hsbToRgb(hsb);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToHsb(hex: string): HSB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, b: 0 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const bb = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return { h, s, b: bb };
}
