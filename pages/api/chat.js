import OpenAI from "openai";

const demo = process.env.DEMO_MODE === 'true';

function demoAnswer(userMessage) {
  return (
`(DEMO) Antwort auf: "${userMessage}"

Vorschlag im Bau-Kontext (Beispiel):
1) Prüfe Planstand/Index + Datum.
2) Prüfe LV/Leistungsbeschreibung und Abweichungen.
3) Prüfe relevante Regeln (z.B. Brandschutz/Barrierefreiheit) anhand Projektparameter.
4) Formuliere Empfehlung + offene Punkte + benötigte Quellenstellen.

Wenn du REAL MODE aktivierst, kann die App echte OneDrive/Outlook-Daten verwenden und per OpenAI API antworten.`
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string" });
  }

  if (demo) {
    return res.status(200).json({ answer: demoAnswer(message), mode: "demo" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY missing" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const system = [
      "Du bist eine Bauwesen-KI für Projektassistenz.",
      "Arbeite strukturiert: Annahmen offenlegen, fehlende Infos nennen, keine Spekulation.",
      "Wenn du keine Quelle hast, markiere es als 'unklar' und formuliere Rückfragen.",
      "Gib praxisnahe Schritte (Checklisten, Risiko-Hinweise, Dokumentenbedarf).",
      "Wichtiger Hinweis: Du ersetzt keine rechtsverbindliche Beratung."
    ].join("\n");

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message }
      ],
      temperature: 0.2
    });

    const answer = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ answer, mode: "real" });
  } catch (e) {
    return res.status(500).json({ error: "OpenAI error", details: String(e) });
  }
}
