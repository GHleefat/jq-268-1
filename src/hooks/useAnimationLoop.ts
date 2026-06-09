import { useEffect, useRef, useCallback } from "react";

export function useAnimationLoop(
  callback: (dt: number, time: number) => void,
  enabled: boolean = true,
) {
  const frameRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const tick = useCallback((time: number) => {
    if (!prevTimeRef.current) prevTimeRef.current = time;
    const dt = Math.min(0.05, (time - prevTimeRef.current) / 1000);
    prevTimeRef.current = time;

    callbackRef.current(dt, time);
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    prevTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enabled, tick]);
}
