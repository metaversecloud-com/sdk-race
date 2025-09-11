import * as redis from "redis";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Health/retry config
const RAPID_RETRY_MAX = 10;
const RAPID_ERROR_THRESHOLD = 5000; // ms

// Publisher health state
let pubRapidErrorCount = 0;
let pubReconnectionAttempt = 0;
let pubLastReconnectAttemptTime = null;
let pubLastConnectionTime = null;

// Subscriber health state
let subRapidErrorCount = 0;
let subReconnectionAttempt = 0;
let subLastReconnectAttemptTime = null;
let subLastConnectionTime = null;

const getRedisHealth = (name) => {
  const currentTime = Date.now();
  const lastConnectionTime = name === "pub" ? pubLastConnectionTime : subLastConnectionTime;
  const lastReconnectAttemptTime = name === "pub" ? pubLastReconnectAttemptTime : subLastReconnectAttemptTime;
  const rapidReconnectCount = name === "pub" ? pubRapidErrorCount : subRapidErrorCount;
  const reconnectCount = name === "pub" ? pubReconnectionAttempt : subReconnectionAttempt;
  const status = rapidReconnectCount < RAPID_RETRY_MAX ? "OK" : "UNHEALTHY";
  const timeSinceLastReconnectAttempt = lastReconnectAttemptTime ? currentTime - lastReconnectAttemptTime : null;

  return {
    status,
    currentTime,
    lastConnectionTime,
    rapidReconnectCount,
    reconnectCount,
    timeSinceLastReconnectAttempt,
  };
};

const handleRedisConnection = (client, name) => {
  const { reconnectCount, currentTime, status } = getRedisHealth(name);
  const info = reconnectCount ? `status: ${status}, reconnectCount: ${reconnectCount}` : `status: ${status}`;
  console.log(`Redis connected - ${name} server, on process: ${process.pid}`, info);

  if (name === "pub") pubLastConnectionTime = currentTime;
  if (name === "sub") subLastConnectionTime = currentTime;

  client.health = getRedisHealth(name);
};

const handleRedisReconnection = (name) => {
  const { currentTime, timeSinceLastReconnectAttempt } = getRedisHealth(name);

  if (name === "pub") {
    pubLastReconnectAttemptTime = currentTime;
    pubReconnectionAttempt++;
    if (timeSinceLastReconnectAttempt && timeSinceLastReconnectAttempt < RAPID_ERROR_THRESHOLD) {
      pubRapidErrorCount++;
    }
  }

  if (name === "sub") {
    subLastReconnectAttemptTime = currentTime;
    subReconnectionAttempt++;
    if (timeSinceLastReconnectAttempt && timeSinceLastReconnectAttempt < RAPID_ERROR_THRESHOLD) {
      subRapidErrorCount++;
    }
  }
};

const handleRedisError = (name, error) => {
  const { reconnectCount, rapidReconnectCount, status, timeSinceLastReconnectAttempt } = getRedisHealth(name);
  const info = reconnectCount
    ? `status: ${status}, reconnectCount: ${reconnectCount}, rapidReconnectCount: ${rapidReconnectCount} timeSinceLastReconnectAttempt: ${timeSinceLastReconnectAttempt}`
    : `status: ${status}`;
  console.error(`Redis error - ${name} server, on process: ${process.pid}, ${info}`);
  console.error(`Redis error details - ${error}`);
};

function getRedisClient(url = process.env.REDIS_URL) {
  let isClusterMode = false;
  if (typeof process.env.REDIS_CLUSTER_MODE === "undefined") {
    console.log("[Redis] Environment variable REDIS_CLUSTER_MODE is not set. Defaulting to false.");
  } else {
    isClusterMode = process.env.REDIS_CLUSTER_MODE === "true";
  }

  console.log(`[Redis] Creating Redis client - Cluster mode: ${isClusterMode}`);

  const safeUrl = url || "";
  const parsedUrl = new URL(safeUrl);
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 6379;
  const username = parsedUrl.username || "default";
  const password = parsedUrl.password || "";
  const tls = safeUrl.startsWith("rediss");

  console.log(`[Redis] Connection details - Host: ${host}, Port: ${port}, TLS: ${tls}, Username: ${username}`);

  if (!isClusterMode) {
    console.log("[Redis] Creating standalone Redis client");
    return redis.createClient({
      socket: { host, port, tls },
      username,
      password,
      url: safeUrl,
    });
  }

  console.log("[Redis] Creating Redis cluster client");
  return redis.createCluster({
    useReplicas: true,
    rootNodes: [
      {
        url: safeUrl,
        socket: { tls },
      },
    ],
    defaults: { username, password },
  });
}

