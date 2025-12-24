export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const response = await fetch(process.env.FYGARO_LINK_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FYGARO_SECRET}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "XCD",
        description: description || "Framer payment",
        return_url: process.env.RETURN_URL,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Fygaro error",
        details: data,
      });
    }

    res.status(200).json({
      paymentUrl: data.payment_url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
