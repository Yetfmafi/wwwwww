const { kv } = require("@vercel/kv");

const KV_KEY = "mediaBioOS:state";
const OWNER_PIN = process.env.OWNER_PIN || "1991";
let fallbackState = {};

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

async function readState() {
  try {
    return (await kv.get(KV_KEY)) || fallbackState;
  } catch {
    return fallbackState;
  }
}

async function writeState(data) {
  fallbackState = data;
  try {
    await kv.set(KV_KEY, data);
  } catch {
    // KV is optional for local/dev preview. Production persistence needs Vercel KV.
  }
}

function parseBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method === "GET") {
    return res.status(200).json(await readState());
  }

  if (req.method === "POST") {
    const pin = req.headers["x-owner-pin"];
    const existingState = await readState();
    const savedPin = existingState && existingState.profile && existingState.profile.ownerPin;
    if (pin !== OWNER_PIN && (!savedPin || pin !== savedPin)) {
      return res.status(401).json({ ok: false, error: "Invalid owner PIN" });
    }

    try {
      const body = parseBody(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ ok: false, error: "Invalid JSON" });
      }
      await writeState(body);
      return res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
};
