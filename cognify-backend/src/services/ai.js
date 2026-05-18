// src/services/ai.js — Unified AI: Claude (Pro) + Groq (Free) with full fallbacks
const Anthropic = require("@anthropic-ai/sdk");
const Groq      = require("groq-sdk");
const cache     = require("./cache");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq      = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const GROQ_BEST    = process.env.GROQ_MODEL_BEST || "llama-3.3-70b-versatile";
const GROQ_FAST    = process.env.GROQ_MODEL_FAST || "llama-3.1-8b-instant";

// ── Core caller with retry + fallback ────────────────────────────────────────
async function call(prompt, { isPro = false, maxTokens = 2000, retries = 3 } = {}) {
  // Pro: try Claude first, fallback to Groq
  if (isPro) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        });
        const text = res.content[0]?.text || "";
        return parseJSON(text);
      } catch (err) {
        console.error(`[Claude attempt ${i + 1}]`, err.message);
        if (i === retries - 1) {
          console.warn("[Claude] All retries failed, falling back to Groq");
          return callGroq(prompt, { model: GROQ_BEST, maxTokens, retries: 2 });
        }
        await sleep(1000 * (i + 1));
      }
    }
  }
  // Free: Groq
  return callGroq(prompt, { model: GROQ_BEST, maxTokens, retries });
}

async function callGroq(prompt, { model = GROQ_BEST, maxTokens = 2000, retries = 3 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4,
        response_format: { type: "json_object" },
      });
      return parseJSON(res.choices[0]?.message?.content || "");
    } catch (err) {
      console.error(`[Groq attempt ${i + 1}]`, err.message);
      if (i === retries - 1) return null;
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

// Fast non-JSON chat call
async function callChat(messages, system, { isPro = false } = {}) {
  if (isPro) {
    try {
      const res = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 600,
        system,
        messages,
      });
      return res.content[0]?.text || fallbackChatMsg();
    } catch {
      return callGroqChat(messages, system);
    }
  }
  return callGroqChat(messages, system);
}

async function callGroqChat(messages, system) {
  try {
    const res = await groq.chat.completions.create({
      model: GROQ_FAST,
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 400,
      temperature: 0.6,
    });
    return res.choices[0]?.message?.content || fallbackChatMsg();
  } catch { return fallbackChatMsg(); }
}

// ── Module list ───────────────────────────────────────────────────────────────
async function generateModules(topic, { isPro = false } = {}) {
  const count = isPro ? 9 : 5;
  const key   = `modules:${cache.hash(topic.toLowerCase())}:${count}`;
  return cache.getOrSet(key, async () => {
    const data = await call(
      `You are an expert curriculum designer.
Generate exactly ${count} structured learning modules for: "${topic}"
Module ${count} must be a hands-on project or practical application.
Return ONLY a JSON object: {"modules":[{"title":"string","description":"max 40 words","emoji":"single emoji","order":1,"searchQuery":"specific YouTube search query"}]}`,
      { isPro, maxTokens: 1200 }
    );
    return data?.modules || getFallbackModules(topic, count);
  }, cache.TTL.AI_CONTENT);
}

