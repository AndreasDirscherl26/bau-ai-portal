import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function vectorString(embeddingArray) {
  return `[${embeddingArray.join(",")}]`;
}

export async function embedTexts(texts, { model } = {}) {
  const embeddingModel = model || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const resp = await openai.embeddings.create({
    model: embeddingModel,
    input: texts,
  });

  return resp.data.map((d) => d.embedding);
}
