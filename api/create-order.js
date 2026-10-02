var Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  try {
    var keyId = process.env.RAZORPAY_KEY_ID;
    var keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ success: false, error: "Razorpay server configuration is missing." });
    }

    var body = req.body || {};
    var amount = Number(body.amount);
    var name = typeof body.name === "string" ? body.name.trim() : "";
    var note = typeof body.note === "string" ? body.note.trim() : "";

    if (!Number.isFinite(amount)) {
      return res.status(400).json({ success: false, error: "Amount must be a valid number." });
    }

    amount = Math.floor(amount);

    if (amount < 1 || amount > 100000) {
      return res.status(400).json({ success: false, error: "Amount must be between ₹1 and ₹1,00,000." });
    }

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ success: false, error: "Name or gamertag must contain between 2 and 80 characters." });
    }

    if (note.length > 500) {
      return res.status(400).json({ success: false, error: "Note must be 500 characters or fewer." });
    }

    var razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    var order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "lz_" + Date.now(),
      notes: {
        name: name,
        note: note || "LORD ZORO support"
      }
    });

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to create Razorpay order. Please try again."
    });
  }
};
