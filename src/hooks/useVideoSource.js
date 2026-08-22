import { useCallback, useEffect, useRef, useState } from "react";
import { WEBCAM_CONSTRAINTS } from "../config/capture";

export const SOURCE_IDLE = "idle";
export const SOURCE_WEBCAM = "webcam";
export const SOURCE_UPLOAD = "upload";

/**
 * Owns the <video> element and whatever is currently feeding it.
 *
 * The source is a single mode rather than a spread of booleans, because the
 * flags it replaced could never legally disagree: a webcam feed is always live
 * and never scrubbable, an uploaded file always the reverse.
 */
export function useVideoSource({ onOpen, onClose } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [mode, setMode] = useState(SOURCE_IDLE);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const detachVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.src = "";
    video.srcObject = null;
  }, []);

  const startWebcam = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    try {
      stopStream();
      revokeObjectUrl();

      const stream = await navigator.mediaDevices.getUserMedia(WEBCAM_CONSTRAINTS);

      streamRef.current = stream;
      video.src = "";
      video.srcObject = stream;

      setMode(SOURCE_WEBCAM);
      setDuration(0);
      setCurrentTime(0);
      if (onOpen) onOpen();

      await video.play();
      return true;
    } catch (err) {
      console.error("Camera access denied or error:", err);
      alert("Unable to access camera. Check permissions or try a different browser.");
      return false;
    }
  }, [onOpen, revokeObjectUrl, stopStream]);

  const loadVideoFile = useCallback((file) => {
    const video = videoRef.current;
    if (!video) return;

    stopStream();
    revokeObjectUrl();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    video.srcObject = null;
    video.src = url;

    setMode(SOURCE_UPLOAD);
    setDuration(0);
    setCurrentTime(0);
    if (onOpen) onOpen();

    video.addEventListener("loadedmetadata", () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setCurrentTime(video.currentTime || 0);
    }, { once: true });
  }, [onOpen, revokeObjectUrl, stopStream]);

  const seek = useCallback((seconds) => {
    setCurrentTime(seconds);
    const video = videoRef.current;
    if (video) video.currentTime = seconds;
  }, []);

  const close = useCallback(() => {
    stopStream();
    revokeObjectUrl();
    detachVideo();

    setMode(SOURCE_IDLE);
    setDuration(0);
    setCurrentTime(0);
    if (onClose) onClose();
  }, [detachVideo, onClose, revokeObjectUrl, stopStream]);

  useEffect(() => () => {
    stopStream();
    revokeObjectUrl();
    detachVideo();
  }, [detachVideo, revokeObjectUrl, stopStream]);

  return {
    videoRef,
    mode,
    duration,
    currentTime,
    isOpen: mode !== SOURCE_IDLE,
    isWebcam: mode === SOURCE_WEBCAM,
    isUpload: mode === SOURCE_UPLOAD,
    startWebcam,
    loadVideoFile,
    seek,
    setCurrentTime,
    close,
  };
}
