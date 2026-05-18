// src/routes/search.js
const router = require("express").Router();
const auth   = require("../middleware/auth");
const yt     = require("../services/youtube");

router.get("/", auth, async (req, res) => {
  const { q, n = 4 } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  const results = await yt.search(q, parseInt(n));
  res.json({ results });
});

router.get("/transcript/:videoId", auth, async (req, res) => {
  const transcript = await yt.getTranscript(req.params.videoId);
  res.json({ transcript });
});

router.get("/info/:videoId", auth, async (req, res) => {
  const info = await yt.getInfo(req.params.videoId);
  res.json({ info });
});

module.exports = router;
