import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requirePermission } from "@/domains/rbac/guards";
import { getFinancialRevenueSummary } from "@/domains/indicators/financial";

export async function GET() {
  await requirePermission("exports.excel.create");
  const summary = await getFinancialRevenueSummary();

  const worksheet = XLSX.utils.json_to_sheet(summary.rows.map((row) => ({
    periodo: row.date.toISOString().slice(0, 10),
    receita: Number(row.revenue),
    clientes: row.customerCount
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Receitas");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=\"receitas.xlsx\""
    }
  });
}
