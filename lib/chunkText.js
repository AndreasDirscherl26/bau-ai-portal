export function chunkText(text, { chunkSize = 1200, overlap = 200 } = {}) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
    if (end === clean.length) break;
  }
  return chunks;
}
