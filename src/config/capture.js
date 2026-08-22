// Every tunable that controls how frames are sampled lives here, so the
// capture pipeline can be retuned without touching component code.

/** Delay between two frame grabs while recording. */
export const CAPTURE_INTERVAL_MS = 80;

/** How far to advance an uploaded video between grabs. */
export const UPLOAD_FRAME_STEP_SECONDS = 0.08;

/** Longest edge of a stored sample; larger frames are scaled down. */
export const MAX_CAPTURE_DIMENSION = 1024;

/** JPEG quality used when encoding a captured frame. */
export const JPEG_QUALITY = 0.82;

/** Give up waiting for a `seeked` event after this long. */
export const SEEK_TIMEOUT_MS = 140;

/** Hold new samples this long before committing them to React state. */
export const SAMPLE_FLUSH_DELAY_MS = 160;

/** Commit early once this many samples are buffered. */
export const MAX_PENDING_SAMPLES = 4;

/** Resolution requested from getUserMedia. */
export const WEBCAM_CONSTRAINTS = { video: { width: 640, height: 480 } };
