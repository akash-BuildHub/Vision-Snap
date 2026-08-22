import React, { memo } from "react";

/**
 * Memoised: a recording session appends samples several times a second, and
 * every already-rendered thumb would otherwise re-render on each batch.
 */
const SampleThumb = memo(function SampleThumb({ sample, index, onOpen, onRemove }) {
  return (
    <div className="sample-item">
      <img
        src={sample.previewUrl}
        alt={`sample-${index + 1}`}
        loading="lazy"
        decoding="async"
        onClick={() => onOpen(index)}
      />
      <button className="remove-img-btn" onClick={() => onRemove(index)}>
        X
      </button>
    </div>
  );
});

export default SampleThumb;
