import { PRESETS, useLampStore, type LampPreset } from "@/store/useLampStore";
import { hsbToHex } from "@/utils/colorUtils";

export default function PresetSelector() {
  const { applyPreset, waxColor, heatPower, waxDensity } = useLampStore();

  const isActive = (preset: LampPreset) =>
    preset.waxColor.h === waxColor.h &&
    Math.abs(preset.waxColor.s - waxColor.s) < 0.01 &&
    Math.abs(preset.waxColor.b - waxColor.b) < 0.01 &&
    preset.heatPower === heatPower &&
    preset.waxDensity === waxDensity;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
        预设方案
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const active = isActive(preset);
          const color = hsbToHex(preset.waxColor);
          return (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                active
                  ? "bg-white/10 ring-1 ring-white/25 scale-[1.02]"
                  : "bg-white/[0.03] hover:bg-white/[0.07] ring-1 ring-white/5 hover:ring-white/15"
              }`}
            >
              <span
                className="relative w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-white/20"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${color}ff, ${color}aa)`,
                  boxShadow: active ? `0 0 15px ${color}80` : "none",
                }}
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-white/75"
                }`}
              >
                {preset.name}
              </span>
              {active && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-lamp-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
