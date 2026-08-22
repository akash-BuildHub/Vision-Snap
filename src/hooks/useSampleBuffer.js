import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PENDING_SAMPLES, SAMPLE_FLUSH_DELAY_MS } from "../config/capture";

/**
 * Owns a class's samples and the object URLs behind their previews.
 *
 * Recording produces a frame every ~80ms; committing each one straight to
 * state would re-render the grid dozens of times a second. New samples are
 * buffered in a ref and flushed in batches — on a short timer, or immediately
 * once MAX_PENDING_SAMPLES have piled up.
 *
 * Every exit path revokes its object URLs; leaking them keeps whole decoded
 * frames alive for the lifetime of the tab.
 */
export function useSampleBuffer() {
  const [samples, setSamples] = useState([]);

  const samplesRef = useRef([]);
  const pendingRef = useRef([]);
  const flushTimeoutRef = useRef(null);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  const flushPending = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    const pending = pendingRef.current;
    if (pending.length === 0) return;

    pendingRef.current = [];
    setSamples((prev) => [...prev, ...pending]);
  }, []);

  const enqueueSample = useCallback((sample) => {
    pendingRef.current.push(sample);

    if (pendingRef.current.length >= MAX_PENDING_SAMPLES) {
      flushPending();
      return;
    }

    if (!flushTimeoutRef.current) {
      flushTimeoutRef.current = setTimeout(flushPending, SAMPLE_FLUSH_DELAY_MS);
    }
  }, [flushPending]);

  /** Committed samples plus anything still buffered — for zip/export paths. */
  const getAllSamples = useCallback(() => {
    const pending = pendingRef.current;
    if (pending.length === 0) return samplesRef.current;
    return [...samplesRef.current, ...pending];
  }, []);

  const removeSampleAt = useCallback((index) => {
    flushPending();
    setSamples((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, [flushPending]);

  const clearSamples = useCallback(() => {
    flushPending();
    setSamples((prev) => {
      prev.forEach((sample) => URL.revokeObjectURL(sample.previewUrl));
      return [];
    });
  }, [flushPending]);

  useEffect(() => () => {
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    pendingRef.current.forEach((sample) => URL.revokeObjectURL(sample.previewUrl));
    samplesRef.current.forEach((sample) => URL.revokeObjectURL(sample.previewUrl));
  }, []);

  return {
    samples,
    hasSamples: samples.length > 0,
    enqueueSample,
    flushPending,
    getAllSamples,
    removeSampleAt,
    clearSamples,
  };
}
