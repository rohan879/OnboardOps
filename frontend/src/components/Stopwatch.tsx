'use client';

import { useEffect, useState, useMemo } from 'react';
import { differenceInMilliseconds } from 'date-fns';

interface StopwatchProps {
  startedAt?: Date | null;
  endedAt?: Date | null;
  isRunning?: boolean;
  className?: string;
}

export function Stopwatch({
  startedAt,
  endedAt,
  isRunning = true,
  className = '',
}: StopwatchProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isRunning]);

  const elapsed = useMemo(() => {
    if (!startedAt) return '00:00.0';

    const comparisonTime = isRunning ? now : endedAt || now;
    const ms = Math.max(0, differenceInMilliseconds(comparisonTime, startedAt));
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }, [endedAt, isRunning, now, startedAt]);

  return (
    <div className={`font-mono text-2xl font-semibold ${className}`}>
      {elapsed}
    </div>
  );
}

// Made with Bob
