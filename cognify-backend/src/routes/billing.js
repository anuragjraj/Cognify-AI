// src/routes/billing.js — Razorpay billing
const router   = require("express").Router();
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const auth     = require("../middleware/auth");
const prisma   = require("../db");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  monthly: process.env.RAZORPAY_PLAN_MONTHLY,
  yearly:  process.env.RAZORPAY_PLAN_YEARLY,
};

// ── Create subscription ───────────────────────────────────────────────────────
router.post("/create-subscription", auth, async (req, res) => {
  const { plan } = req.body;
  const planId   = PLANS[plan];
  if (!planId) return res.status(400).json({ error: "Invalid plan" });
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id:         planId,
      customer_notify: 1,
      quantity:        1,
      total_count:     plan === "monthly" ? 120 : 10,
      notes:           { userId: req.user.id, plan },
    });
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { stripeSubscriptionId: subscription.id },
    });
    res.json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error("[Razorpay]", e.message);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// ── Verify payment ────────────────────────────────────────────────────────────
router.post("/verify", auth, async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_payment_id + "|" + razorpay_subscription_id).digest("hex");
  if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

  const sub       = await razorpay.subscriptions.fetch(razorpay_subscription_id);
  const isMonthly = sub.plan_id === PLANS.monthly;
  const expiresAt = new Date(Date.now() + (isMonthly ? 32 : 366) * 86400000);
  await prisma.user.update({
    where: { id: req.user.id },
    data:  { plan: "pro", planExpiresAt: expiresAt, stripeSubscriptionId: razorpay_subscription_id },
  });
  res.json({ ok: true });
});

// ── Webhook ───────────────────────────────────────────────────────────────────
router.post("/webhook", require("express").raw({ type: "application/json" }), async (req, res) => {
  const sig  = req.headers["x-razorpay-signature"];
  const body = req.body.toString();
  const exp  = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  if (exp !== sig) return res.status(400).json({ error: "Invalid signature" });

  const event   = JSON.parse(body);
  const payload = event.payload?.subscription?.entity;

  if (event.event === "subscription.charged") {
    const userId = payload?.notes?.userId;
    if (userId) {
      const isMonthly = payload.plan_id === PLANS.monthly;
      await prisma.user.update({
        where: { id: userId },
        data:  { plan: "pro", planExpiresAt: new Date(Date.now() + (isMonthly ? 32 : 366) * 86400000) },
      });
    }
  }

  if (["subscription.cancelled","subscription.completed"].includes(event.event)) {
    const userId = payload?.notes?.userId;
    if (userId) await prisma.user.update({ where: { id: userId }, data: { plan: "free", planExpiresAt: null, stripeSubscriptionId: null } });
  }

  res.json({ received: true });
});

// ── Cancel ────────────────────────────────────────────────────────────────────
router.post("/cancel", auth, async (req, res) => {
  const subId = req.user.stripeSubscriptionId;
  if (!subId) return res.status(400).json({ error: "No active subscription" });
  try { await razorpay.subscriptions.cancel(subId); res.json({ ok: true }); }
  catch { res.status(500).json({ error: "Could not cancel" }); }
});

router.get("/status", auth, (req, res) => res.json({
  plan: req.user.plan, expiresAt: req.user.planExpiresAt, hasSubscription: !!req.user.stripeSubscriptionId,
}));

module.exports = router;
