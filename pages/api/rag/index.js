import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { extractText } from "../../../lib/extractText";
import { chunkText } from "../../../lib/chunkText";
import { embedTexts, vectorString } from "../../../lib/embed";

async function fetchJson(url, headers) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`Fetch failed (${r.status}): ${await r.text()}`);
  return r.json();
}

async function fetchBuffer(url, headers) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`Download failed (${r.status}): ${await r.text()}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { projectId = "default", maxFiles = 50 } = req.body || {};
    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) return res.status(500).json({ ok: false, error: "NEXTAUTH_URL missing in ENV" });

    const headers = { cookie: req.headers.cookie || "" };

    const filesResp = await fetchJson(`${baseUrl}/api/graph/files`, headers);
    const items = filesResp?.items || filesResp || [];
    const candidates = items
      .filter((f) => f?.id && f?.name && /\.(pdf|docx|xlsx)$/i.test(f.name))
      .slice(0, Number(maxFiles));

    let indexed = 0;
    const details = [];

    for (const f of candidates) {
      const id = f.id;
      const name = f.name;
      const webUrl = f.webUrl || f.web_url || null;
      const lastModifiedDateTime = f.lastModifiedDateTime || f.last_modified || null;

      const { data: docRows, error: docErr } = await supabaseAdmin
        .from("rag_documents")
        .upsert(
          {
            drive_item_id: id,
            name,
            web_url: webUrl,
            project_id: projectId,
            last_modified: lastModifiedDateTime,
          },
          { onConflict: "drive_item_id" }
        )
        .select("id")
        .limit(1);

      if (docErr) throw docErr;
      const documentId = docRows?.[0]?.id;
      if (!documentId) throw new Error("Upsert rag_documents returned no id");

      await supabaseAdmin.from("rag_chunks").delete().eq("document_id", documentId);

      const buffer = await fetchBuffer(`${baseUrl}/api/graph/download?id=${encodeURIComponent(id)}`, headers);

      const text = await extractText({ filename: name, buffer });
      const chunks = chunkText(text);

      if (chunks.length === 0) {
        details.push({ name, chunks: 0, note: "No text extracted" });
        indexed++;
        continue;
      }

      const BATCH = 64;
      let inserted = 0;

      for (let start = 0; start < chunks.length; start += BATCH) {
        const slice = chunks.slice(start, start + BATCH);
        const embeddings = await embedTexts(slice);

        const rows = slice.map((content, i) => ({
          document_id: documentId,
          chunk_index: start + i,
          content,
          embedding: vectorString(embeddings[i]),
          metadata: { name, webUrl, driveItemId: id, projectId },
        }));

        const { error: chunkErr } = await supabaseAdmin.from("rag_chunks").insert(rows);
        if (chunkErr) throw chunkErr;

        inserted += rows.length;
      }

      details.push({ name, chunks: inserted });
      indexed++;
    }

    return res.status(200).json({ ok: true, indexed, details });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
