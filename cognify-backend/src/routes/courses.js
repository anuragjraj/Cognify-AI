// src/routes/courses.js
const router = require("express").Router();
const auth   = require("../middleware/auth");
const prisma = require("../db");
const ai     = require("../services/ai");
const yt     = require("../services/youtube");
const { EventEmitter } = require("events");
const jwt    = require("jsonwebtoken");

const FREE_COURSE_LIMIT  = 4;
const FREE_MODULE_COUNT  = 5;
const PRO_MODULE_COUNT   = 9;

const courseEvents = new Map();
function emit(courseId, data) { courseEvents.get(courseId)?.emit("update", data); }

// ── GET /courses ──────────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  const courses = await prisma.course.findMany({
    where:   { userId: req.user.id },
    include: { modules: { orderBy: { order: "asc" }, select: {
      id:true, title:true, emoji:true, order:true, genStatus:true,
      videoId:true, quizCompleted:true, quizScore:true, transcriptStatus:true, description:true
    }}},
    orderBy: { createdAt: "desc" },
  });
  res.json({ courses });
});

// ── GET /courses/:id ──────────────────────────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  const course = await prisma.course.findFirst({
    where:   { id: req.params.id, userId: req.user.id },
    include: { modules: { orderBy: { order: "asc" } } },
  });
  if (!course) return res.status(404).json({ error: "Not found" });
  res.json({ course });
});

// ── POST /courses ─────────────────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  const { topic } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });
  const isPro = req.user.plan === "pro";

  // 1. Check for existing course (same topic, same user)
  const existing = await prisma.course.findFirst({
    where: {
      userId: req.user.id,
      topic:  { equals: topic.trim(), mode: "insensitive" },
      status: { not: "error" },
    },
    include: { modules: { orderBy: { order: "asc" } } },
  });
  if (existing) {
    return res.status(200).json({ courseId: existing.id, existing: true });
  }

  // 2. Free tier limit
  if (!isPro) {
    const count = await prisma.course.count({ where: { userId: req.user.id } });
    if (count >= FREE_COURSE_LIMIT) {
      return res.status(403).json({ error: "FREE_LIMIT_REACHED", message: `Free plan allows ${FREE_COURSE_LIMIT} courses. Upgrade to Pro for unlimited.` });
    }
  }

  // 3. Create course skeleton
  const course = await prisma.course.create({
    data: { userId: req.user.id, topic: topic.trim(), status: "generating" },
  });

  res.status(202).json({ courseId: course.id, existing: false });

  // 4. Background generation
  generateCourse(course.id, req.user.id, topic.trim(), isPro).catch(err =>
    console.error("[generateCourse]", err)
  );
});

// ── Background generation ─────────────────────────────────────────────────────
async function generateCourse(courseId, userId, topic, isPro) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);
  courseEvents.set(courseId, emitter);

  try {
    // Step 1: Generate module list
    const rawMods = await ai.generateModules(topic, { isPro });
    if (!rawMods?.length) throw new Error("No modules generated");

    // Step 2: Insert all modules as pending
    await prisma.module.createMany({
      data: rawMods.map((m, i) => ({
        courseId, title: m.title, description: m.description,
        emoji: m.emoji || "📚", order: i,
        searchQuery: m.searchQuery, genStatus: "pending",
      })),
    });

    const modules = await prisma.module.findMany({ where: { courseId }, orderBy: { order: "asc" } });
    emit(courseId, { type: "modules_listed", modules });

    // Step 3: Process modules — sequential for Pro (better quality), parallel for Free
    const processModule = async (mod) => {
      try {
        await prisma.module.update({ where: { id: mod.id }, data: { genStatus: "building" } });
        emit(courseId, { type: "module_building", moduleId: mod.id });

        // Search YouTube
        const videos = await yt.search(`${mod.searchQuery || mod.title} ${topic}`, 5).catch(() => []);

        // Try to get a transcript from any of the search results
        const { transcript, videoId: bestVideoId } = await yt.getBestTranscript(videos);

        // Generate content (with transcript if available)
        const content = await ai.generateModuleContent(mod.title, topic, transcript, { isPro });

        const topVideoId = bestVideoId || videos[0]?.videoId || null;

        await prisma.module.update({
          where: { id: mod.id },
          data: {
            genStatus:       "done",
            searchResults:   videos,
            videoId:         topVideoId,
            notes:           content?.notes || null,
            qa:              content?.qa    || null,
            quizQuestions:   content?.quiz  || null,
            transcript:      transcript     || null,
            transcriptStatus: transcript ? "success" : topVideoId ? "unavailable" : "none",
            aiModel:         isPro ? "claude" : "groq",
          },
        });

        emit(courseId, { type: "module_done", moduleId: mod.id, videoId: topVideoId });
      } catch (err) {
        console.error(`[module error] ${mod.title}:`, err.message);
        await prisma.module.update({
          where: { id: mod.id },
          data: { genStatus: "error" },
        }).catch(() => {});
        emit(courseId, { type: "module_error", moduleId: mod.id });
      }
    };

    if (isPro) {
      // Sequential — better quality, transcripts more likely
      for (const mod of modules) await processModule(mod);
    } else {
      // Parallel — faster
      await Promise.allSettled(modules.map(processModule));
    }

    await prisma.course.update({ where: { id: courseId }, data: { status: "in-progress" } });
    emit(courseId, { type: "generation_complete" });

  } catch (err) {
    console.error("[generateCourse error]", err);
    await prisma.course.update({ where: { id: courseId }, data: { status: "error" } }).catch(() => {});
    emit(courseId, { type: "error", message: err.message });
  } finally {
    setTimeout(() => courseEvents.delete(courseId), 120000);
  }
}

