import React from "react";
import "./VideoStage.css";

/**
 * The <video> element plus its scrubber and close button.
 *
 * `mirrored` only styles the preview. The matching flip for saved frames is
 * applied on the capture canvas — see lib/canvas.js.
 */
export default function VideoStage({
  videoRef,
  isOpen,
  mirrored,
  showTimeline,
  currentTime,
  duration,
  onSeek,
  onClose,
}) {
  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className={`${isOpen ? "show" : ""} ${mirrored ? "mirror-view" : ""}`.trim()}
        playsInline
        preload="metadata"
      />

      <input
        type="range"
        className={`video-timeline ${showTimeline ? "show" : ""}`}
        min="0"
        max={duration}
        value={currentTime}
        step="0.01"
        onChange={(event) => onSeek(parseFloat(event.target.value || "0"))}
      />

      <button className={`close-video-btn ${isOpen ? "show" : ""}`} onClick={onClose}>
        X
      </button>
    </div>
  );
}
