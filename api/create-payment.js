function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function toMoney2(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

export default function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const base = process.env.FYGARO_LINK_BASE;
  if (!base) return res.status(500).json({ error: "Missing FYGARO_LINK_BASE" });

  const { amount, description } = req.body || {};
  const amt = toMoney2(amount);
  if (!amt) return res.status(400).json({ error: "Invalid amount" });

  let url;
  try {
    url = new URL(base);
  } catch {
    return res.status(500).json({ error: "FYGARO_LINK_BASE is not a valid URL", value: base });
  }

  const client_reference = `order_${Date.now()}`;

  // Fygaro Links Option 1 parameters:
  url.searchParams.set("amount", amt);
  url.searchParams.set("client_note", description || "Framer payment");
  url.searchParams.set("client_reference", client_reference);

  return res.status(200).json({
    paymentUrl: url.toString(),
    client_reference
  });
}
