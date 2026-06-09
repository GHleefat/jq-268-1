import { useLampStore } from "@/store/useLampStore";
import { hsbToHex } from "@/utils/colorUtils";
import Slider from "./Slider";
import PresetSelector from "./PresetSelector";
import { Flame, Droplets, Palette } from "lucide-react";

const COLOR_SWATCHES = [
  { h: 18, s: 0.92, b: 0.95 },
  { h: 0, s: 0.9, b: 0.9 },
  { h: 42, s: 0.95, b: 1 },
  { h: 120, s: 0.75, b: 0.85 },
  { h: 180, s: 0.85, b: 0.9 },
  { h: 210, s: 0.9, b: 0.95 },
  { h: 280, s: 0.8, b: 0.88 },
  { h: 330, s: 0.85, b: 0.92 },
];

export default function ControlPanel() {
  const { heatPower, waxColor, waxDensity, setHeatPower, setWaxColor, setWaxDensity } =
    useLampStore();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">熔岩实验室</h2>
            <p className="text-xs text-white/40">调节物理参数，锻造你的灯</p>
          </div>
        </div>
      </div>

      <PresetSelector />

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            加热功率
          </h3>
        </div>
        <Slider
          label="对流强度"
          value={heatPower}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={setHeatPower}
          gradientFrom="#ff6b3d"
          gradientTo="#ffc93d"
        />
        <p className="text-[11px] text-white/35 leading-relaxed">
          功率越高，蜡块受热越快，上升更猛烈。过高会让蜡块沸腾不止。
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            蜡颜色
          </h3>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {COLOR_SWATCHES.map((c, i) => {
            const hex = hsbToHex(c);
            const active =
              Math.abs(c.h - waxColor.h) < 1 &&
              Math.abs(c.s - waxColor.s) < 0.05;
            return (
              <button
                key={i}
                onClick={() => setWaxColor(c)}
                className={`aspect-square rounded-lg transition-all duration-200 ${
                  active
                    ? "ring-2 ring-white scale-110 shadow-lg"
                    : "ring-1 ring-white/10 hover:ring-white/30 hover:scale-105"
                }`}
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${hex}ee, ${hex}99)`,
                  boxShadow: active ? `0 0 15px ${hex}80` : "none",
                }}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">色相微调</span>
            <span className="text-xs font-mono text-white/50">
              H {Math.round(waxColor.h)}°
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={waxColor.h}
            onChange={(e) => setWaxColor({ ...waxColor, h: Number(e.target.value) })}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">饱和度</span>
            <span className="text-xs font-mono text-white/50">
              S {Math.round(waxColor.s * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={waxColor.s * 100}
            onChange={(e) =>
              setWaxColor({ ...waxColor, s: Number(e.target.value) / 100 })
            }
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(${waxColor.h}, 0%, 50%), hsl(${waxColor.h}, 100%, 50%))`,
            }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">明度</span>
            <span className="text-xs font-mono text-white/50">
              B {Math.round(waxColor.b * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={waxColor.b * 100}
            onChange={(e) =>
              setWaxColor({ ...waxColor, b: Number(e.target.value) / 100 })
            }
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #000, hsl(${waxColor.h}, ${waxColor.s * 100}%, 50%))`,
            }}
          />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            蜡密度
          </h3>
        </div>
        <Slider
          label="物质比重"
          value={waxDensity}
          min={0.3}
          max={1.2}
          step={0.01}
          onChange={setWaxDensity}
          gradientFrom="#4fc3f7"
          gradientTo="#7c4dff"
        />
        <div className="flex justify-between text-[11px] text-white/40">
          <span>轻盈浮悬</span>
          <span className="text-white/60">
            {waxDensity < 0.5
              ? "快速升腾"
              : waxDensity < 0.75
                ? "标准流动"
                : waxDensity < 1.0
                  ? "沉稳升降"
                  : "贴底厚重"}
          </span>
          <span>厚重沉底</span>
        </div>
      </div>
    </div>
  );
}
