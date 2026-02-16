import { useEffect } from "react";
import {
  type OutstandingExtras,
  OUTSTANDING_PREVIOUS_DAY_KEY,
} from "@/lib/dashboard/types";

type UseOutstandingRolloverParams = {
  startOfDay: number;
  todayKey: string;
  dayNetOutstanding: number;
  setOutstandingExtras: React.Dispatch<React.SetStateAction<OutstandingExtras>>;
};

export const useOutstandingRollover = ({
  startOfDay,
  todayKey,
  dayNetOutstanding,
  setOutstandingExtras,
}: UseOutstandingRolloverParams) => {
  // Nếu user chưa nhập Dư nợ đầu ngày, tự động dùng Dư nợ thuần của ngày trước (nếu có lưu)
  useEffect(() => {
    if (startOfDay !== 0) return;
    try {
      const saved = localStorage.getItem(OUTSTANDING_PREVIOUS_DAY_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        date?: string;
        outstanding?: number;
      };
      if (
        parsed &&
        typeof parsed.outstanding === "number" &&
        parsed.date &&
        parsed.date !== todayKey
      ) {
        setOutstandingExtras((prev) => ({
          ...prev,
          startOfDay: parsed.outstanding ?? prev.startOfDay,
        }));
      }
    } catch {
      // ignore
    }
  }, [setOutstandingExtras, startOfDay, todayKey]);

  // Luôn lưu lại Dư nợ thuần cuối ngày để dùng làm Dư nợ đầu ngày cho ngày tiếp theo.
  // Chỉ cộng biến động trong ngày để tránh cộng lặp phần luy ke theo thang.
  useEffect(() => {
    const outstandingToday = startOfDay + dayNetOutstanding;
    if (!Number.isFinite(outstandingToday)) return;
    try {
      localStorage.setItem(
        OUTSTANDING_PREVIOUS_DAY_KEY,
        JSON.stringify({
          date: todayKey,
          outstanding: outstandingToday,
        })
      );
    } catch {
      // ignore
    }
  }, [dayNetOutstanding, startOfDay, todayKey]);
};
