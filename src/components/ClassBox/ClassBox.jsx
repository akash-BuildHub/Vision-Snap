import React, { useCallback, useMemo, useRef, useState } from "react";
import ClassBoxMenu from "./ClassBoxMenu";
import SampleGrid from "./SampleGrid";
import VideoStage from "../VideoStage/VideoStage";
import { useFrameRecorder } from "../../hooks/useFrameRecorder";
import { useSampleBuffer } from "../../hooks/useSampleBuffer";
import { useSpaceShortcut } from "../../hooks/useSpaceShortcut";
import { useVideoSource } from "../../hooks/useVideoSource";
import { downloadSamplesZip } from "../../lib/archive";
import { buildSampleId } from "../../lib/id";
import "./ClassBox.css";

/**
 * One labelled class: its samples, its video source, and its recorder.
 *
 * All the machinery lives in hooks; this component only wires them together
 * and renders. `ownsShortcut` is decided by the parent, since several class
 * boxes can have a video open at once and only one may answer the Space key.
 */
export default function ClassBox({
  id,
  initialName,
  isMenuOpen,
  ownsShortcut,
  shortcutsPaused,
  onDeleteClass,
  onMenuToggle,
  onMenuDismiss,
  onOpenPreview,
  onClaimShortcut,
  onReleaseShortcut,
}) {
  const [name, setName] = useState(initialName);
  const fileInputRef = useRef(null);

  const buffer = useSampleBuffer();

  const handleSourceOpen = useCallback(() => onClaimShortcut(id), [id, onClaimShortcut]);
  const handleSourceClose = useCallback(() => onReleaseShortcut(id), [id, onReleaseShortcut]);

  const source = useVideoSource({
    onOpen: handleSourceOpen,
    onClose: handleSourceClose,
  });

  const recorder = useFrameRecorder({
    videoRef: source.videoRef,
    mirrored: source.isWebcam,
    stepThroughFile: source.isUpload,
    onSample: buffer.enqueueSample,
    onStop: buffer.flushPending,
    onTimeChange: source.setCurrentTime,
  });

  const isShortcutTarget = source.isOpen && ownsShortcut;

  useSpaceShortcut({
    enabled: isShortcutTarget && !shortcutsPaused,
    onTrigger: recorder.toggle,
  });

  const closeSource = () => {
    recorder.stop();
    source.close();
  };

  const openFilePicker = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      buffer.enqueueSample({
        id: buildSampleId(),
        previewUrl: URL.createObjectURL(file),
        blob: file,
      });
      return;
    }

    if (file.type.startsWith("video/")) {
      source.loadVideoFile(file);
    }
  };

  const clearSamples = () => {
    if (!buffer.hasSamples) return;
    buffer.clearSamples();
    onMenuDismiss();
  };

  const downloadSamples = async () => {
    if (!buffer.hasSamples) return;
    buffer.flushPending();
    await downloadSamplesZip(buffer.getAllSamples(), name);
    onMenuDismiss();
  };

  const previewUrls = useMemo(
    () => buffer.samples.map((sample) => sample.previewUrl),
    [buffer.samples]
  );

  const handleOpenSample = useCallback(
    (index) => onOpenPreview(previewUrls, index),
    [onOpenPreview, previewUrls]
  );

  return (
    <div
      className={`class-box ${isShortcutTarget ? "shortcut-active" : ""}`.trim()}
      onMouseDown={() => {
        if (source.isOpen && !ownsShortcut) onClaimShortcut(id);
      }}
    >
      <div className="class-header">
        <span
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Type class name..."
          onBlur={(event) => setName(event.currentTarget.textContent || "")}
        >
          {name}
        </span>

        <ClassBoxMenu
          isOpen={isMenuOpen}
          hasSamples={buffer.hasSamples}
          onToggle={onMenuToggle}
          onDismiss={onMenuDismiss}
          onDeleteClass={() => onDeleteClass(id)}
          onClearSamples={clearSamples}
          onDownloadSamples={downloadSamples}
        />
      </div>

      <div className="sample-label">Add image Samples:</div>

      <div className="btn-row">
        <button className="btn webcam-btn" onClick={source.startWebcam}>Webcam</button>
        <button className="btn upload-btn" onClick={openFilePicker}>Upload</button>
      </div>

      <div className={`btn-row hold-record-row ${source.isOpen ? "show" : ""}`}>
        <button
          className={`btn hold-record-btn ${recorder.isRecording ? "recording" : ""}`.trim()}
          {...recorder.holdHandlers}
        >
          {recorder.isRecording ? "Recording..." : "Hold & Record"}
        </button>
      </div>

      <div className={`space-hint ${source.isOpen ? "show" : ""}`}>
        {isShortcutTarget
          ? `Press Space to ${recorder.isRecording ? "pause" : "record"}`
          : "Click this class to control it with Space"}
      </div>

      <VideoStage
        videoRef={source.videoRef}
        isOpen={source.isOpen}
        mirrored={source.isWebcam}
        showTimeline={source.isUpload}
        currentTime={source.currentTime}
        duration={source.duration}
        onSeek={source.seek}
        onClose={closeSource}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <SampleGrid
        samples={buffer.samples}
        onOpen={handleOpenSample}
        onRemove={buffer.removeSampleAt}
      />
    </div>
  );
}
