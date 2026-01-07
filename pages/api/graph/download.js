import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    // NextAuth JWT (Entra/Azure AD)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = token?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated (missing access token)" });
    }

    // Microsoft Graph: download driveItem content
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(id)}/content`;

    const graphResp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "follow",
    });

    if (!graphResp.ok) {
      const txt = await graphResp.text();
      return res.status(graphResp.status).send(txt);
    }

    // pass-through headers
    const contentType = graphResp.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = graphResp.headers.get("content-disposition");

    res.setHeader("Content-Type", contentType);
    if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);

    const arrayBuffer = await graphResp.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
