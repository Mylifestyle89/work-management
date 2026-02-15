import { useEffect } from "react";
import {
  type OutstandingExtras,
  OUTSTANDING_PREVIOUS_DAY_KEY,
} from "@/lib/dashboard/types";

type UseOutstandingRolloverParams = {
  startOfDay: number;
  todayKey: string;
  monthNetOutstanding: number;
  setOutstandingExtras: React.Dispatch<React.SetStateAction<OutstandingExtras>>;
};

export const useOutstandingRollover = ({
  startOfDay,
  todayKey,
  monthNetOutstanding,
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

  // Luôn lưu lại Dư nợ thuần hiện tại để dùng làm Dư nợ đầu ngày cho ngày tiếp theo
  useEffect(() => {
    const outstandingToday = startOfDay + monthNetOutstanding;
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
  }, [monthNetOutstanding, startOfDay, todayKey]);
};
