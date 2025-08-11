import React, { useEffect, useState } from "react";

export default function Timer({ initial = 45, onTimeout = () => {} }) {
  const [time, setTime] = useState(initial);

  useEffect(() => { setTime(initial); }, [initial]);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onTimeout]);

  return <div style={{ color: "#2d3b34", fontWeight: 600 }}>{time < 10 ? `0${time}` : time}</div>;
}
