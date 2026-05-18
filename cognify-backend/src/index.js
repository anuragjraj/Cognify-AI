// src/index.js
require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app = express();

// Stripe webhook needs raw body — mount before express.json()
app.use("/api/billing/webhook", require("express").raw({ type: "application/json" }));

app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Routes
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/videos",  require("./routes/videos"));
app.use("/api/search",  require("./routes/search"));
app.use("/api/chat",    require("./routes/chat"));
app.use("/api/billing", require("./routes/billing"));

// Global error handler — never crash
app.use((err, req, res, next) => {
  console.error("[server error]", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Cognify backend running on :${PORT}`));
