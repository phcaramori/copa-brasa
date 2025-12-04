import "dotenv/config";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import handler from "../api/campaigns.js";

const PORT = process.env.PORT || 4173;
const ROOT = resolve("frontend");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  if (!req.url) return endWith(res, 400, "Bad request");
  const pathOnly = req.url.split("?")[0];

  if (pathOnly === "/api/campaigns") {
    await runApi(req, res);
    return;
  }

  const target = pathOnly === "/" ? "/index.html" : pathOnly;
  const filePath = resolve(ROOT, "." + target);

  if (!filePath.startsWith(ROOT)) {
    endWith(res, 403, "Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream");
    res.end(file);
  } catch (err) {
    endWith(res, 404, "Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});

async function runApi(req, res) {
  const fakeRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader: (...args) => res.setHeader(...args),
    json(body) {
      res.statusCode = this.statusCode || 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    },
  };

  await handler({ method: req.method || "GET" }, fakeRes);
}

function endWith(res, status, message) {
  res.statusCode = status;
  res.end(message);
}
