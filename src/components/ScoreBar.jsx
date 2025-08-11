import React from "react";

export default function ScoreBar({ min=0, current=0, max=0 }) {
  const clampedMin = Math.max(0, Math.min(100, min));
  const clampedCurrent = Math.max(clampedMin, Math.min(100, current));
  const clampedMax = Math.max(clampedCurrent, Math.min(100, max));

  const red = clampedMin;
  const yellow = clampedCurrent - clampedMin;
  const green = clampedMax - clampedCurrent;
  const rest = 100 - clampedMax;

  return (
    <div className="progress-rail">
      <div className="progress-inner">
        <div className="seg-red" style={{ width: `${red}%` }} />
        <div className="seg-yellow" style={{ width: `${yellow}%` }} />
        <div className="seg-green" style={{ width: `${green}%` }} />
        <div style={{ width: `${rest}%`, background: "transparent" }} />
      </div>
    </div>
  );
}
