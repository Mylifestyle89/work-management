import * as XLSX from "xlsx";
import type { Task } from "@/lib/dashboard/types";
import { formatCurrency, formatDate } from "@/lib/dashboard/utils";

export const exportTasksToExcel = (tasks: Task[]) => {
  const headers = [
    "Tiêu đề",
    "Ô",
    "Loại",
    "Ghi chú",
    "Hạn",
    "Giải ngân",
    "Phí DV",
    "Thu nợ",
    "Huy động",
    "Trạng thái",
    "Hoàn thành",
    "Lưu trữ",
    "Tạo lúc",
  ];
  const rows = tasks.map((task) => [
    task.title,
    task.quadrant,
    task.type,
    task.note ?? "",
    task.deadline ? formatDate(task.deadline) : "",
    task.amountDisbursement != null ? formatCurrency(task.amountDisbursement) : "",
    task.serviceFee != null ? formatCurrency(task.serviceFee) : "",
    task.amountRecovery != null ? formatCurrency(task.amountRecovery) : "",
    task.amountMobilized != null ? formatCurrency(task.amountMobilized) : "",
    task.completed ? "Hoàn thành" : "Đang xử lý",
    task.completedAt ? formatDate(task.completedAt) : "",
    task.archivedAt ? formatDate(task.archivedAt) : "",
    formatDate(task.createdAt),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Công việc");
  const fileName = `cong-viec-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportTasksToPdf = (tasks: Task[]) => {
  const printableRows = tasks
    .map(
      (task) => `
          <tr>
            <td>${task.title}</td>
            <td>${task.type}</td>
            <td>${task.quadrant}</td>
            <td>${task.note ?? "-"}</td>
            <td>${task.deadline ? formatDate(task.deadline) : "-"}</td>
            <td>${formatDate(task.createdAt)}</td>
            <td>${task.amountDisbursement ? formatCurrency(task.amountDisbursement) : "-"}</td>
            <td>${task.serviceFee ? formatCurrency(task.serviceFee) : "-"}</td>
            <td>${task.amountRecovery ? formatCurrency(task.amountRecovery) : "-"}</td>
            <td>${task.amountMobilized ? formatCurrency(task.amountMobilized) : "-"}</td>
          </tr>
        `
    )
    .join("");
  const html = `
      <html>
        <head>
          <title>Danh sách công việc</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Danh sách công việc (${formatDate(new Date())})</h1>
          <table>
            <thead>
              <tr>
                <th>Tên công việc</th>
                <th>Loại nghiệp vụ</th>
                <th>Ma trận</th>
                <th>Ghi chú</th>
                <th>Deadline</th>
                <th>Ngày tạo</th>
                <th>Giải ngân</th>
                <th>Phí dịch vụ</th>
                <th>Thu nợ</th>
                <th>Huy động vốn</th>
              </tr>
            </thead>
            <tbody>
              ${printableRows || "<tr><td colspan='10'>Chưa có dữ liệu.</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
