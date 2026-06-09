import { useRef } from "react";
import LavaLampCanvas from "@/components/LavaLampCanvas";
import ControlPanel from "@/components/ControlPanel";
import RecordPanel from "@/components/RecordPanel";
import { Sparkles } from "lucide-react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-lamp-bg noise-overlay">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <header className="absolute top-0 left-0 right-0 z-20 px-6 md:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 blur opacity-40" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-orange-200 to-purple-300 bg-clip-text text-transparent">
              Lava Forge
            </h1>
            <p className="text-[10px] md:text-xs text-white/40 font-mono tracking-widest uppercase">
              Physics Simulator
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/50 font-mono">SIM ACTIVE</span>
        </div>
      </header>

      <main className="relative z-10 w-full h-full flex flex-col lg:flex-row pt-20 md:pt-24 pb-4 md:pb-6 px-4 md:px-8 lg:px-10 gap-4 md:gap-6">
        <section className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/[0.02] to-transparent" />
          </div>
          <LavaLampCanvas canvasRef={canvasRef} />
        </section>

        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4 lg:gap-5 overflow-y-auto lg:max-h-full pb-4 lg:pb-0 scrollbar-thin">
          <div className="glass-panel rounded-2xl p-5 flex-shrink-0">
            <ControlPanel />
          </div>
          <div className="flex-shrink-0">
            <RecordPanel canvasRef={canvasRef} />
          </div>
          <div className="flex-shrink-0 glass-panel rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-mono tracking-wide">
              v1.0.0 · Metaball Engine
            </span>
            <span className="text-[10px] text-white/30 font-mono">
              60FPS Target
            </span>
          </div>
        </aside>
      </main>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-white/25 font-mono tracking-wider">
          Click inside the lamp to inject wax blobs
        </p>
      </div>
    </div>
  );
}