// ── Retry a failed module ─────────────────────────────────────────────────────
router.post("/:id/modules/:modId/retry", auth, async (req, res) => {
  const course = await prisma.course.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!course) return res.status(404).json({ error: "Not found" });
  const mod = await prisma.module.findUnique({ where: { id: req.params.modId } });
  if (!mod) return res.status(404).json({ error: "Module not found" });

  await prisma.module.update({ where: { id: mod.id }, data: { genStatus: "building" } });
  res.json({ ok: true });

  const isPro = req.user.plan === "pro";
  (async () => {
    try {
      const videos = await yt.search(`${mod.searchQuery || mod.title} ${course.topic}`, 5).catch(() => []);
      const { transcript, videoId: bestVideoId } = await yt.getBestTranscript(videos);
      const content = await ai.generateModuleContent(mod.title, course.topic, transcript, { isPro });
      await prisma.module.update({
        where: { id: mod.id },
        data: {
          genStatus: "done",
          searchResults: videos,
          videoId: bestVideoId || videos[0]?.videoId || null,
          notes: content?.notes || null,
          qa: content?.qa || null,
          quizQuestions: content?.quiz || null,
          transcript: transcript || null,
          transcriptStatus: transcript ? "success" : "unavailable",
        },
      });
    } catch (err) {
      await prisma.module.update({ where: { id: mod.id }, data: { genStatus: "error" } }).catch(() => {});
    }
  })();
});

// ── SSE Stream ────────────────────────────────────────────────────────────────
function sseAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7) || req.query.token;
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
}

router.get("/:id/stream", sseAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send      = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const emitter   = courseEvents.get(req.params.id);
  const keepAlive = setInterval(() => res.write(": ping\n\n"), 20000);

  send({ type: "connected" });
  if (!emitter) { send({ type: "no_stream" }); clearInterval(keepAlive); return res.end(); }

  emitter.on("update", send);
  req.on("close", () => { clearInterval(keepAlive); emitter.off("update", send); });
});

// ── PATCH module ──────────────────────────────────────────────────────────────
router.patch("/:id/modules/:modId", auth, async (req, res) => {
  const { videoId, quizCompleted, quizScore } = req.body;
  const course = await prisma.course.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!course) return res.status(404).json({ error: "Not found" });

  const data = {};
  if (quizCompleted !== undefined) data.quizCompleted = quizCompleted;
  if (quizScore     !== undefined) data.quizScore     = quizScore;

  if (videoId !== undefined) {
    data.videoId         = videoId;
    data.transcriptStatus = "pending";
    const isPro = req.user.plan === "pro";
    (async () => {
      const transcript = await yt.getTranscript(videoId);
      if (transcript) {
        const mod      = await prisma.module.findUnique({ where: { id: req.params.modId } });
        const content  = await ai.generateModuleContent(mod.title, course.topic, transcript, { isPro });
        await prisma.module.update({
          where: { id: req.params.modId },
          data: { transcript, transcriptStatus: "success",
            ...(content ? { notes: content.notes, qa: content.qa, quizQuestions: content.quiz } : {}) },
        });
      } else {
        await prisma.module.update({ where: { id: req.params.modId }, data: { transcriptStatus: "unavailable" } });
      }
    })().catch(console.error);
  }

  const mod = await prisma.module.update({ where: { id: req.params.modId }, data });
  res.json({ module: mod });
});

// ── Final quiz ────────────────────────────────────────────────────────────────
router.post("/:id/final-quiz", auth, async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { modules: { orderBy: { order: "asc" }, select: { title: true } } },
  });
  if (!course) return res.status(404).json({ error: "Not found" });
  const isPro     = req.user.plan === "pro";
  const questions = await ai.generateFinalQuiz(course.modules, course.topic, { isPro });
  res.json({ questions });
});

// ── PATCH course ──────────────────────────────────────────────────────────────
router.patch("/:id", auth, async (req, res) => {
  const { status, finalScore, finalGrade } = req.body;
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: { status, finalScore, finalGrade,
      ...(status === "completed" ? { completedAt: new Date() } : {}) },
  });
  res.json({ course });
});

// ── DELETE course ─────────────────────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  await prisma.course.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

module.exports = router;
