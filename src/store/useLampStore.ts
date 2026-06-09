import { create } from "zustand";
import type { HSB } from "@/utils/colorUtils";

export interface LampPreset {
  name: string;
  heatPower: number;
  waxColor: HSB;
  waxDensity: number;
}

export const PRESETS: LampPreset[] = [
  {
    name: "经典熔岩",
    heatPower: 65,
    waxColor: { h: 18, s: 0.92, b: 0.95 },
    waxDensity: 0.7,
  },
  {
    name: "极光蓝调",
    heatPower: 55,
    waxColor: { h: 200, s: 0.85, b: 0.9 },
    waxDensity: 0.85,
  },
  {
    name: "迷幻紫雾",
    heatPower: 70,
    waxColor: { h: 280, s: 0.8, b: 0.88 },
    waxDensity: 0.6,
  },
  {
    name: "翡翠森林",
    heatPower: 60,
    waxColor: { h: 145, s: 0.75, b: 0.85 },
    waxDensity: 0.95,
  },
  {
    name: "日落熔金",
    heatPower: 75,
    waxColor: { h: 42, s: 0.95, b: 1 },
    waxDensity: 0.5,
  },
];

interface LampState {
  heatPower: number;
  waxColor: HSB;
  waxDensity: number;
  isRecording: boolean;
  recordingProgress: number;
  setHeatPower: (v: number) => void;
  setWaxColor: (c: HSB) => void;
  setWaxDensity: (v: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  setRecordingProgress: (v: number) => void;
  applyPreset: (preset: LampPreset) => void;
}

export const useLampStore = create<LampState>((set) => ({
  heatPower: PRESETS[0].heatPower,
  waxColor: PRESETS[0].waxColor,
  waxDensity: PRESETS[0].waxDensity,
  isRecording: false,
  recordingProgress: 0,
  setHeatPower: (v) => set({ heatPower: v }),
  setWaxColor: (c) => set({ waxColor: c }),
  setWaxDensity: (v) => set({ waxDensity: v }),
  startRecording: () => set({ isRecording: true, recordingProgress: 0 }),
  stopRecording: () => set({ isRecording: false, recordingProgress: 0 }),
  setRecordingProgress: (v) => set({ recordingProgress: v }),
  applyPreset: (preset) =>
    set({
      heatPower: preset.heatPower,
      waxColor: preset.waxColor,
      waxDensity: preset.waxDensity,
    }),
}));
