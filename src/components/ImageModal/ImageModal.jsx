import React, { useEffect } from "react";
import "./ImageModal.css";

export default function ImageModal({ isOpen, images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handler = (event) => {
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onPrev, onNext, onClose]);

  return (
    <div id="imgModal" className={isOpen ? "show" : ""}>
      <span className="close-btn" onClick={onClose}>
        &times;
      </span>
      <div className="nav-btn prev-btn" onClick={onPrev}>
        &#10094;
      </div>
      <div className="nav-btn next-btn" onClick={onNext}>
        &#10095;
      </div>
      <img src={images[index] || ""} alt="preview" />
    </div>
  );
}
