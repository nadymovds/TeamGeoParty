import React, { useEffect, useState } from "react";

interface TimerProps {
  endTime: number; // timestamp in milliseconds
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpire?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [endTime, onExpire, isExpired]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= 30000; // 30 seconds

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-mono font-bold ${
        isWarning
          ? 'bg-red-100 text-red-800 border-2 border-red-500 animate-pulse'
          : 'bg-blue-100 text-blue-800 border-2 border-blue-500'
      }`}
    >
      <span className="mr-1">⏱️</span>
      {formatTime(timeLeft)}
    </div>
  );
};