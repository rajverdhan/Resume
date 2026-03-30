const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const PROFILE_PATH = path.join(DATA_DIR, "profile.json");
const CONTACT_PATH = path.join(DATA_DIR, "contact-submissions.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end(message);
}

async function ensureDataFiles() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  try {
    await fsp.access(CONTACT_PATH);
  } catch {
    await fsp.writeFile(CONTACT_PATH, "[]\n", "utf8");
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fsp.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function safePath(basePath, requestPathname) {
  const normalized = path.normalize(requestPathname).replace(/^([.][.][/\\])+/, "");
  const joined = path.join(basePath, normalized);
  return joined.startsWith(basePath) ? joined : null;
}

function readBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
  });
}

function validateContact(input) {
  const errors = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (name.length < 2 || name.length > 80) {
    errors.push("Name must be 2-80 characters.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email must be valid.");
  }

  if (message.length < 10 || message.length > 1200) {
    errors.push("Message must be 10-1200 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { name, email, message }
  };
}

async function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requested);
  const resolved = safePath(PUBLIC_DIR, decodedPath);

  if (!resolved) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let finalPath = resolved;

  try {
    const stats = await fsp.stat(resolved);
    if (stats.isDirectory()) {
      finalPath = path.join(resolved, "index.html");
    }
  } catch {
    sendText(res, 404, "Not found");
    return;
  }

  try {
    const stats = await fsp.stat(finalPath);
    if (!stats.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }
  } catch {
    sendText(res, 404, "Not found");
    return;
  }

  const extension = path.extname(finalPath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600"
  });

  const stream = fs.createReadStream(finalPath);
  stream.on("error", () => sendText(res, 500, "Unable to read file"));
  stream.pipe(res);
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
    return true;
  }

  if (pathname === "/api/profile" && req.method === "GET") {
    const profile = await readJson(PROFILE_PATH, null);
    if (!profile) {
      sendJson(res, 500, { error: "Profile data unavailable." });
      return true;
    }

    sendJson(res, 200, profile);
    return true;
  }

  if (pathname === "/api/contact" && req.method === "POST") {
    let payload;

    try {
      const raw = await readBody(req);
      payload = JSON.parse(raw || "{}");
    } catch (error) {
      const isTooLarge = error instanceof Error && error.message === "Payload too large";
      sendJson(res, isTooLarge ? 413 : 400, {
        error: isTooLarge ? "Payload too large." : "Invalid JSON payload."
      });
      return true;
    }

    const validation = validateContact(payload);

    if (!validation.isValid) {
      sendJson(res, 400, {
        error: "Validation failed.",
        details: validation.errors
      });
      return true;
    }

    const submissions = await readJson(CONTACT_PATH, []);
    const entry = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      ...validation.value
    };

    submissions.unshift(entry);
    await writeJson(CONTACT_PATH, submissions.slice(0, 500));

    sendJson(res, 201, {
      ok: true,
      message: "Message received. I will get back to you soon."
    });
    return true;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "API route not found." });
    return true;
  }

  return false;
}

async function start() {
  await ensureDataFiles();

  const server = http.createServer(async (req, res) => {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);

    try {
      const isApi = await handleApi(req, res, url.pathname);
      if (!isApi) {
        await serveStatic(req, res, url.pathname);
      }
    } catch (error) {
      sendJson(res, 500, {
        error: "Unexpected server error.",
        detail: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Portfolio server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
