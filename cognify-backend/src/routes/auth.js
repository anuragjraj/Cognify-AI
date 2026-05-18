// src/routes/auth.js
const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const prisma  = require("../db");
const auth    = require("../middleware/auth");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "30d" });
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, plan: u.plan, avatarUrl: u.avatarUrl });

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  try {
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), passwordHash: hash },
    });
    res.json({ token: sign(user.id), user: safeUser(user) });
  } catch (e) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ token: sign(user.id), user: safeUser(user) });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "No credential" });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
    });
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: picture },
        });
      }
    } else {
      user = await prisma.user.create({
        data: { name, email: email.toLowerCase(), googleId, avatarUrl: picture },
      });
    }
    res.json({ token: sign(user.id), user: safeUser(user) });
  } catch (e) {
    console.error("[Google auth]", e.message);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/me", auth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

module.exports = router;
