import { useRef, useCallback } from "react";
import { useLampStore } from "@/store/useLampStore";

const RECORD_DURATION = 10000;
const FPS = 60;

export function useMediaRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const { startRecording, stopRecording, setRecordingProgress } = useLampStore();

  const start = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (mediaRecorderRef.current) return;

      try {
        const stream = canvas.captureStream(FPS);
        const mimeTypes = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
        let selectedMimeType = "";
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }

        const options: MediaRecorderOptions = selectedMimeType
          ? { mimeType: selectedMimeType, videoBitsPerSecond: 8_000_000 }
          : { videoBitsPerSecond: 8_000_000 };

        const recorder = new MediaRecorder(stream, options);
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: selectedMimeType || "video/webm",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `lava-lamp-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(100);
        startRecording();
        startTimeRef.current = performance.now();

        progressIntervalRef.current = window.setInterval(() => {
          const elapsed = performance.now() - startTimeRef.current;
          const progress = Math.min(1, elapsed / RECORD_DURATION);
          setRecordingProgress(progress);
        }, 50);

        timerRef.current = window.setTimeout(() => {
          stop();
        }, RECORD_DURATION);
      } catch (err) {
        console.error("录制启动失败:", err);
        stopRecording();
      }
    },
    [startRecording, setRecordingProgress],
  );

  const stop = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopRecording();
  }, [stopRecording]);

  return { start, stop };
}
