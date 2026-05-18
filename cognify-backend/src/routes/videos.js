// src/routes/videos.js
const router = require("express").Router();
const auth   = require("../middleware/auth");
const prisma = require("../db");
const ai     = require("../services/ai");
const yt     = require("../services/youtube");

router.get("/", auth, async (req, res) => {
  const videos = await prisma.savedVideo.findMany({
    where: { userId: req.user.id }, orderBy: { createdAt: "desc" },
  });
  res.json({ videos });
});

router.get("/:id", auth, async (req, res) => {
  const video = await prisma.savedVideo.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!video) return res.status(404).json({ error: "Not found" });
  res.json({ video });
});

router.post("/", auth, async (req, res) => {
  const { videoId, title } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId required" });
  const isPro = req.user.plan === "pro";

  // Check if already saved
  const existing = await prisma.savedVideo.findFirst({ where: { userId: req.user.id, videoId } });
  if (existing) return res.json({ video: existing, existing: true });

  const video = await prisma.savedVideo.create({
    data: { userId: req.user.id, videoId, title: title || "Video", transcriptStatus: "pending" },
  });
  res.json({ video });

  // Background: fetch transcript + generate content
  (async () => {
    const transcript = await yt.getTranscript(videoId);
    const content    = await ai.generateModuleContent(title || "Video", title || "General Learning", transcript, { isPro });
    await prisma.savedVideo.update({
      where: { id: video.id },
      data: {
        transcript:       transcript || null,
        transcriptStatus: transcript ? "success" : "unavailable",
        notes:            content?.notes || null,
        qa:               content?.qa    || null,
        quizQuestions:    content?.quiz  || null,
      },
    });
  })().catch(console.error);
});

router.patch("/:id", auth, async (req, res) => {
  const { videoId, quizCompleted, quizScore } = req.body;
  const existing = await prisma.savedVideo.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const data = {};
  if (quizCompleted !== undefined) data.quizCompleted = quizCompleted;
  if (quizScore     !== undefined) data.quizScore     = quizScore;
  if (videoId       !== undefined) { data.videoId = videoId; data.transcriptStatus = "pending"; }
  const video = await prisma.savedVideo.update({ where: { id: req.params.id }, data });
  res.json({ video });
});

router.delete("/:id", auth, async (req, res) => {
  await prisma.savedVideo.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

module.exports = router;
