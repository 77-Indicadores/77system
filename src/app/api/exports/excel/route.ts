import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requirePermission } from "@/domains/rbac/guards";
import { getFinancialRevenueSummary } from "@/domains/indicators/financial";

/** GET /api/exports/excel — exports the current financial summary directly */
export async function GET() {
  await requirePermission("exports.excel.create");

  const summary = await getFinancialRevenueSummary();
  const rows = summary.rows.map((row) => ({
    Competência: row.date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    "Receita (R$)": Number(row.revenue),
    Clientes: row.customerCount,
    "Atualizado em": row.updatedAt.toLocaleString("pt-BR"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Receita");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="receita-${new Date().getFullYear()}.xlsx"`,
    },
  });
}

/**
 * POST /api/exports/excel
 * Body: { rows: Record<string, unknown>[], filename?: string, sheetName?: string }
 *
 * For client-side filtered exports (e.g. drill modals), use src/lib/export-utils.ts instead.
 */
export async function POST(request: Request) {
  await requirePermission("exports.excel.create");

  const body = await request.json().catch(() => ({})) as {
    rows?: Record<string, unknown>[];
    filename?: string;
    sheetName?: string;
  };

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "Campo 'rows' obrigatório e não pode estar vazio" }, { status: 400 });
  }

  const sheetName = typeof body.sheetName === "string" ? body.sheetName.slice(0, 31) : "Dados";
  const filename = typeof body.filename === "string" ? body.filename : "export.xlsx";
  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;

  const worksheet = XLSX.utils.json_to_sheet(body.rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
    },
  });
}
