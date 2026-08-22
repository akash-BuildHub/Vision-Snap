import React, { useRef } from "react";
import { useOutsideDismiss } from "../../hooks/useOutsideDismiss";

export default function ClassBoxMenu({
  isOpen,
  hasSamples,
  onToggle,
  onDismiss,
  onDeleteClass,
  onClearSamples,
  onDownloadSamples,
}) {
  const menuRef = useRef(null);

  useOutsideDismiss(menuRef, isOpen, onDismiss);

  return (
    <div
      className="menu"
      ref={menuRef}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      &#8942;
      <div className={`menu-options ${isOpen ? "show" : ""}`}>
        <div onClick={onDeleteClass}>Delete class</div>
        <div className={hasSamples ? "" : "disabled-option"} onClick={onClearSamples}>
          Remove All Samples
        </div>
        <div className={hasSamples ? "" : "disabled-option"} onClick={onDownloadSamples}>
          Download Samples
        </div>
      </div>
    </div>
  );
}
