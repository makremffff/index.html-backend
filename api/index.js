// /api/index.js
// Vercel Serverless Function – runtime: nodejs

const https = require('https');
const http = require('http');

// ---------- ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL;        // https://xxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_KEY;        // anon key

// ---------- HELPERS ----------
function json(res, obj, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// Generic Supabase REST insert helper
async function sb(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const body = JSON.stringify(data);
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.request(url, { method: 'POST', headers }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(raw);
        else reject(new Error(`Supabase error ${res.statusCode}: ${raw}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------- ROUTER ----------
async function handle(action, userId, payload) {
  const ts = new Date().toISOString();

  switch (action) {
    case 'play':
      await sb('plays', { user_id: userId, ts });
      return { ok: true };

    case 'openTasks':
      await sb('actions_log', { user_id: userId, action: 'openTasks', ts });
      return { ok: true };

    case 'openAddTask':
      await sb('actions_log', { user_id: userId, action: 'openAddTask', ts });
      return { ok: true };

    case 'openSwap':
      await sb('actions_log', { user_id: userId, action: 'openSwap', ts });
      return { ok: true };

    case 'swap':
      await sb('swaps', { user_id: userId, amount: payload.amount, ts });
      return { ok: true };

    case 'collect':
      await sb('collects', { user_id: userId, emoji: payload.emoji, total_score: payload.totalScore, ts });
      return { ok: true };

    case 'watchAd':
      await sb('ads', { user_id: userId, ticket_left: payload.ticketLeft, ads_left: payload.adsLeft, ts });
      return { ok: true };

    case 'joinChannel':
      await sb('joins', { user_id: userId, type: 'channel', ticket_left: payload.ticketLeft, ts });
      return { ok: true };

    case 'joinCommunityTask':
      await sb('community_tasks_joins', { user_id: userId, task_name: payload.taskName, ts });
      return { ok: true };

    case 'back':
      await sb('actions_log', { user_id: userId, action: 'back', ts });
      return { ok: true };

    default:
      return { error: 'Unknown action' };
  }
}

// ---------- ENTRY ----------
module.exports = (req, res) => {
  // CORS (optional for local testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return json(res, { error: 'Method Not Allowed' }, 405);

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);
      const { action, userId } = parsed;

      if (!action) return json(res, { error: 'Missing action' });
      if (!userId) return json(res, { error: 'Missing userId' });

      const result = await handle(action, userId, parsed);
      json(res, result);
    } catch (e) {
      json(res, { error: 'Invalid JSON' }, 400);
    }
  });
};
