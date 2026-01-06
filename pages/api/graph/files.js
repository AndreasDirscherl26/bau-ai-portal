import { getToken } from "next-auth/jwt";

const demo = process.env.DEMO_MODE === 'true';

function demoFiles() {
  return [
    { id: "1", name: "A-321_Grundriss_EG_IndexC.pdf", type: "Plan (PDF)", size: 2487341, lastModifiedDateTime: new Date().toISOString(), webUrl: "#" },
    { id: "2", name: "LV_Trockenbau_v2.xlsx", type: "LV (Excel)", size: 892341, lastModifiedDateTime: new Date(Date.now()-86400000).toISOString(), webUrl: "#" },
    { id: "3", name: "Baubesprechung_Protokoll_2026-01-05.docx", type: "Protokoll (Word)", size: 145231, lastModifiedDateTime: new Date(Date.now()-2*86400000).toISOString(), webUrl: "#" },
  ];
}

export default async function handler(req, res) {
  if (demo) {
    return res.status(200).json({ items: demoFiles(), mode: "demo" });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,size,folder,file,lastModifiedDateTime,webUrl", {
      headers: { Authorization: `Bearer ${token.accessToken}` }
    });

    if (!graphRes.ok) {
      const text = await graphRes.text();
      return res.status(graphRes.status).json({ error: "Graph error", details: text });
    }

    const data = await graphRes.json();
    const items = (data.value || []).map((x) => ({
      id: x.id,
      name: x.name,
      size: x.size,
      lastModifiedDateTime: x.lastModifiedDateTime,
      webUrl: x.webUrl,
      type: x.folder ? "Ordner" : (x.file ? "Datei" : "Item"),
    }));

    return res.status(200).json({ items, mode: "real" });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
