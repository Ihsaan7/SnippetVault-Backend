import app from "../src/app.js";
import connectDB from "../src/DB/db.js";

export default async function handler(req, res) {
  const url = req.url || "";

  // Health should never crash the function just because DB/env is misconfigured.
  // We attempt a best-effort DB connect in the background.
  if (url.startsWith("/health")) {
    connectDB().catch(() => {
      // ignore for health
    });
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({
      error: "Backend initialization failed",
      details: err?.message || String(err),
    });
  }

  return app(req, res);
}