const gameManager = {
  publisher: getRedisClient(),
  subscriber: getRedisClient(),
  connections: [],
  publish: function (channel, message) {
    if (process.env.NODE_ENV === "development") console.log(`Publishing ${JSON.stringify(message)} on ${channel}`);
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: async function (channel) {
    try {
      console.log(`[Redis] Attempting to subscribe to channel: ${channel}`);
      await this.subscriber.subscribe(channel, (message) => {
        const data = JSON.parse(message);
        if (process.env.NODE_ENV === "development") console.log(`Event received on ${channel}:`, data);
        this.connections.forEach(({ res: existingConnection }) => {
          const { profileId } = existingConnection.req.query;
          if (data.profileId === profileId) {
            existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(data)}\n\n`);
          }
        });
      });
      console.log(`[Redis] Successfully subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`[Redis] Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  },
  addConn: function (connection) {
    const { profileId, interactiveNonce } = connection.res.req.query;
    if (
      this.connections.some(
        ({ res: existingConnection }) =>
          existingConnection.req.query.interactiveNonce === interactiveNonce &&
          existingConnection.req.query.profileId === profileId,
      )
    ) {
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }) =>
            existingConnection.req.query.interactiveNonce === interactiveNonce &&
            existingConnection.req.query.profileId === profileId,
        ),
        1,
        connection,
      );
    } else {
      this.connections.push(connection);
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`Connection ${interactiveNonce} added. Length is ${this.connections.length}`);
    }
  },
  deleteConn: function () {
    // Remove inactive connections older than 10 minutes
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }) => {
      const isActive = lastHeartbeatTime > Date.now() - 10 * 60 * 1000;
      if (!isActive && process.env.NODE_ENV === "development") {
        console.log(`Connection to ${res.req.query.interactiveNonce} deleted`);
      }
      return isActive;
    });
  },
  get: async function (key) {
    return await this.publisher.get(key);
  },
  set: async function (key, value) {
    await this.publisher.set(key, value);
  },
};

// Wire health handlers
gameManager.publisher.on("connect", () => handleRedisConnection(gameManager.publisher, "pub"));
gameManager.publisher.on("reconnecting", () => handleRedisReconnection("pub"));
gameManager.publisher.on("error", (err) => handleRedisError("pub", err));

gameManager.subscriber.on("connect", () => handleRedisConnection(gameManager.subscriber, "sub"));
gameManager.subscriber.on("reconnecting", () => handleRedisReconnection("sub"));
gameManager.subscriber.on("error", (err) => handleRedisError("sub", err));

// Initialize connections and subscription with proper sequencing
async function initRedis() {
  try {
    console.log(`[Redis] INTERACTIVE_KEY: ${process.env.INTERACTIVE_KEY}`);
    console.log(`[Redis] REDIS_URL: ${process.env.REDIS_URL ? 'SET' : 'NOT SET'}`);
    console.log(`[Redis] REDIS_CLUSTER_MODE: ${process.env.REDIS_CLUSTER_MODE}`);
    
    console.log("[Redis] Connecting publisher...");
    await gameManager.publisher.connect();
    console.log("[Redis] Publisher connected successfully");
    
    console.log("[Redis] Connecting subscriber...");
    await gameManager.subscriber.connect();
    console.log("[Redis] Subscriber connected successfully");
    
    // Subscribe only after connections are established
    console.log(`[Redis] Subscribing to channel: ${process.env.INTERACTIVE_KEY}_RACE`);
    await gameManager.subscribe(`${process.env.INTERACTIVE_KEY}_RACE`);
    console.log("[Redis] Subscription established");
  } catch (err) {
    console.error("[Redis] Initialization error:", err);
    console.error("[Redis] Error details:", err.message);
    console.error("[Redis] Stack trace:", err.stack);
  }
}

// Kick off initialization (top-level)
initRedis();

// Periodically prune stale SSE connections
setInterval(() => {
  if (gameManager.connections.length > 0) {
    gameManager.deleteConn();
  }
}, 1000 * 60);

export default gameManager;
