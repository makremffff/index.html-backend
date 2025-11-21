export const config = {
  runtime: "nodejs"
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

/* ----------- READ RAW BODY (VERCEL FIX) ----------- */
async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

/* ----------- SUPABASE HELPER ----------- */
async function sb(table, body) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(body)
  });
}

/* ----------- API HANDLER ----------- */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = await readBody(req);
    const { action, userId, ...data } = body;

    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    const ts = new Date().toISOString();

    /* --- ACTIONS --- */

    if (action === "play") {
      await sb("plays", { user_id: userId, ts });
      return res.json({ ok: true });
    }

    if (action === "openTasks") {
      await sb("actions_log", { user_id: userId, action, ts });
      return res.json({ ok: true });
    }

    if (action === "openAddTask") {
      await sb("actions_log", { user_id: userId, action, ts });
      return res.json({ ok: true });
    }

    if (action === "openSwap") {
      await sb("actions_log", { user_id: userId, action, ts });
      return res.json({ ok: true });
    }

    if (action === "swap") {
      await sb("swaps", {
        user_id: userId,
        amount_score: data.amount,
        ts
      });
      return res.json({ ok: true });
    }

    if (action === "joinChannel") {
      await sb("joins", {
        user_id: userId,
        ticket_left: data.ticketLeft,
        ts
      });
      return res.json({ ok: true });
    }

    if (action === "watchAd") {
      await sb("ads", {
        user_id: userId,
        ticket_left: data.ticketLeft,
        ads_left: data.adsLeft,
        ts
      });
      return res.json({ ok: true });
    }

    if (action === "joinCommunityTask") {
      await sb("community_tasks_joins", {
        user_id: userId,
        task_name: data.taskName,
        ts
      });
      return res.json({ ok: true });
    }

    if (action === "collect") {
      await sb("collects", {
        user_id: userId,
        emoji: data.emoji,
        total_score: data.totalScore,
        ts
      });
      return res.json({ ok: true });
    }

    if (action === "back") {
      await sb("actions_log", { user_id: userId, action, ts });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}