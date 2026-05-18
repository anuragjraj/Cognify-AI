const prisma = require("../db");
const crypto = require("crypto");

const TTL = {
  AI_CONTENT: 7 * 24 * 60 * 60 * 1000,
  YT_SEARCH:  6 * 60 * 60 * 1000,
  TRANSCRIPT: 30 * 24 * 60 * 60 * 1000,
};

const hash = (s) => crypto.createHash("md5").update(s).digest("hex");

async function getOrSet(key, fn, ttl = TTL.AI_CONTENT) {
  try {
    const cached = await prisma.cache.findUnique({ where: { key } });
    if (cached && cached.expiresAt > new Date()) return cached.value;
    const value = await fn();
    if (value !== null && value !== undefined) {
      await prisma.cache.upsert({
        where: { key },
        update: { value, expiresAt: new Date(Date.now() + ttl) },
        create: { key, value, expiresAt: new Date(Date.now() + ttl) },
      });
    }
    return value;
  } catch { return fn(); }
}

module.exports = { getOrSet, hash, TTL };
