import { useLampStore } from "@/store/useLampStore";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { Video, Square, Loader2 } from "lucide-react";

interface RecordPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function RecordPanel({ canvasRef }: RecordPanelProps) {
  const { isRecording, recordingProgress } = useLampStore();
  const { start, stop } = useMediaRecorder();

  const handleRecord = () => {
    if (isRecording) {
      stop();
    } else if (canvasRef.current) {
      start(canvasRef.current);
    }
  };

  const secondsLeft = Math.max(0, Math.ceil(10 * (1 - recordingProgress)));

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isRecording
              ? "bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30"
              : "bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-purple-500/20"
          }`}
        >
          {isRecording ? (
            <Square className="w-4 h-4 text-white fill-white" />
          ) : (
            <Video className="w-4 h-4 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            {isRecording ? "录制中..." : "动画导出"}
          </h2>
          <p className="text-xs text-white/40">
            {isRecording
              ? `${secondsLeft}s 后自动完成`
              : "录制 10 秒循环 WebM 视频"}
          </p>
        </div>
      </div>

      {isRecording && (
        <div className="space-y-2">
          <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${recordingProgress * 100}%`,
                background:
                  "linear-gradient(90deg, #ef4444, #f97316, #eab308)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-white/90 drop-shadow">
                {Math.round(recordingProgress * 100)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-white/40 font-mono">
            <span>00:00</span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
            <span>00:10</span>
          </div>
        </div>
      )}

      <button
        onClick={handleRecord}
        disabled={isRecording}
        className={`relative w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden ${
          isRecording
            ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        {isRecording ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在录制 {secondsLeft}s
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Video className="w-4 h-4" />
            开始录制 10 秒动画
          </span>
        )}
        {!isRecording && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        )}
      </button>

      {!isRecording && (
        <p className="text-[11px] text-white/35 leading-relaxed text-center">
          提示：点击灯内任意位置可手动注入蜡滴，获得专属效果后再录制
        </p>
      )}
    </div>
  );
}
