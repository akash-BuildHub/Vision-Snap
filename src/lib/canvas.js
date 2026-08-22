import { JPEG_QUALITY, MAX_CAPTURE_DIMENSION } from "../config/capture";

/**
 * Capture size for a video, clamped so the longest edge never exceeds
 * MAX_CAPTURE_DIMENSION. Aspect ratio is preserved.
 */
export function getTargetCaptureSize(video) {
  const sourceWidth = video.videoWidth || 640;
  const sourceHeight = video.videoHeight || 480;
  const maxSide = Math.max(sourceWidth, sourceHeight);

  if (maxSide <= MAX_CAPTURE_DIMENSION) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = MAX_CAPTURE_DIMENSION / maxSide;
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

/**
 * Draw the video's current frame onto `canvas` and encode it as a JPEG blob.
 *
 * The webcam preview is mirrored with CSS, but a CSS transform never reaches
 * the pixels drawImage reads. Pass `mirrored` so the same flip is baked into
 * the saved sample and the preview and the stored image agree.
 */
export async function captureVideoFrame(video, canvas, { mirrored = false } = {}) {
  const { width, height } = getTargetCaptureSize(video);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (mirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
}
