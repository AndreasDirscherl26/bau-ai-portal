import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { embedTexts, vectorString } from "../../../lib/embed";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { query, projectId = "default", topK } = req.body || {};
    if (!query || typeof query !== "string") return res.status(400).json({ error: "Missing query" });

    const k = Number(topK || process.env.RAG_TOP_K || 8);

    const [qEmbedding] = await embedTexts([query]);
    const qVec = vectorString(qEmbedding);

    const { data, error } = await supabaseAdmin.rpc("match_rag_chunks", {
      query_embedding: qVec,
      match_count: k,
      filter_project_id: projectId,
    });

    if (error) throw error;

    return res.status(200).json({ matches: data || [] });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}

