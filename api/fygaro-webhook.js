import fetch from "node-fetch";

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).send("Missing Supabase env vars");

  const raw = await readRaw(req);

  let body;
  try { body = JSON.parse(raw); } catch { return res.status(400).send("Invalid JSON"); }

  const client_reference =
    body.client_reference || body.clientReference || body.client_ref || body.custom_reference || body.customReference;

  if (!client_reference) return res.status(200).json({ ok: true, note: "No client_reference found" });

  const statusRaw = (body.status || body.payment_status || body.state || "").toString().toLowerCase();
  const isPaid = statusRaw.includes("paid") || statusRaw.includes("success") || statusRaw.includes("completed") || statusRaw === "";
  const newStatus = isPaid ? "paid" : "failed";

  const fygaro_reference = body.reference || body.transactionId || body.transaction_id || null;

  const updateResp = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?client_reference=eq.${encodeURIComponent(client_reference)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ status: newStatus, fygaro_reference, updated_at: new Date().toISOString() })
    }
  );

  if (!updateResp.ok) return res.status(500).send(await updateResp.text());

  return res.status(200).json({ ok: true });
}
