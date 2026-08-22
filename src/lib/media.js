import { SEEK_TIMEOUT_MS } from "../config/capture";

/**
 * Seek a video and resolve once the frame is ready.
 *
 * Resolves on `seeked`, on `error`, or after SEEK_TIMEOUT_MS — a stalled seek
 * must not wedge the capture loop, so the timeout is a feature, not a guard.
 */
export function seekTo(video, targetTime) {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = null;

    const finalize = () => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      video.removeEventListener("seeked", finalize);
      video.removeEventListener("error", finalize);
      resolve();
    };

    timeoutId = setTimeout(finalize, SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", finalize, { once: true });
    video.addEventListener("error", finalize, { once: true });
    video.currentTime = targetTime;
  });
}
