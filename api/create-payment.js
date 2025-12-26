function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS,GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function toMoney2(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

export default async function handler(req, res) {
  cors(res);

  try {
    // ✅ Quick health check in browser
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        has_FYGARO_LINK_BASE: !!process.env.FYGARO_LINK_BASE,
        has_SUPABASE_URL: !!process.env.SUPABASE_URL,
        has_SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      });
    }

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const FYGARO_LINK_BASE = process.env.FYGARO_LINK_BASE;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!FYGARO_LINK_BASE) return res.status(500).json({ error: "Missing FYGARO_LINK_BASE" });
    if (!SUPABASE_URL) return res.status(500).json({ error: "Missing SUPABASE_URL" });
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Missing SUPABASE_SERVICE_KEY" });

    // Validate link base early
    let baseUrl;
    try {
      baseUrl = new URL(FYGARO_LINK_BASE);
    } catch {
      return res.status(500).json({ error: "FYGARO_LINK_BASE is not a valid URL", value: FYGARO_LINK_BASE });
    }

    const { amount, currency = "XCD", service_name = "Service", description = "" } = req.body || {};
    const amt = toMoney2(amount);
    if (!amt) return res.status(400).json({ error: "Invalid amount" });

    const client_reference = `order_${Date.now()}`;

    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        client_reference,
        service_name,
        description,
        amount: Number(amt),
        currency,
        status: "pending",
      }),
    });

    if (!insertResp.ok) {
      const t = await insertResp.text();
      return res.status(500).json({ error: "Supabase insert failed", details: t });
    }

    baseUrl.searchParams.set("amount", amt);
    baseUrl.searchParams.set("client_note", description || service_name);
    baseUrl.searchParams.set("client_reference", client_reference);

    return res.status(200).json({ paymentUrl: baseUrl.toString(), client_reference });
  } catch (e) {
    // ✅ This prevents the Vercel "crashed" screen
    return res.status(500).json({
      error: "Unhandled server error",
      message: e?.message || String(e),
      stack: e?.stack || null,
    });
  }
}
