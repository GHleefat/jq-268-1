import { clamp, random, distance, lerp } from "@/utils/mathUtils";

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  temperature: number;
  radius: number;
  baseRadius: number;
  life: number;
  stretchX: number;
  stretchY: number;
  rotation: number;
  justSplit: number;
  merging: number;
}

const SOLID_THRESHOLD = 0.3;
const LIQUID_THRESHOLD = 0.65;

export function getPhase(temperature: number): "solid" | "transition" | "liquid" {
  if (temperature < SOLID_THRESHOLD) return "solid";
  if (temperature > LIQUID_THRESHOLD) return "liquid";
  return "transition";
}

export class ParticleSystem {
  particles: Particle[] = [];
  private nextId = 0;
  width: number;
  height: number;
  private maxParticles = 180;
  private splitCooldown: Map<number, number> = new Map();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  initBlobs(density: number) {
    this.particles = [];
    this.nextId = 0;
    this.splitCooldown.clear();

    const blobCount = Math.floor(4 + density * 6);
    for (let i = 0; i < blobCount; i++) {
      this.createBlob(
        random(this.width * 0.2, this.width * 0.8),
        random(this.height * 0.4, this.height * 0.85),
        density,
      );
    }
  }

  private createBlob(x: number, y: number, density: number) {
    const baseRadius = random(22, 40) * (1.25 - density * 0.45);
    const particleCount = Math.floor(random(5, 10));

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + random(-0.15, 0.15);
      const dist = random(3, baseRadius * 0.45);
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;

      this.particles.push({
        id: this.nextId++,
        x: px,
        y: py,
        vx: random(-0.15, 0.15),
        vy: random(-0.1, 0.1),
        temperature: random(0.25, 0.6),
        radius: baseRadius * random(0.65, 1.1),
        baseRadius: baseRadius,
        life: 1,
        stretchX: 1,
        stretchY: 1,
        rotation: random(0, Math.PI * 2),
        justSplit: 0,
        merging: 0,
      });
    }
  }

  update(dt: number, heatPower: number, waxDensity: number) {
    const heatZoneBottom = this.height * 0.8;
    const coolZoneTop = this.height * 0.28;
    const baseGravity = 0.04 * waxDensity;
    const heatRate = heatPower / 100;

    for (const p of this.particles) {
      if (p.y > heatZoneBottom) {
        const heatAmount = heatRate * 0.045 * (1 + (p.y - heatZoneBottom) / (this.height * 0.2));
        p.temperature = clamp(p.temperature + heatAmount, 0, 1);
      } else if (p.y < coolZoneTop) {
        const coolAmount = 0.028 * (1 + (coolZoneTop - p.y) / (this.height * 0.3));
        p.temperature = clamp(p.temperature - coolAmount, 0, 1);
      } else {
        const midT = (p.y - coolZoneTop) / (heatZoneBottom - coolZoneTop);
        const drift = (midT - 0.5) * 0.006;
        p.temperature = clamp(p.temperature - drift, 0, 1);
      }

      p.temperature += random(-0.004, 0.004);

      const phase = getPhase(p.temperature);
      const tempNorm = p.temperature;

      const densityFactor = waxDensity * (1 + (0.5 - tempNorm) * 1.1);
      const buoyancy = (0.5 - tempNorm) * 0.18;
      const gravityMod = phase === "liquid" ? 0.7 : phase === "solid" ? 1.25 : 1.0;
      const totalForce = baseGravity * gravityMod + buoyancy * (2.2 - waxDensity);

      p.vy += totalForce * (1 - densityFactor * 0.45) * dt * 60;

      const brownianBase = phase === "liquid" ? 0.025 : phase === "solid" ? 0.006 : 0.014;
      p.vx += random(-brownianBase, brownianBase);
      p.vy += random(-brownianBase * 0.6, brownianBase * 0.6);

      const viscosity = phase === "liquid" ? 0.992 : phase === "solid" ? 0.97 : 0.982;
      p.vx *= viscosity;
      p.vy *= viscosity;

      const maxSpeed = phase === "liquid" ? 3.8 : phase === "solid" ? 1.6 : 2.6;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      const stretchTarget = 1 + Math.min(speed * 0.12, 0.7);
      const stretchSmooth = phase === "liquid" ? 0.15 : phase === "solid" ? 0.04 : 0.09;
      if (speed > 0.3) {
        const dirStretchY = Math.abs(p.vy) / Math.max(speed, 0.001);
        const dirStretchX = 1 - dirStretchY * 0.6;
        p.stretchY = lerp(p.stretchY, 1 + dirStretchY * (stretchTarget - 1), stretchSmooth);
        p.stretchX = lerp(p.stretchX, dirStretchX + 0.4, stretchSmooth * 0.8);
        p.rotation = lerp(p.rotation, Math.atan2(p.vy, p.vx) + Math.PI / 2, stretchSmooth * 0.6);
      } else {
        p.stretchX = lerp(p.stretchX, 1, 0.08);
        p.stretchY = lerp(p.stretchY, 1, 0.08);
      }

      if (p.justSplit > 0) p.justSplit = Math.max(0, p.justSplit - dt * 2.5);
      if (p.merging > 0) p.merging = Math.max(0, p.merging - dt * 2);

      const radiusTempFactor = phase === "liquid"
        ? 1.0 + tempNorm * 0.45
        : phase === "solid"
          ? 0.75 + tempNorm * 0.15
          : lerp(0.85, 1.35, (tempNorm - SOLID_THRESHOLD) / (LIQUID_THRESHOLD - SOLID_THRESHOLD));
      p.radius = p.baseRadius * radiusTempFactor;

      const margin = p.radius * 0.55;
      if (p.x < margin) {
        p.x = margin;
        p.vx *= -0.55;
      }
      if (p.x > this.width - margin) {
        p.x = this.width - margin;
        p.vx *= -0.55;
      }
      if (p.y < margin) {
        p.y = margin;
        p.vy *= -0.4;
        p.temperature = clamp(p.temperature - 0.025, 0, 1);
      }
      if (p.y > this.height - margin) {
        p.y = this.height - margin;
        p.vy *= -0.35;
        p.temperature = clamp(p.temperature + heatRate * 0.07, 0, 1);
      }
    }

    this.applyParticleForces();

    for (let ticks = 0; ticks < 3; ticks++) {
      this.trySplit(waxDensity, dt);
      this.tryMerge();
    }

    for (const [id, cd] of this.splitCooldown) {
      if (cd <= 0) this.splitCooldown.delete(id);
      else this.splitCooldown.set(id, cd - dt);
    }
  }

  private applyParticleForces() {
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      const phaseA = getPhase(a.temperature);

      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;

        const phaseB = getPhase(b.temperature);
        const avgTemp = (a.temperature + b.temperature) * 0.5;
        const avgPhase = getPhase(avgTemp);

        const attractionDist = avgPhase === "liquid"
          ? 55
          : avgPhase === "solid"
            ? 95
            : 75;
        const repulsionDist = Math.max(a.radius, b.radius) * 0.85;

        if (dist < attractionDist) {
          const nx = dx / dist;
          const ny = dy / dist;

          if (dist < repulsionDist) {
            const repulsionStrength = phaseA === "liquid" || phaseB === "liquid" ? 0.06 : 0.035;
            const force = (repulsionDist - dist) * repulsionStrength;
            a.vx -= nx * force;
            a.vy -= ny * force;
            b.vx += nx * force;
            b.vy += ny * force;
          } else {
            const factor = 1 - dist / attractionDist;
            const attractionStrength = avgPhase === "solid"
              ? 0.01
              : avgPhase === "liquid"
                ? 0.002
                : 0.0055;
            const force = attractionStrength * factor * factor;
            a.vx += nx * force;
            a.vy += ny * force;
            b.vx -= nx * force;
            b.vy -= ny * force;
          }
        }
      }
    }
  }

  private trySplit(waxDensity: number, dt: number) {
    if (this.particles.length >= this.maxParticles) return;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const phase = getPhase(p.temperature);

      if (phase !== "liquid") continue;
      if (p.baseRadius < 14) continue;
      if (this.splitCooldown.has(p.id)) continue;

      const baseChance = 0.012;
      const tempBoost = Math.pow(Math.max(0, p.temperature - 0.6) * 2.8, 1.5);
      const sizeBoost = (p.baseRadius - 14) / 26;
      const chance = (baseChance + tempBoost * 0.08 + sizeBoost * 0.025) * dt * 60;

      if (Math.random() > chance) continue;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const dirAngle = speed > 0.3 ? Math.atan2(p.vy, p.vx) : random(0, Math.PI * 2);

      const pieces = Math.random() < 0.35 ? 3 : 2;
      const newBaseR = p.baseRadius / Math.sqrt(pieces) * random(0.78, 0.92);

      for (let k = 0; k < pieces; k++) {
        const spreadAngle = dirAngle + (k - (pieces - 1) / 2) * random(0.6, 1.1) + random(-0.15, 0.15);
        const ejectSpeed = random(0.8, 1.8) * (0.8 + p.temperature * 0.6);

        this.particles.push({
          id: this.nextId++,
          x: p.x + Math.cos(spreadAngle) * p.radius * 0.35,
          y: p.y + Math.sin(spreadAngle) * p.radius * 0.35,
          vx: p.vx * 0.5 + Math.cos(spreadAngle) * ejectSpeed,
          vy: p.vy * 0.5 + Math.sin(spreadAngle) * ejectSpeed,
          temperature: p.temperature * random(0.9, 1),
          radius: newBaseR,
          baseRadius: newBaseR,
          life: 1,
          stretchX: random(0.6, 0.85),
          stretchY: random(1.3, 1.7),
          rotation: spreadAngle + Math.PI / 2,
          justSplit: 1,
          merging: 0,
        });
      }

      p.baseRadius *= 0.25 + random(0, 0.2);
      p.justSplit = 1;
      this.splitCooldown.set(p.id, 0.8);

      if (this.particles.length >= this.maxParticles) break;
    }
  }

  private tryMerge() {
    const toRemove: Set<number> = new Set();
    const toUpdate: Map<number, Partial<Particle>> = new Map();

    for (let i = 0; i < this.particles.length; i++) {
      if (toRemove.has(this.particles[i].id)) continue;
      const a = this.particles[i];
      const phaseA = getPhase(a.temperature);
      if (phaseA === "liquid") continue;

      for (let j = i + 1; j < this.particles.length; j++) {
        if (toRemove.has(this.particles[j].id)) continue;
        const b = this.particles[j];
        const phaseB = getPhase(b.temperature);
        if (phaseB === "liquid") continue;

        const dist = distance(a.x, a.y, b.x, b.y);
        const mergeRadius = phaseA === "solid" && phaseB === "solid"
          ? (a.radius + b.radius) * 0.95
          : (a.radius + b.radius) * 0.6;

        if (dist < mergeRadius) {
          const totalMass = a.baseRadius * a.baseRadius + b.baseRadius * b.baseRadius;
          const newRadius = Math.sqrt(totalMass);
          const newBaseR = newRadius * random(0.92, 1);

          const aMass = a.baseRadius * a.baseRadius;
          const bMass = b.baseRadius * b.baseRadius;
          const totalMassS = aMass + bMass;

          toUpdate.set(a.id, {
            x: (a.x * aMass + b.x * bMass) / totalMassS,
            y: (a.y * aMass + b.y * bMass) / totalMassS,
            vx: (a.vx * aMass + b.vx * bMass) / totalMassS,
            vy: (a.vy * aMass + b.vy * bMass) / totalMassS,
            temperature: (a.temperature * aMass + b.temperature * bMass) / totalMassS,
            baseRadius: newBaseR,
            radius: newBaseR,
            merging: 1,
          });

          toRemove.add(b.id);
        }
      }
    }

    if (toRemove.size > 0) {
      for (const [id, patch] of toUpdate) {
        const p = this.particles.find((pp) => pp.id === id);
        if (p) Object.assign(p, patch);
      }
      this.particles = this.particles.filter((p) => !toRemove.has(p.id));
    }
  }

  addParticlesAt(x: number, y: number, count: number, waxDensity: number) {
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const dist = random(0, 18);
      const baseR = random(16, 28) * (1.25 - waxDensity * 0.45);
      this.particles.push({
        id: this.nextId++,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * random(0.3, 0.9),
        vy: Math.sin(angle) * random(0.3, 0.9) - 0.4,
        temperature: random(0.65, 0.95),
        radius: baseR,
        baseRadius: baseR,
        life: 1,
        stretchX: 0.75,
        stretchY: 1.5,
        rotation: angle + Math.PI / 2,
        justSplit: 1,
        merging: 0,
      });
    }
  }
}
