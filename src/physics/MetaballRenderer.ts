import type { Particle } from "./ParticleSystem";
import { hsbToRgb, hsbToRgba, type HSB } from "@/utils/colorUtils";

export class MetaballRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private scale: number = 0.5;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = Math.floor(width * this.scale);
    this.offscreenCanvas.height = Math.floor(height * this.scale);
    const ctx = this.offscreenCanvas.getContext("2d");
    if (!ctx) throw new Error("无法创建 Canvas 上下文");
    this.offscreenCtx = ctx;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.offscreenCanvas.width = Math.floor(width * this.scale);
    this.offscreenCanvas.height = Math.floor(height * this.scale);
  }

  render(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    waxColor: HSB,
    heatPower: number,
  ) {
    const offW = this.offscreenCanvas.width;
    const offH = this.offscreenCanvas.height;
    const ox = this.offscreenCtx;

    ox.clearRect(0, 0, offW, offH);

    ox.globalCompositeOperation = "source-over";
    const bgGrad = ox.createLinearGradient(0, 0, 0, offH);
    bgGrad.addColorStop(0, "rgba(10, 14, 28, 0.95)");
    bgGrad.addColorStop(0.5, "rgba(8, 10, 22, 0.98)");
    bgGrad.addColorStop(1, "rgba(14, 10, 18, 0.98)");
    ox.fillStyle = bgGrad;
    ox.fillRect(0, 0, offW, offH);

    const heatGlowIntensity = heatPower / 100;
    const heatGrad = ox.createRadialGradient(
      offW / 2,
      offH * 1.05,
      0,
      offW / 2,
      offH * 1.05,
      offH * 0.6,
    );
    heatGrad.addColorStop(0, `rgba(255, 120, 50, ${0.35 * heatGlowIntensity})`);
    heatGrad.addColorStop(0.5, `rgba(255, 80, 30, ${0.15 * heatGlowIntensity})`);
    heatGrad.addColorStop(1, "rgba(255, 60, 20, 0)");
    ox.fillStyle = heatGrad;
    ox.fillRect(0, 0, offW, offH);

    const coolGrad = ox.createRadialGradient(
      offW / 2,
      -offH * 0.1,
      0,
      offW / 2,
      -offH * 0.1,
      offH * 0.5,
    );
    coolGrad.addColorStop(0, "rgba(79, 195, 247, 0.08)");
    coolGrad.addColorStop(1, "rgba(79, 195, 247, 0)");
    ox.fillStyle = coolGrad;
    ox.fillRect(0, 0, offW, offH);

    ox.globalCompositeOperation = "lighter";
    for (const p of particles) {
      const px = p.x * this.scale;
      const py = p.y * this.scale;
      const r = p.radius * this.scale * 1.8;

      const tempTint = p.temperature;
      const particleColor = {
        h: waxColor.h + (tempTint - 0.5) * 15,
        s: Math.min(1, waxColor.s + tempTint * 0.1),
        b: Math.min(1, waxColor.b + tempTint * 0.15),
      };
      const rgb = hsbToRgb(particleColor);

      const grad = ox.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      grad.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ox.fillStyle = grad;
      ox.beginPath();
      ox.arc(px, py, r, 0, Math.PI * 2);
      ox.fill();
    }
    ox.globalCompositeOperation = "source-over";

    const imageData = ox.getImageData(0, 0, offW, offH);
    const data = imageData.data;
    const threshold = 140;

    const waxRgb = hsbToRgb(waxColor);
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

      if (brightness > threshold) {
        const t = Math.min(1, (brightness - threshold) / (255 - threshold));
        const highlight = t * t;

        data[i] = Math.min(255, waxRgb.r + highlight * 80);
        data[i + 1] = Math.min(255, waxRgb.g + highlight * 70);
        data[i + 2] = Math.min(255, waxRgb.b + highlight * 50);
        data[i + 3] = 255;
      } else if (brightness > threshold * 0.5) {
        const edgeT = (brightness - threshold * 0.5) / (threshold * 0.5);
        const smoothT = edgeT * edgeT * (3 - 2 * edgeT);
        data[i] = waxRgb.r * smoothT * 0.9;
        data[i + 1] = waxRgb.g * smoothT * 0.9;
        data[i + 2] = waxRgb.b * smoothT * 0.9;
        data[i + 3] = Math.floor(255 * smoothT);
      }
    }
    ox.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);

    this.drawGlow(ctx, particles, waxColor);
    this.drawGlassReflection(ctx);
  }

  private drawGlow(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    waxColor: HSB,
  ) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const p of particles) {
      if (p.temperature < 0.5) continue;
      const glowAlpha = (p.temperature - 0.5) * 0.5;
      const glowR = p.radius * 3;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      grad.addColorStop(0, hsbToRgba(waxColor, glowAlpha * 0.4));
      grad.addColorStop(1, hsbToRgba(waxColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGlassReflection(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const w = this.width;
    const h = this.height;

    const lrGrad = ctx.createLinearGradient(0, 0, w, 0);
    lrGrad.addColorStop(0, "rgba(255,255,255,0.12)");
    lrGrad.addColorStop(0.08, "rgba(255,255,255,0.03)");
    lrGrad.addColorStop(0.92, "rgba(255,255,255,0.02)");
    lrGrad.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = lrGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    const hiGrad = ctx.createLinearGradient(w * 0.1, 0, w * 0.25, h);
    hiGrad.addColorStop(0, "rgba(255,255,255,0.15)");
    hiGrad.addColorStop(0.5, "rgba(255,255,255,0.06)");
    hiGrad.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = hiGrad;
    ctx.fillRect(w * 0.1, h * 0.05, w * 0.08, h * 0.9);
    ctx.restore();
  }
}
