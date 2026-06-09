interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  gradientFrom = "#ff6b3d",
  gradientTo = "#4fc3f7",
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80 tracking-wide">
          {label}
        </span>
        <span
          className="text-sm font-mono font-semibold px-2 py-0.5 rounded-md"
          style={{
            background: `linear-gradient(90deg, ${gradientFrom}30, ${gradientTo}30)`,
            color: gradientFrom,
          }}
        >
          {typeof value === "number" && !Number.isInteger(value)
            ? value.toFixed(2)
            : value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-125
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-pointer"
          style={
            {
              ["--val" as string]: `${percent}%`,
              ["--thumb-border" as string]: gradientFrom,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
