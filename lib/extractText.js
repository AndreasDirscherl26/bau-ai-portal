import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export async function extractText({ filename, buffer }) {
  const lower = (filename || "").toLowerCase();

  if (lower.endsWith(".pdf")) {
    const data = await pdf(buffer);
    return data.text || "";
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (lower.endsWith(".xlsx")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    let out = "";
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      out += `\n# Sheet: ${sheetName}\n` + rows.map((r) => r.join("\t")).join("\n");
    }
    return out;
  }

  return "";
}
