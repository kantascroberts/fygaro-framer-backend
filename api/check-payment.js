import fetch from "node-fetch";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Missing Supabase env vars" });

  const { client_reference } = req.query;
  if (!client_reference) return res.status(400).json({ error: "Missing client_reference" });

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?client_reference=eq.${encodeURIComponent(client_reference)}&select=*`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );

  const rows = await resp.json();
  return res.status(200).json({ order: rows?.[0] || null });
}
