import { useEffect, useState } from "react";
import {
  type MonthlyTargetValues,
  type OutstandingExtras,
  type TargetValues,
  defaultMonthlyTargets,
  defaultOutstandingExtras,
  defaultTargets,
  MONTHLY_TARGETS_STORAGE_KEY,
  OUTSTANDING_EXTRAS_STORAGE_KEY,
  TARGETS_STORAGE_KEY,
} from "@/lib/dashboard/types";

export const useDashboardTargetSettings = () => {
  const [targetValues, setTargetValues] = useState<TargetValues>(defaultTargets);
  const [monthlyTargets, setMonthlyTargets] =
    useState<MonthlyTargetValues>(defaultMonthlyTargets);
  const [outstandingExtras, setOutstandingExtras] =
    useState<OutstandingExtras>(defaultOutstandingExtras);

  useEffect(() => {
    const savedTargets = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!savedTargets) return;
    try {
      const parsed = JSON.parse(savedTargets) as TargetValues;
      if (
        typeof parsed?.outstanding === "number" &&
        typeof parsed?.mobilized === "number" &&
        typeof parsed?.serviceFee === "number"
      ) {
        setTargetValues(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targetValues));
  }, [targetValues]);

  useEffect(() => {
    const savedMonthlyTargets = localStorage.getItem(MONTHLY_TARGETS_STORAGE_KEY);
    if (!savedMonthlyTargets) return;
    try {
      const parsed = JSON.parse(savedMonthlyTargets) as MonthlyTargetValues;
      if (
        typeof parsed?.outstanding === "number" &&
        typeof parsed?.mobilized === "number" &&
        typeof parsed?.serviceFee === "number"
      ) {
        setMonthlyTargets(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      MONTHLY_TARGETS_STORAGE_KEY,
      JSON.stringify(monthlyTargets)
    );
  }, [monthlyTargets]);

  useEffect(() => {
    const saved = localStorage.getItem(OUTSTANDING_EXTRAS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as OutstandingExtras;
      if (
        typeof parsed?.startOfDay === "number" &&
        typeof parsed?.startOfMonth === "number"
      ) {
        setOutstandingExtras({
          ...defaultOutstandingExtras,
          ...parsed,
          startOfYear:
            typeof parsed.startOfYear === "number" ? parsed.startOfYear : 0,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      OUTSTANDING_EXTRAS_STORAGE_KEY,
      JSON.stringify(outstandingExtras)
    );
  }, [outstandingExtras]);

  return {
    targetValues,
    setTargetValues,
    monthlyTargets,
    setMonthlyTargets,
    outstandingExtras,
    setOutstandingExtras,
  };
};
