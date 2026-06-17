const { kv } = require("@vercel/kv");

const KV_KEY = "mediaBioOS:views";
let fallbackViews = { total: 0, updatedAt: null };

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

async function readViews() {
  try {
    return (await kv.get(KV_KEY)) || fallbackViews;
  } catch {
    return fallbackViews;
  }
}

async function writeViews(data) {
  fallbackViews = data;
  try {
    await kv.set(KV_KEY, data);
  } catch {
    // KV is optional for local/dev preview. Production persistence needs Vercel KV.
  }
}

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method === "GET") {
    return res.status(200).json(await readViews());
  }

  if (req.method === "POST") {
    const data = await readViews();
    const next = {
      total: Number(data.total || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    await writeViews(next);
    return res.status(200).json(next);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
};
