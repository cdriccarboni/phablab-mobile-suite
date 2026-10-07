import http from "node:http";
import { spawn } from "node:child_process";
import { URL } from "node:url";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.PORT || 3000);
const PUBLISH_TOKEN = String(process.env.PUBLISH_TOKEN || "");
const MEDIAMTX_RTMP_URL = String(process.env.MEDIAMTX_RTMP_URL || "rtmp://mediamtx.railway.internal:1935/radio");
const ALLOW_ORIGIN = String(process.env.ALLOW_ORIGIN || "https://art.acousmatic-theatre.fr");
const STATION = String(process.env.STATION || "Radio Paillettes");

let publisher = null;
let startedAt = 0;
let mp3 = null;
let rtmp = null;
let lastError = "";
const listeners = new Set();

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN === "*" ? "*" : ALLOW_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function stopPipelines() {
  for (const proc of [mp3, rtmp]) {
    if (!proc) continue;
    try { proc.stdin.end(); } catch {}
    try { proc.kill("SIGTERM"); } catch {}
  }
  mp3 = null;
  rtmp = null;
}

function broadcastMp3(chunk) {
  for (const res of [...listeners]) {
    if (res.destroyed || res.writableEnded) {
      listeners.delete(res);
      continue;
    }
    try { res.write(chunk); } catch { listeners.delete(res); }
  }
}

function pipeErrors(proc, label) {
  proc.stderr.on("data", chunk => {
    const text = chunk.toString().trim();
    if (text) {
      lastError = `${label}: ${text.slice(-800)}`;
      console.error(lastError);
    }
  });
  proc.on("exit", (code, signal) => {
    if (code && code !== 0) {
      lastError = `${label} exited code=${code} signal=${signal || ""}`;
      console.error(lastError);
    }
  });
}

function startPipelines() {
  stopPipelines();
  lastError = "";

  mp3 = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning",
    "-fflags", "nobuffer",
    "-i", "pipe:0",
    "-vn",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ar", "48000",
    "-ac", "2",
    "-f", "mp3",
    "pipe:1"
  ], { stdio: ["pipe", "pipe", "pipe"] });

  rtmp = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning",
    "-fflags", "nobuffer",
    "-i", "pipe:0",
    "-vn",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "48000",
    "-ac", "2",
    "-f", "flv",
    MEDIAMTX_RTMP_URL
  ], { stdio: ["pipe", "ignore", "pipe"] });

  mp3.stdout.on("data", broadcastMp3);
  pipeErrors(mp3, "ffmpeg-mp3");
  pipeErrors(rtmp, "ffmpeg-rtmp");
}

function writePublisherChunk(data) {
  const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
  for (const proc of [mp3, rtmp]) {
    if (!proc?.stdin?.writable) continue;
    try { proc.stdin.write(chunk); } catch {}
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    cors(res);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === "/health") {
    return json(res, 200, { ok: true, service: "radio-paillettes-relay" });
  }

  if (url.pathname === "/status") {
    return json(res, 200, {
      station: STATION,
      onAir: !!publisher && publisher.readyState === WebSocket.OPEN,
      listeners: listeners.size,
      startedAt: startedAt || null,
      mediaMtx: MEDIAMTX_RTMP_URL ? "configured" : "disabled",
      lastError: lastError || null
    });
  }

  if (url.pathname === "/listen") {
    cors(res);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff"
    });
    res.flushHeaders?.();
    listeners.add(res);
    req.on("close", () => listeners.delete(res));
    return;
  }

  return json(res, 200, {
    ok: true,
    station: STATION,
    endpoints: ["/listen", "/status", "/health"],
    publish: "WebSocket /publish"
  });
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024 * 1024 });

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/publish") {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      return socket.destroy();
    }
    const token = url.searchParams.get("token") || "";
    if (!PUBLISH_TOKEN || token !== PUBLISH_TOKEN) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return socket.destroy();
    }
    if (publisher && publisher.readyState === WebSocket.OPEN) {
      socket.write("HTTP/1.1 409 Conflict\r\n\r\n");
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
  } catch {
    socket.destroy();
  }
});

wss.on("connection", ws => {
  publisher = ws;
  startedAt = Date.now();
  startPipelines();
  console.log(`ON AIR · ${STATION}`);

  ws.on("message", data => writePublisherChunk(data));
  ws.on("error", err => {
    lastError = `publisher: ${err?.message || err}`;
    console.error(lastError);
  });
  ws.on("close", () => {
    if (publisher === ws) publisher = null;
    startedAt = 0;
    stopPipelines();
    console.log(`STANDBY · ${STATION}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Radio Paillettes relay listening on :${PORT}`);
});

function shutdown() {
  try { publisher?.close(1001, "shutdown"); } catch {}
  stopPipelines();
  for (const res of listeners) try { res.end(); } catch {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
