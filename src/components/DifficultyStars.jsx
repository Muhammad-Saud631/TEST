import React from "react";

export default function DifficultyStars({ value = 1 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24">
          <path fill={i < value ? "#ffb046" : "#e6e9ec"} d="M12 .587l3.668 7.431L23.6 9.168l-6 5.85L19.335 24 12 19.897 4.665 24 6.4 15.018 0.4 9.168l7.932-1.15z"/>
        </svg>
      ))}
    </div>
  );
}
