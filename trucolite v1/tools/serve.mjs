import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg"
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost:8080").pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.stat(target, (statError, stats) => {
    if (statError) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const file = stats.isDirectory() ? path.join(target, "index.html") : target;
    fs.stat(file, (fileStatError, fileStats) => {
      if (fileStatError) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const totalSize = fileStats.size;
      const contentType = mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = request.headers.range;

      // HTTP Range request support for smooth audio streaming
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        if (start >= totalSize || end >= totalSize || start > end) {
          response.writeHead(416, { "Content-Range": `bytes */${totalSize}` });
          response.end();
          return;
        }
        const chunkSize = (end - start) + 1;
        response.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType
        });
        if (request.method === "HEAD") {
          response.end();
        } else {
          fs.createReadStream(file, { start, end }).pipe(response);
        }
      } else {
        response.writeHead(200, {
          "Accept-Ranges": "bytes",
          "Content-Length": totalSize,
          "Content-Type": contentType
        });
        if (request.method === "HEAD") {
          response.end();
        } else {
          fs.createReadStream(file).pipe(response);
        }
      }
    });
  });
});

server.listen(8080, "127.0.0.1", () => {
  console.log("Trucolite available at http://localhost:8080");
});
