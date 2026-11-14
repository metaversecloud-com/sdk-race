// Minimal in-memory Redis (RESP2) for the e2e suite. Race keeps per-run checkpoint state in Redis
// (key = profileId) and fans checkpoint/badge updates out over pub/sub to the SSE stream at
// /api/events. Covers only what node-redis and the app use: GET, SET, DEL, PUBLISH, SUBSCRIBE, PING,
// plus the connection handshake (AUTH, SELECT, CLIENT SETINFO), which is acknowledged with OK.
// Every test uses its own profileId, so keys never collide between parallel tests.

import net from "node:net";

const PORT = Number(process.env.MOCK_REDIS_PORT || 3102);

const store = new Map();
const subscribers = new Map(); // channel -> Set<socket>

const simple = (s) => `+${s}\r\n`;
const integer = (n) => `:${n}\r\n`;
const bulk = (s) => (s === null || s === undefined ? "$-1\r\n" : `$${Buffer.byteLength(s)}\r\n${s}\r\n`);
const array = (items) => `*${items.length}\r\n${items.join("")}`;

// Parses as many complete RESP arrays as the buffer holds; returns [commands, rest].
const parse = (buffer) => {
  const commands = [];
  let offset = 0;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0x2a /* '*' */) {
      // Inline command (e.g. redis-cli "PING")
      const end = buffer.indexOf("\r\n", offset);
      if (end === -1) break;
      commands.push(buffer.subarray(offset, end).toString().trim().split(/\s+/));
      offset = end + 2;
      continue;
    }
    const lineEnd = buffer.indexOf("\r\n", offset);
    if (lineEnd === -1) break;
    const count = Number(buffer.subarray(offset + 1, lineEnd).toString());
    let cursor = lineEnd + 2;
    const args = [];
    let complete = true;
    for (let i = 0; i < count; i++) {
      const lenEnd = buffer.indexOf("\r\n", cursor);
      if (lenEnd === -1) {
        complete = false;
        break;
      }
      const len = Number(buffer.subarray(cursor + 1, lenEnd).toString());
      const start = lenEnd + 2;
      if (buffer.length < start + len + 2) {
        complete = false;
        break;
      }
      args.push(buffer.subarray(start, start + len).toString());
      cursor = start + len + 2;
    }
    if (!complete) break;
    commands.push(args);
    offset = cursor;
  }
  return [commands, buffer.subarray(offset)];
};

const handle = (socket, [rawName, ...args]) => {
  const name = String(rawName || "").toUpperCase();
  switch (name) {
    case "PING":
      return simple("PONG");
    case "GET":
      return bulk(store.has(args[0]) ? store.get(args[0]) : null);
    case "SET":
      store.set(args[0], args[1]);
      return simple("OK");
    case "DEL": {
      let removed = 0;
      for (const key of args) if (store.delete(key)) removed++;
      return integer(removed);
    }
    case "PUBLISH": {
      const [channel, message] = args;
      const sockets = subscribers.get(channel) || new Set();
      for (const s of sockets) s.write(array([bulk("message"), bulk(channel), bulk(message)]));
      return integer(sockets.size);
    }
    case "SUBSCRIBE":
      return args
        .map((channel, i) => {
          if (!subscribers.has(channel)) subscribers.set(channel, new Set());
          subscribers.get(channel).add(socket);
          return array([bulk("subscribe"), bulk(channel), integer(i + 1)]);
        })
        .join("");
    case "QUIT":
      socket.end(simple("OK"));
      return "";
    default:
      // AUTH, SELECT, CLIENT SETINFO, ... : nothing to do in a single-tenant fake.
      return simple("OK");
  }
};

const server = net.createServer((socket) => {
  let pending = Buffer.alloc(0);
  socket.on("data", (chunk) => {
    pending = Buffer.concat([pending, chunk]);
    const [commands, rest] = parse(pending);
    pending = rest;
    for (const command of commands) {
      const reply = handle(socket, command);
      if (reply) socket.write(reply);
    }
  });
  const forget = () => {
    for (const sockets of subscribers.values()) sockets.delete(socket);
  };
  socket.on("close", forget);
  socket.on("error", forget);
});

server.listen(PORT, () => console.log(`[mock-redis] listening on redis://localhost:${PORT}`));

