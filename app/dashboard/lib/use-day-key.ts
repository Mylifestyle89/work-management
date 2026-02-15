import { useEffect, useState } from "react";

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const useDayKey = () => {
  const [todayKey, setTodayKey] = useState(getTodayKey);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextDayKey = getTodayKey();
      setTodayKey((prev) => (prev === nextDayKey ? prev : nextDayKey));
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return todayKey;
};
