// src/services/youtube.js — YouTube search + transcript with full fallbacks
const axios  = require("axios");
const cache  = require("./cache");
const { YoutubeTranscript } = require("youtube-transcript");

const YT_KEY = process.env.YOUTUBE_API_KEY;

// ── Search ────────────────────────────────────────────────────────────────────
async function search(query, n = 4) {
  const key = `ytsearch:${cache.hash(query + n)}`;
  return cache.getOrSet(key, async () => {
    try {
      const { data } = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: { part: "snippet", q: query, maxResults: n, type: "video",
          videoEmbeddable: "true", key: YT_KEY },
        timeout: 8000,
      });
      return (data.items || []).map(item => ({
        videoId:   item.id.videoId,
        title:     item.snippet.title,
        uploader:  item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      }));
    } catch (err) {
      console.error("[YT search]", err.message);
      return [];
    }
  }, cache.TTL.YT_SEARCH);
}

// ── Transcript: tries multiple videos before giving up ────────────────────────
async function getTranscript(videoId) {
  if (!videoId) return null;
  const key = `transcript:${videoId}`;
  return cache.getOrSet(key, async () => {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      if (!segments?.length) return null;
      const text = segments.map(s => s.text).join(" ").replace(/\s+/g, " ").trim();
      return text.length > 100 ? text : null;
    } catch {
      // Try without language preference
      try {
        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        if (!segments?.length) return null;
        const text = segments.map(s => s.text).join(" ").replace(/\s+/g, " ").trim();
        return text.length > 100 ? text : null;
      } catch { return null; }
    }
  }, cache.TTL.TRANSCRIPT);
}

// ── Get best transcript from a list of videos ─────────────────────────────────
async function getBestTranscript(videos) {
  for (const video of videos.slice(0, 4)) {
    if (!video?.videoId) continue;
    const transcript = await getTranscript(video.videoId);
    if (transcript && transcript.length > 500) {
      return { transcript, videoId: video.videoId };
    }
  }
  return { transcript: null, videoId: videos[0]?.videoId || null };
}

// ── Video info via oEmbed ─────────────────────────────────────────────────────
async function getInfo(videoId) {
  if (!videoId) return null;
  const key = `ytinfo:${videoId}`;
  return cache.getOrSet(key, async () => {
    try {
      const { data } = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 5000 }
      );
      return { title: data.title, uploader: data.author_name };
    } catch { return null; }
  }, cache.TTL.YT_SEARCH);
}

module.exports = { search, getTranscript, getBestTranscript, getInfo };
