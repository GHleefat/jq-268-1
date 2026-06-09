import { useEffect, useRef, useCallback } from "react";
import { ParticleSystem } from "@/physics/ParticleSystem";
import { MetaballRenderer } from "@/physics/MetaballRenderer";
import { useAnimationLoop } from "@/hooks/useAnimationLoop";
import { useLampStore } from "@/store/useLampStore";

interface LavaLampCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function LavaLampCanvas({ canvasRef }: LavaLampCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const rendererRef = useRef<MetaballRenderer | null>(null);
  const lastDensityRef = useRef<number>(0);
  const lastResetRef = useRef<number>(0);

  const { heatPower, waxColor, waxDensity } = useLampStore();

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    const logicalW = rect.width;
    const logicalH = rect.height;

    if (!particleSystemRef.current) {
      particleSystemRef.current = new ParticleSystem(logicalW, logicalH);
      particleSystemRef.current.initBlobs(waxDensity);
      lastDensityRef.current = waxDensity;
    } else {
      particleSystemRef.current.resize(logicalW, logicalH);
    }

    if (!rendererRef.current) {
      rendererRef.current = new MetaballRenderer(logicalW, logicalH);
    } else {
      rendererRef.current.resize(logicalW, logicalH);
    }
  }, [canvasRef, waxDensity]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  useEffect(() => {
    if (!particleSystemRef.current) return;
    const now = Date.now();
    if (now - lastResetRef.current < 800) return;

    const densityDiff = Math.abs(waxDensity - lastDensityRef.current);
    if (densityDiff > 0.25) {
      particleSystemRef.current.initBlobs(waxDensity);
      lastDensityRef.current = waxDensity;
      lastResetRef.current = now;
    } else {
      lastDensityRef.current = waxDensity;
    }
  }, [waxDensity]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!particleSystemRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      particleSystemRef.current.addParticlesAt(x, y, 4, waxDensity);
    },
    [canvasRef, waxDensity],
  );

  useAnimationLoop((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!particleSystemRef.current || !rendererRef.current) return;

    particleSystemRef.current.update(dt, heatPower, waxDensity);
    rendererRef.current.render(ctx, particleSystemRef.current.particles, waxColor, heatPower);
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="relative w-full h-full max-w-md">
          <div
            className="absolute -inset-2 rounded-[3rem] opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(ellipse at 50% 85%, hsla(${waxColor.h}, ${waxColor.s * 100}%, ${waxColor.b * 70}%, 0.5), transparent 60%)`,
            }}
          />
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer"
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/20" />
            <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-[70%] h-3 rounded-full bg-gradient-to-b from-black/60 to-transparent" />
            <div className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-[85%] h-4 rounded-full bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-[75%] h-6 rounded-b-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border-x border-b border-white/5 shadow-lg" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-[60%] h-3 rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-950 border-x border-b border-white/5" />
        </div>
      </div>
    </div>
  );
}
