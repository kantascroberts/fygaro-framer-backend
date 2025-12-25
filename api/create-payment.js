// /api/create-payment.js

function toMoney2(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const base = process.env.FYGARO_LINK_BASE; // This must be the Fygaro Link checkout URL
  if (!base) return res.status(500).json({ error: "Missing FYGARO_LINK_BASE" });

  const { amount, description } = req.body || {};
  const amt = toMoney2(amount);
  if (!amt) return res.status(400).json({ error: "Invalid amount" });

  // Your own tracking ID for later confirmation
  const client_reference = `order_${Date.now()}`;

  // Build URL per Fygaro Links Integration Option 1
  const url = new URL(base);
  url.searchParams.set("amount", amt);
  url.searchParams.set("client_note", description || "Framer payment");
  url.searchParams.set("client_reference", client_reference);

  return res.status(200).json({
    paymentUrl: url.toString(),
    client_reference
  });
}
