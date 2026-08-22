import React from "react";
import SampleThumb from "./SampleThumb";

export default function SampleGrid({ samples, onOpen, onRemove }) {
  return (
    <div className="samples-preview">
      {samples.map((sample, index) => (
        <SampleThumb
          key={sample.id}
          sample={sample}
          index={index}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
