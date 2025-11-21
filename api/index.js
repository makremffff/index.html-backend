// /api/index.js
export const config = { runtime: "nodejs" };

const https = require("https");
const http = require("http");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function sb(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const body = JSON.stringify(data);
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const req = proto.request(url, { method: "POST", headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(raw);
        else reject(new Error(`Supabase error ${res.statusCode}: ${raw}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function handle(action, userId, payload) {
  const ts = new Date().toISOString();

  switch (action) {
    case "play":
      await sb("plays", { user_id: userId, ts });
      return { ok: true };

    case "collect":
      await sb("collects", { user_id: userId, emoji: payload.emoji, total_score: payload.totalScore, ts });
      return { ok: true };

    case "swap":
      await sb("swaps", { user_id: userId, amount_score: payload.amount, ts });
      return { ok: true };

    case "watchAd":
      await sb("ads", { user_id: userId, ticket_left: payload.ticketLeft, ads_left: payload.adsLeft, ts });
      return { ok: true };

    case "joinChannel":
      await sb("joins", { user_id: userId, type: "channel", ticket_left: payload.ticketLeft, ts });
      return { ok: true };

    case "joinCommunityTask":
      await sb("community_tasks_joins", { user_id: userId, task_name: payload.taskName, ts });
      return { ok: true };

    case "openTasks":
    case "openAddTask":
    case "openSwap":
    case "back":
      await sb("actions_log", { user_id: userId, action, ts });
      return { ok: true };

    default:
      return { error: "Unknown action" };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== "POST")
    return send(res, 405, { error: "Method Not Allowed" });

  try {
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    const parsed = JSON.parse(body || "{}");
    const { action, userId } = parsed;

    if (!action) return send(res, 400, { error: "Missing action" });
    if (!userId) return send(res, 400, { error: "Missing userId" });

    const result = await handle(action, userId, parsed);
    send(res, 200, result);
  } catch (e) {
    send(res, 400, { error: "Bad Request", details: e.message });
  }
}