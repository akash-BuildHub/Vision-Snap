import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAPTURE_INTERVAL_MS, UPLOAD_FRAME_STEP_SECONDS } from "../config/capture";
import { captureVideoFrame } from "../lib/canvas";
import { buildSampleId } from "../lib/id";
import { seekTo } from "../lib/media";

const HOLD_POINTER = "pointer";
const HOLD_KEY = "key";

/**
 * Drives the capture loop that turns a playing video into image samples.
 *
 * Two ways to record, and they must not fight each other:
 *   - holding the button (pointer/touch), which stops on release
 *   - tapping Space, which latches until Space is pressed again
 *
 * The origin of the current run is tracked so a stray mouseleave cannot cancel
 * a keyboard-latched recording.
 */
export function useFrameRecorder({
  videoRef,
  mirrored = false,
  stepThroughFile = false,
  onSample,
  onStop,
  onTimeChange,
}) {
  const [isRecording, setIsRecording] = useState(false);

  const isActiveRef = useRef(false);
  const holdSourceRef = useRef(null);
  const timeoutRef = useRef(null);
  const isBusyRef = useRef(false);
  const canvasRef = useRef(null);

  // The loop is long-lived; read caller options through a ref so a run started
  // before a prop changed still sees the current value.
  const optionsRef = useRef({ mirrored, stepThroughFile, onSample, onStop, onTimeChange });
  useEffect(() => {
    optionsRef.current = { mirrored, stepThroughFile, onSample, onStop, onTimeChange };
  }, [mirrored, stepThroughFile, onSample, onStop, onTimeChange]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    holdSourceRef.current = null;
    setIsRecording(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const { onStop: notifyStop } = optionsRef.current;
    if (notifyStop) notifyStop();
  }, []);

  const captureOnce = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || isBusyRef.current) return;

    isBusyRef.current = true;
    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;

      const { mirrored: isMirrored, onSample: emit } = optionsRef.current;
      const blob = await captureVideoFrame(video, canvas, { mirrored: isMirrored });

      if (blob && emit) {
        emit({ id: buildSampleId(), previewUrl: URL.createObjectURL(blob), blob });
      }
    } finally {
      isBusyRef.current = false;
    }
  }, [videoRef]);

  const start = useCallback((event, source = HOLD_POINTER) => {
    if (event) event.preventDefault();

    stop();
    isActiveRef.current = true;
    holdSourceRef.current = source;
    setIsRecording(true);

    const runLoop = async () => {
      if (!isActiveRef.current) return;

      const cycleStart = performance.now();
      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        timeoutRef.current = setTimeout(runLoop, CAPTURE_INTERVAL_MS);
        return;
      }

      await captureOnce();
      if (!isActiveRef.current) return;

      // An uploaded file has no live feed to sample, so walk the timeline.
      const { stepThroughFile: stepping, onTimeChange: reportTime } = optionsRef.current;
      if (stepping) {
        const total = video.duration || 0;
        const nextTime = Math.min((video.currentTime || 0) + UPLOAD_FRAME_STEP_SECONDS, total);

        if (reportTime) reportTime(nextTime);
        await seekTo(video, nextTime);
        if (!isActiveRef.current) return;

        if (nextTime >= total) {
          stop();
          return;
        }
      }

      const elapsed = performance.now() - cycleStart;
      timeoutRef.current = setTimeout(runLoop, Math.max(0, CAPTURE_INTERVAL_MS - elapsed));
    };

    runLoop();
  }, [captureOnce, stop, videoRef]);

  const toggle = useCallback(() => {
    if (isActiveRef.current) {
      stop();
      return;
    }
    start(undefined, HOLD_KEY);
  }, [start, stop]);

  const stopFromPointer = useCallback((event) => {
    if (holdSourceRef.current !== HOLD_POINTER) return;
    if (event) event.preventDefault();
    stop();
  }, [stop]);

  /** Spread onto the hold-to-record button. */
  const holdHandlers = useMemo(() => ({
    onMouseDown: start,
    onMouseUp: stopFromPointer,
    onMouseLeave: stopFromPointer,
    onTouchStart: start,
    onTouchEnd: stopFromPointer,
    onTouchCancel: stopFromPointer,
  }), [start, stopFromPointer]);

  useEffect(() => () => {
    isActiveRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { isRecording, start, stop, toggle, holdHandlers };
}
