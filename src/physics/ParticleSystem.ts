import { clamp, random, distance } from "@/utils/mathUtils";

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
}

export class ParticleSystem {
  particles: Particle[] = [];
  private nextId = 0;
  width: number;
  height: number;
  private maxParticles = 120;

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
    const blobCount = Math.floor(5 + density * 8);
    for (let i = 0; i < blobCount; i++) {
      this.createBlob(
        random(this.width * 0.2, this.width * 0.8),
        random(this.height * 0.3, this.height * 0.85),
        density,
      );
    }
  }

  private createBlob(x: number, y: number, density: number) {
    const baseRadius = random(18, 36) * (1.2 - density * 0.4);
    const particleCount = Math.floor(random(6, 12));

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + random(-0.2, 0.2);
      const dist = random(2, baseRadius * 0.5);
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;

      this.particles.push({
        id: this.nextId++,
        x: px,
        y: py,
        vx: random(-0.2, 0.2),
        vy: random(-0.1, 0.1),
        temperature: random(0.3, 0.7),
        radius: baseRadius * random(0.6, 1.1),
        baseRadius: baseRadius,
        life: 1,
      });
    }
  }

  update(
    dt: number,
    heatPower: number,
    waxDensity: number,
    splitChance: number = 0.002,
  ) {
    const heatZoneBottom = this.height * 0.82;
    const coolZoneTop = this.height * 0.25;
    const gravity = 0.035 * waxDensity;
    const heatRate = heatPower / 100;
    const viscosity = 0.985;
    const buoyancyStrength = 0.12;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.y > heatZoneBottom) {
        p.temperature = clamp(p.temperature + heatRate * 0.03, 0, 1);
      } else if (p.y < coolZoneTop) {
        p.temperature = clamp(p.temperature - 0.02, 0, 1);
      } else {
        p.temperature = clamp(p.temperature - 0.004, 0, 1);
      }

      p.temperature += random(-0.003, 0.003);

      const effectiveDensity = waxDensity * (1 + (0.5 - p.temperature) * 0.8);
      const buoyancy = (0.5 - p.temperature) * buoyancyStrength;
      const totalForce = gravity + buoyancy * (2 - waxDensity);

      p.vy += totalForce * (1 - effectiveDensity * 0.5) * dt * 60;

      p.vx += random(-0.015, 0.015);
      p.vy += random(-0.008, 0.008);

      p.vx *= viscosity;
      p.vy *= viscosity;

      const maxSpeed = 2.5;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      const margin = p.radius * 0.6;
      if (p.x < margin) {
        p.x = margin;
        p.vx *= -0.5;
      }
      if (p.x > this.width - margin) {
        p.x = this.width - margin;
        p.vx *= -0.5;
      }
      if (p.y < margin) {
        p.y = margin;
        p.vy *= -0.3;
        p.temperature = clamp(p.temperature - 0.02, 0, 1);
      }
      if (p.y > this.height - margin) {
        p.y = this.height - margin;
        p.vy *= -0.3;
        p.temperature = clamp(p.temperature + heatRate * 0.05, 0, 1);
      }

      const tempFactor = 0.8 + p.temperature * 0.5;
      p.radius = p.baseRadius * tempFactor;
    }

    this.applyParticleForces();

    if (this.particles.length < this.maxParticles && Math.random() < splitChance) {
      this.trySplit(waxDensity);
    }

    this.tryMerge();
  }

  private applyParticleForces() {
    const attractionDist = 70;
    const repulsionDist = 20;
    const attractionStrength = 0.003;
    const repulsionStrength = 0.04;

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;

        if (dist < attractionDist) {
          const nx = dx / dist;
          const ny = dy / dist;

          if (dist < repulsionDist) {
            const force = (repulsionDist - dist) * repulsionStrength;
            a.vx -= nx * force;
            a.vy -= ny * force;
            b.vx += nx * force;
            b.vy += ny * force;
          } else {
            const factor = 1 - dist / attractionDist;
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

  private trySplit(waxDensity: number) {
    const hotParticles = this.particles.filter((p) => p.temperature > 0.75);
    if (hotParticles.length === 0) return;

    const parent = hotParticles[Math.floor(Math.random() * hotParticles.length)];
    const splitRadius = parent.baseRadius * 0.55;

    for (let k = 0; k < 2; k++) {
      const angle = random(0, Math.PI * 2);
      this.particles.push({
        id: this.nextId++,
        x: parent.x + Math.cos(angle) * parent.radius * 0.3,
        y: parent.y + Math.sin(angle) * parent.radius * 0.3,
        vx: Math.cos(angle) * random(0.3, 0.8) + parent.vx * 0.5,
        vy: Math.sin(angle) * random(0.3, 0.8) + parent.vy * 0.5,
        temperature: parent.temperature * random(0.85, 1),
        radius: splitRadius,
        baseRadius: splitRadius,
        life: 1,
      });
    }

    parent.baseRadius *= 0.7;
    parent.temperature *= 0.9;
  }

  private tryMerge() {
    const minRadius = 10;
    const toRemove: Set<number> = new Set();

    for (let i = 0; i < this.particles.length; i++) {
      if (toRemove.has(this.particles[i].id)) continue;
      const a = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        if (toRemove.has(this.particles[j].id)) continue;
        const b = this.particles[j];

        const dist = distance(a.x, a.y, b.x, b.y);
        const mergeDist = (a.radius + b.radius) * 0.35;

        if (dist < mergeDist && a.baseRadius < minRadius + 5 && b.baseRadius < minRadius + 5) {
          const totalMass = a.baseRadius * a.baseRadius + b.baseRadius * b.baseRadius;
          const newRadius = Math.sqrt(totalMass);

          a.x = (a.x * a.baseRadius + b.x * b.baseRadius) / (a.baseRadius + b.baseRadius);
          a.y = (a.y * a.baseRadius + b.y * b.baseRadius) / (a.baseRadius + b.baseRadius);
          a.vx = (a.vx * a.baseRadius + b.vx * b.baseRadius) / (a.baseRadius + b.baseRadius);
          a.vy = (a.vy * a.baseRadius + b.vy * b.baseRadius) / (a.baseRadius + b.baseRadius);
          a.temperature = (a.temperature * a.baseRadius + b.temperature * b.baseRadius) / (a.baseRadius + b.baseRadius);
          a.baseRadius = newRadius;
          a.radius = newRadius;

          toRemove.add(b.id);
        }
      }
    }

    if (toRemove.size > 0) {
      this.particles = this.particles.filter((p) => !toRemove.has(p.id));
    }
  }

  addParticlesAt(x: number, y: number, count: number, waxDensity: number) {
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const dist = random(0, 15);
      const baseR = random(14, 24) * (1.2 - waxDensity * 0.4);
      this.particles.push({
        id: this.nextId++,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * random(0.2, 0.6),
        vy: Math.sin(angle) * random(0.2, 0.6) - 0.3,
        temperature: random(0.5, 0.9),
        radius: baseR,
        baseRadius: baseR,
        life: 1,
      });
    }
  }
}
