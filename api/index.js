// =========================
//  CONFIG
// =========================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

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

// =========================
//  HANDLER
// =========================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action, userId, ...data } = req.body;

  try {

    // =========================
    //  PLAY
    // =========================
    if (action === "play") {
      await sb("plays", { user_id: userId, ts: new Date().toISOString() });
      return res.json({ ok: true });
    }

    // =========================
    //  OPEN TASKS
    // =========================
    if (action === "openTasks") {
      await sb("actions_log", { user_id: userId, action: "openTasks", ts: new Date().toISOString() });
      return res.json({ ok: true });
    }

    // =========================
    //  OPEN ADD TASK
    // =========================
    if (action === "openAddTask") {
      await sb("actions_log", { user_id: userId, action: "openAddTask", ts: new Date().toISOString() });
      return res.json({ ok: true });
    }

    // =========================
    //  OPEN SWAP
    // =========================
    if (action === "openSwap") {
      await sb("actions_log", { user_id: userId, action: "openSwap", ts: new Date().toISOString() });
      return res.json({ ok: true });
    }

    // =========================
    //  SWAP SCORE → USDT
    // =========================
    if (action === "swap") {
      await sb("swaps", {
        user_id: userId,
        amount_score: data.amount,
        ts: new Date().toISOString()
      });
      return res.json({ ok: true });
    }

    // =========================
    //  JOIN CHANNEL
    // =========================
    if (action === "joinChannel") {
      await sb("joins", {
        user_id: userId,
        ticket_left: data.ticketLeft,
        ts: new Date().toISOString()
      });
      return res.json({ ok: true });
    }

    // =========================
    //  WATCH AD
    // =========================
    if (action === "watchAd") {
      await sb("ads", {
        user_id: userId,
        ticket_left: data.ticketLeft,
        ads_left: data.adsLeft,
        ts: new Date().toISOString()
      });
      return res.json({ ok: true });
    }

    // =========================
    //  JOIN COMMUNITY TASK
    // =========================
    if (action === "joinCommunityTask") {
      await sb("community_tasks_joins", {
        user_id: userId,
        task_name: data.taskName,
        ts: new Date().toISOString()
      });
      return res.json({ ok: true });
    }

    // =========================
    //  COLLECT FOOD
    // =========================
    if (action === "collect") {
      await sb("collects", {
        user_id: userId,
        emoji: data.emoji,
        total_score: data.totalScore,
        ts: new Date().toISOString()
      });
      return res.json({ ok: true });
    }

    // =========================
    //  BACK
    // =========================
    if (action === "back") {
      await sb("actions_log", { user_id: userId, action: "back", ts: new Date().toISOString() });
      return res.json({ ok: true });
    }

    // UNKNOWN ACTION
    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.log("ERR:", err);
    return res.status(500).json({ error: "server error" });
  }
}