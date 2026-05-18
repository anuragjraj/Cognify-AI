// src/routes/chat.js
const router = require("express").Router();
const auth   = require("../middleware/auth");
const ai     = require("../services/ai");

router.post("/", auth, async (req, res) => {
  const { messages, moduleTitle, topicTitle, transcriptSnippet } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });
  const isPro = req.user.plan === "pro";
  try {
    const reply = await ai.chat(messages, { moduleTitle, topicTitle, transcriptSnippet, isPro });
    res.json({ reply });
  } catch {
    res.json({ reply: "I'm having a moment — please try again! 🙂" });
  }
});

module.exports = router;
