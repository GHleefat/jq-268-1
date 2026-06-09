import type { Particle } from "./ParticleSystem";
import { getPhase } from "./ParticleSystem";
import { hsbToRgb, hsbToRgba, type HSB } from "@/utils/colorUtils";

export class MetaballRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private glowCanvas: HTMLCanvasElement;
  private glowCtx: CanvasRenderingContext2D;
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

    this.glowCanvas = document.createElement("canvas");
    this.glowCanvas.width = Math.floor(width * this.scale);
    this.glowCanvas.height = Math.floor(height * this.scale);
    const gctx = this.glowCanvas.getContext("2d");
    if (!gctx) throw new Error("无法创建 glow Canvas 上下文");
    this.glowCtx = gctx;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.offscreenCanvas.width = Math.floor(width * this.scale);
    this.offscreenCanvas.height = Math.floor(height * this.scale);
    this.glowCanvas.width = Math.floor(width * this.scale);
    this.glowCanvas.height = Math.floor(height * this.scale);
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
    const gx = this.glowCtx;

    ox.clearRect(0, 0, offW, offH);
    gx.clearRect(0, 0, offW, offH);

    this.drawBackground(ox, offW, offH, heatPower);

    gx.globalCompositeOperation = "lighter";
    ox.globalCompositeOperation = "lighter";

    for (const p of particles) {
      this.drawParticleField(ox, gx, p, waxColor);
    }

    ox.globalCompositeOperation = "source-over";
    gx.globalCompositeOperation = "source-over";

    this.applyMetaballThreshold(ox, offW, offH, waxColor, particles);
    this.applyGlowBlur(gx, offW, offH);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.glowCanvas, 0, 0, this.width, this.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    this.drawGlassReflection(ctx);
  }

  private drawBackground(
    ox: CanvasRenderingContext2D,
    offW: number,
    offH: number,
    heatPower: number,
  ) {
    const bgGrad = ox.createLinearGradient(0, 0, 0, offH);
    bgGrad.addColorStop(0, "rgba(10, 14, 28, 0.95)");
    bgGrad.addColorStop(0.5, "rgba(8, 10, 22, 0.98)");
    bgGrad.addColorStop(1, "rgba(14, 10, 18, 0.98)");
    ox.fillStyle = bgGrad;
    ox.fillRect(0, 0, offW, offH);

    const heatGlowIntensity = heatPower / 100;
    const heatGrad = ox.createRadialGradient(
      offW / 2,
      offH * 1.08,
      0,
      offW / 2,
      offH * 1.08,
      offH * 0.7,
    );
    heatGrad.addColorStop(0, `rgba(255, 130, 55, ${0.42 * heatGlowIntensity})`);
    heatGrad.addColorStop(0.4, `rgba(255, 85, 30, ${0.18 * heatGlowIntensity})`);
    heatGrad.addColorStop(1, "rgba(255, 60, 20, 0)");
    ox.fillStyle = heatGrad;
    ox.fillRect(0, 0, offW, offH);

    const coolGrad = ox.createRadialGradient(
      offW / 2,
      -offH * 0.12,
      0,
      offW / 2,
      -offH * 0.12,
      offH * 0.55,
    );
    coolGrad.addColorStop(0, "rgba(90, 200, 255, 0.1)");
    coolGrad.addColorStop(1, "rgba(90, 200, 255, 0)");
    ox.fillStyle = coolGrad;
    ox.fillRect(0, 0, offW, offH);
  }

  private drawParticleField(
    ox: CanvasRenderingContext2D,
    gx: CanvasRenderingContext2D,
    p: Particle,
    waxColor: HSB,
  ) {
    const px = p.x * this.scale;
    const py = p.y * this.scale;
    const phase = getPhase(p.temperature);

    const tempTint = p.temperature;
    const particleColor = {
      h: waxColor.h + (tempTint - 0.5) * 22,
      s: Math.min(1, waxColor.s + tempTint * 0.12),
      b: Math.min(1, waxColor.b + tempTint * 0.2),
    };
    const rgb = hsbToRgb(particleColor);

    const baseR = p.radius * this.scale;
    const stretchX = p.stretchX;
    const stretchY = p.stretchY;
    const rX = baseR * stretchX;
    const rY = baseR * stretchY;

    const fieldRadiusX = rX * (phase === "liquid" ? 2.2 : phase === "solid" ? 1.6 : 1.9);
    const fieldRadiusY = rY * (phase === "liquid" ? 2.2 : phase === "solid" ? 1.6 : 1.9);

    let splitFlash = 0;
    if (p.justSplit > 0) {
      splitFlash = p.justSplit * p.justSplit;
    }
    let mergePulse = 0;
    if (p.merging > 0) {
      mergePulse = p.merging * 0.6;
    }

    ox.save();
    ox.translate(px, py);
    ox.rotate(p.rotation);

    const grad = ox.createRadialGradient(0, 0, 0, 0, 0, Math.max(fieldRadiusX, fieldRadiusY));
    const coreAlpha = 1 + splitFlash * 0.5 + mergePulse * 0.3;
    grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${coreAlpha})`);
    grad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.75 + splitFlash * 0.3})`);
    const midAlpha = phase === "liquid" ? 0.25 + splitFlash * 0.2 : 0.1;
    grad.addColorStop(0.65, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${midAlpha})`);
    grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ox.fillStyle = grad;
    ox.beginPath();
    ox.ellipse(0, 0, fieldRadiusX, fieldRadiusY, 0, 0, Math.PI * 2);
    ox.fill();
    ox.restore();

    if (tempTint > 0.35 || splitFlash > 0.1) {
      const glowRgb = {
        r: Math.min(255, rgb.r + 40),
        g: Math.min(255, rgb.g + 25),
        b: rgb.b,
      };
      const glowAlphaBase = Math.max(0, tempTint - 0.3) * 0.75;
      const glowAlpha = glowAlphaBase + splitFlash * 0.6 + mergePulse * 0.3;
      const glowRadiusX = fieldRadiusX * (2.2 + splitFlash * 0.8);
      const glowRadiusY = fieldRadiusY * (2.2 + splitFlash * 0.8);

      gx.save();
      gx.translate(px, py);
      gx.rotate(p.rotation);
      const glowGrad = gx.createRadialGradient(0, 0, 0, 0, 0, Math.max(glowRadiusX, glowRadiusY));
      glowGrad.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowAlpha})`);
      glowGrad.addColorStop(0.4, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowAlpha * 0.4})`);
      glowGrad.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`);
      gx.fillStyle = glowGrad;
      gx.beginPath();
      gx.ellipse(0, 0, glowRadiusX, glowRadiusY, 0, 0, Math.PI * 2);
      gx.fill();
      gx.restore();
    }
  }

  private applyMetaballThreshold(
    ox: CanvasRenderingContext2D,
    offW: number,
    offH: number,
    waxColor: HSB,
    particles: Particle[],
  ) {
    const imageData = ox.getImageData(0, 0, offW, offH);
    const data = imageData.data;

    const scaleI = 1 / this.scale;
    const scaleJ = 1 / this.scale;

    const waxRgb = hsbToRgb(waxColor);

    for (let j = 0; j < offH; j++) {
      for (let i = 0; i < offW; i++) {
        const idx = (j * offW + i) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const worldX = i * scaleI;
        const worldY = j * scaleJ;

        let localTemp = 0.5;
        let localWeight = 0;
        for (const p of particles) {
          const dx = p.x - worldX;
          const dy = p.y - worldY;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const inf = Math.max(0, 1 - d / (p.radius * 2.5));
          if (inf > 0) {
            localTemp += p.temperature * inf;
            localWeight += inf;
          }
        }
        if (localWeight > 0) localTemp /= localWeight;
        const localPhase = getPhase(localTemp);

        const threshold = localPhase === "liquid"
          ? 115
          : localPhase === "solid"
            ? 155
            : 135;

        if (brightness > threshold) {
          const t = Math.min(1, (brightness - threshold) / (255 - threshold));
          const highlight = t * t;

          const tempBoostR = localTemp * 55;
          const tempBoostG = localTemp * 40;
          const tempBoostB = localTemp * 15;

          data[idx] = Math.min(255, waxRgb.r + highlight * 90 + tempBoostR);
          data[idx + 1] = Math.min(255, waxRgb.g + highlight * 75 + tempBoostG);
          data[idx + 2] = Math.min(255, waxRgb.b + highlight * 50 + tempBoostB);
          data[idx + 3] = 255;
        } else if (brightness > threshold * 0.55) {
          const edgeSpan = threshold - threshold * 0.55;
          const edgeT = (brightness - threshold * 0.55) / edgeSpan;
          const smoothT = edgeT * edgeT * (3 - 2 * edgeT);

          const edgeAlpha = localPhase === "liquid"
            ? smoothT * 0.85
            : localPhase === "solid"
              ? smoothT * smoothT
              : smoothT * 0.95;

          const edgeR = localPhase === "solid" ? waxRgb.r * 0.82 : waxRgb.r * 0.95;
          const edgeG = localPhase === "solid" ? waxRgb.g * 0.82 : waxRgb.g * 0.95;
          const edgeB = localPhase === "solid" ? waxRgb.b * 0.88 : waxRgb.b * 0.95;

          data[idx] = edgeR;
          data[idx + 1] = edgeG;
          data[idx + 2] = edgeB;
          data[idx + 3] = Math.floor(255 * edgeAlpha);
        } else {
          data[idx + 3] = 0;
        }
      }
    }

    ox.putImageData(imageData, 0, 0);
  }

  private applyGlowBlur(
    gx: CanvasRenderingContext2D,
    offW: number,
    offH: number,
  ) {
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = Math.floor(offW / 3);
    tmpCanvas.height = Math.floor(offH / 3);
    const tctx = tmpCanvas.getContext("2d");
    if (!tctx) return;

    tctx.drawImage(this.glowCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    gx.clearRect(0, 0, offW, offH);
    gx.imageSmoothingEnabled = true;
    gx.imageSmoothingQuality = "low";
    for (let pass = 0; pass < 2; pass++) {
      gx.drawImage(tmpCanvas, 0, 0, offW, offH);
    }
  }

  private drawGlassReflection(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const w = this.width;
    const h = this.height;

    const lrGrad = ctx.createLinearGradient(0, 0, w, 0);
    lrGrad.addColorStop(0, "rgba(255,255,255,0.14)");
    lrGrad.addColorStop(0.08, "rgba(255,255,255,0.035)");
    lrGrad.addColorStop(0.92, "rgba(255,255,255,0.02)");
    lrGrad.addColorStop(1, "rgba(255,255,255,0.1)");
    ctx.fillStyle = lrGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    const hiGrad = ctx.createLinearGradient(w * 0.1, 0, w * 0.25, h);
    hiGrad.addColorStop(0, "rgba(255,255,255,0.18)");
    hiGrad.addColorStop(0.5, "rgba(255,255,255,0.07)");
    hiGrad.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = hiGrad;
    ctx.fillRect(w * 0.1, h * 0.05, w * 0.08, h * 0.9);

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
}
