import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const headers = ["Name", "Type", "Date", "Time", "Duration", "Location", "Confirmation", "Notes"];
  const sampleRow = ["Flight to Paris", "Flight", "2025-07-01", "09:00", "2h30m", "CDG Airport", "ABC123", "Window seat"];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");

  // Set column widths
  ws["!cols"] = headers.map(() => ({ wch: 18 }));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=tripwise-import-template.xlsx",
    },
  });
}
