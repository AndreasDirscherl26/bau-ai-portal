import { getToken } from "next-auth/jwt";

const demo = process.env.DEMO_MODE === 'true';

function demoEvents() {
  const now = Date.now();
  return [
    { id: "e1", subject: "Jour Fixe – Projekt A", start: { dateTime: new Date(now+3600*1000).toISOString() }, end: { dateTime: new Date(now+2*3600*1000).toISOString() }, location: { displayName: "Teams" }, webLink: "#" },
    { id: "e2", subject: "Begehung – Rohbau", start: { dateTime: new Date(now+2*86400*1000).toISOString() }, end: { dateTime: new Date(now+2*86400*1000+90*60000).toISOString() }, location: { displayName: "Baustelle" }, webLink: "#" },
  ];
}

export default async function handler(req, res) {
  if (demo) {
    return res.status(200).json({ items: demoEvents(), mode: "demo" });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const start = new Date();
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView");
  url.searchParams.set("startDateTime", start.toISOString());
  url.searchParams.set("endDateTime", end.toISOString());
  url.searchParams.set("$select", "id,subject,start,end,location,webLink");
  url.searchParams.set("$orderby", "start/dateTime");

  try {
    const graphRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token.accessToken}` }
    });

    if (!graphRes.ok) {
      const text = await graphRes.text();
      return res.status(graphRes.status).json({ error: "Graph error", details: text });
    }

    const data = await graphRes.json();
    return res.status(200).json({ items: data.value || [], mode: "real" });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