// ── Module content (notes + Q&A + quiz) ──────────────────────────────────────
async function generateModuleContent(title, topic, transcript = null, { isPro = false } = {}) {
  const transcriptSlice = isPro
    ? transcript?.slice(0, 8000)   // Pro: up to 8000 chars
    : transcript?.slice(0, 2000);  // Free: 2000 chars

  const cacheKey = `content:${cache.hash(`${topic}::${title}::${isPro}${transcriptSlice ? "::t" : ""}`)}`;

  return cache.getOrSet(cacheKey, async () => {
    const context = transcriptSlice
      ? `Use this video transcript as your PRIMARY and ONLY source. Base ALL notes, Q&A, and quiz STRICTLY on what the transcript says:\n\n"${transcriptSlice}"\n\nOnly supplement with general knowledge if the transcript is insufficient for a specific point.`
      : `No transcript available. Use your expert knowledge of "${title}" within the course "${topic}".`;

    const qaCount   = isPro ? 8  : 4;
    const quizCount = isPro ? 6  : 3;

    const data = await call(
      `You are an expert educator. Create complete learning content for module "${title}" (course: "${topic}").
${context}
Return ONLY a JSON object:
{
  "notes": {
    "summary": "2-3 substantial paragraphs",
    "keyConcepts": [{"term":"string","definition":"1-2 sentences"}],
    "keyPoints": ["array of 8 key points as full sentences"],
    "formulas": ["formulas with explanations if relevant, else empty array"],
    "realWorldExamples": ["2-3 concrete examples"],
    "commonMistakes": ["2-3 common mistakes or misconceptions"],
    "furtherReading": ["3 related topics to explore"]
  },
  "qa": [{"question":"string","answer":"3-4 sentence answer","difficulty":"Easy|Medium|Hard","concept":"string"}],
  "quiz": [{"question":"string","options":["A","B","C","D"],"correct":0,"explanation":"string"}]
}
Include exactly ${qaCount} Q&A items and ${quizCount} quiz questions. "correct" is 0-indexed.`,
      { isPro, maxTokens: isPro ? 4000 : 2000 }
    );

    if (!data?.notes) return getFallbackContent(title);
    return { notes: data.notes, qa: data.qa || [], quiz: data.quiz || [] };
  }, cache.TTL.AI_CONTENT);
}

// ── Final exam ────────────────────────────────────────────────────────────────
async function generateFinalQuiz(modules, topicTitle, { isPro = false } = {}) {
  const count = isPro ? 15 : 8;
  const key   = `finalquiz:${cache.hash(topicTitle + modules.map(m => m.title).join(","))}:${count}`;
  return cache.getOrSet(key, async () => {
    const modList = modules.map((m, i) => `${i + 1}. ${m.title}`).join(", ");
    const data = await call(
      `Create a ${count}-question final exam for course "${topicTitle}".
Modules: ${modList}
Distribute questions evenly. Mix Easy/Medium/Hard.
Return ONLY JSON: {"questions":[{"question":"","options":["A","B","C","D"],"correct":0,"explanation":"","moduleRef":"module title","difficulty":"Easy|Medium|Hard"}]}`,
      { isPro, maxTokens: isPro ? 3000 : 1500 }
    );
    return data?.questions || [];
  }, cache.TTL.AI_CONTENT);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
async function chat(messages, { moduleTitle, topicTitle, transcriptSnippet, isPro = false } = {}) {
  const system = `You are a friendly, expert AI tutor for "${topicTitle}"${moduleTitle ? `, module "${moduleTitle}"` : ""}.
${transcriptSnippet ? `The video content says: "${transcriptSnippet.slice(0, 1500)}"` : ""}
Be concise (under 200 words), accurate, encouraging. Never say you can't help — always give the best answer you can.`;

  return callChat(messages, system, { isPro });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseJSON(text) {
  try { return JSON.parse(text); } catch {
    const m = text.match(/```(?:json)?\n?([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    try { return JSON.parse(m?.[1] || text); } catch { return null; }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fallbackChatMsg() { return "I'm having a moment — please try again! I'm here to help 🙂"; }

function getFallbackModules(topic, count) {
  return Array.from({ length: count }, (_, i) => ({
    title: i === count - 1 ? `${topic} — Hands-on Project` : `${topic} — Module ${i + 1}`,
    description: `Core concepts for module ${i + 1} of ${topic}`,
    emoji: ["📚","🔬","💡","🎯","🧠","⚡","🔧","🌍","🏆"][i] || "📚",
    order: i,
    searchQuery: `${topic} tutorial part ${i + 1}`,
  }));
}

function getFallbackContent(title) {
  return {
    notes: {
      summary: `This module covers ${title}. Content is being prepared — please refresh in a moment.`,
      keyConcepts: [],
      keyPoints: [`Study ${title} carefully`, "Practice regularly", "Review key concepts"],
      formulas: [],
      realWorldExamples: [],
      commonMistakes: [],
      furtherReading: [],
    },
    qa: [],
    quiz: [],
  };
}

module.exports = { generateModules, generateModuleContent, generateFinalQuiz, chat };
