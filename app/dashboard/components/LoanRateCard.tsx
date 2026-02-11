import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, FileUp, PencilLine } from "lucide-react";
import * as XLSX from "xlsx";

type RateRow = {
  label: string;
  values: string[];
};

type RateSection = {
  title: string;
  subtitle?: string;
  tiers: string[];
  lsSan?: string;
  ftp?: string;
  rows: RateRow[];
};

type RateTable = {
  effectiveDate?: string;
  sections: RateSection[];
};

const STORAGE_KEY = "loan_rates_khcn_v1";

const parseCsv = (content: string): RateTable => {
  const sanitizeText = (value: string) =>
    value.replace(/;+/g, "").replace(/\s+/g, " ").trim();

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => sanitizeText(line).length > 0);

  const sections: RateSection[] = [];
  let currentTitle = "";
  let currentSection: RateSection | null = null;
  let currentTierLabels: string[] = [];
  let effectiveDate: string | undefined;

  const commitSection = () => {
    if (currentSection) sections.push(currentSection);
  };

  const startSection = (subtitle?: string) => {
    commitSection();
    currentSection = {
      title: currentTitle,
      subtitle,
      tiers: [],
      rows: [],
    };
    currentTierLabels = [];
  };

  lines.forEach((line) => {
    const cleanLine = sanitizeText(line);
    if (cleanLine.includes("Áp dụng từ")) {
      const match = cleanLine.match(/\d{2}\/\d{2}\/\d{4}/);
      if (match) effectiveDate = match[0];
      return;
    }

    if (/^[IVX]+\./.test(cleanLine)) {
      currentTitle = cleanLine;
      startSection();
      return;
    }

    if (/^(1\.\d+|\*)/.test(cleanLine)) {
      if (!currentTitle) return;
      startSection(cleanLine);
      return;
    }

    const parts = line.split(";").map((part) => part.trim());
    if (parts.length <= 1) return;

    if (parts.some((part) => part.toLowerCase().includes("ls sàn"))) {
      currentTierLabels = parts.filter(
        (part) =>
          part.includes("tỷ") || part.toLowerCase().includes("không phân biệt")
      );
      if (currentSection) {
        currentSection.tiers = currentTierLabels;
      }
      return;
    }

    if (!currentSection || currentTierLabels.length === 0) return;

    const tierCount = currentTierLabels.length;
    const tail = parts.slice(-tierCount);

    if (parts[0].toLowerCase().startsWith("nim")) {
      currentSection.rows.push({ label: "NIM.DN", values: tail });
      return;
    }

    const lsSanValue = parts[0];
    const ftpValue = parts[1];
    currentSection.lsSan = lsSanValue || currentSection.lsSan;
    currentSection.ftp = ftpValue || currentSection.ftp;
    currentSection.rows.push({ label: "LSCV", values: tail });
  });

  commitSection();

  return {
    effectiveDate,
    sections: sections.filter((section) => section.rows.length > 0),
  };
};

export function LoanRateCard() {
  const [table, setTable] = useState<RateTable>({ sections: [] });
  const [showInput, setShowInput] = useState(false);
  const [manualCsv, setManualCsv] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as RateTable;
      if (parsed?.sections?.length) setTable(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!table.sections.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(table));
  }, [table]);

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv")) {
      const text = await file.text();
      setTable(parseCsv(text));
      return;
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
      setTable(parseCsv(csv));
    }
  };

  const handleManualSubmit = () => {
    if (!manualCsv.trim()) return;
    setTable(parseCsv(manualCsv));
    setManualCsv("");
    setShowInput(false);
  };

  const displaySections = useMemo(() => table.sections, [table.sections]);

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Lãi suất cho vay KHCN
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-200">
            {table.effectiveDate
              ? `Áp dụng từ ${table.effectiveDate}`
              : "Cập nhật từ Excel/CSV hoặc nhập tay"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            aria-label="Import Excel hoặc CSV lãi suất"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileUp className="h-4 w-4" />
            Import Excel/CSV
          </button>
          <button
            type="button"
            onClick={() => setShowInput((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <PencilLine className="h-4 w-4" />
            Nhập tay (CSV)
          </button>
        </div>
      </div>

      {showInput && (
        <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200">
            Dán CSV định dạng như mẫu
          </label>
          <textarea
            value={manualCsv}
            onChange={(e) => setManualCsv(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Dán nội dung CSV tại đây..."
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleManualSubmit}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
            >
              Cập nhật
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setManualCsv("");
              }}
              className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 max-h-[420px] space-y-5 overflow-y-auto pr-1">
        {displaySections.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            Chưa có dữ liệu lãi suất. Vui lòng import file hoặc nhập tay.
          </div>
        )}
        {displaySections.map((section) => (
          <div key={`${section.title}-${section.subtitle ?? ""}`}>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-200">
                  {section.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-200">
                {section.lsSan && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">
                    LS sàn: {section.lsSan}
                  </span>
                )}
                {section.ftp && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">
                    FTP: {section.ftp}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 overflow-auto rounded-xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-900">
              <table className="min-w-[520px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Loại</th>
                    {section.tiers.map((tier) => (
                      <th key={tier} className="px-3 py-2 font-semibold">
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr
                      key={`${row.label}-${rowIndex}`}
                      className="border-t border-slate-200/60 dark:border-slate-700"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-100">
                        {row.label}
                      </td>
                      {row.values.map((value, index) => (
                        <td key={`${row.label}-${index}`} className="px-3 py-2 text-slate-600 dark:text-slate-200">
                          {value || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-200">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Hỗ trợ import CSV/XLSX theo mẫu bảng lãi suất.
      </div>
    </section>
  );
}
