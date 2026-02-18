import * as redis from "redis";
import { Response } from "express";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Health/retry config
const RAPID_RETRY_MAX = 10;
const RAPID_ERROR_THRESHOLD = 5000; // ms

interface RedisHealth {
  status: string;
  currentTime: number;
  lastConnectionTime: number | null;
  rapidReconnectCount: number;
  reconnectCount: number;
  timeSinceLastReconnectAttempt: number | null;
}

interface SSEConnection {
  res: Response;
  lastHeartbeatTime: number;
}

// Publisher health state
let pubRapidErrorCount = 0;
let pubReconnectionAttempt = 0;
let pubLastReconnectAttemptTime: number | null = null;
let pubLastConnectionTime: number | null = null;

// Subscriber health state
let subRapidErrorCount = 0;
let subReconnectionAttempt = 0;
let subLastReconnectAttemptTime: number | null = null;
let subLastConnectionTime: number | null = null;

const getRedisHealth = (name: string): RedisHealth => {
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

const handleRedisConnection = (client: any, name: string) => {
  const { reconnectCount, currentTime, status } = getRedisHealth(name);
  const info = reconnectCount ? `status: ${status}, reconnectCount: ${reconnectCount}` : `status: ${status}`;
  console.log(`Redis connected - ${name} server, on process: ${process.pid}`, info);

  if (name === "pub") pubLastConnectionTime = currentTime;
  if (name === "sub") subLastConnectionTime = currentTime;

  client.health = getRedisHealth(name);
};

const handleRedisReconnection = (name: string) => {
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

const handleRedisError = (name: string, error: any) => {
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
  console.log(`[Redis] Raw URL protocol: ${safeUrl.split("://")[0]}://`);
  console.log(`[Redis] URL starts with rediss://: ${safeUrl.startsWith("rediss://")}`);
  const parsedUrl = new URL(safeUrl);
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 6379;
  const username = parsedUrl.username || "default";
  const password = parsedUrl.password || "";
  const tls = safeUrl.startsWith("rediss://");

  console.log(`[Redis] Connection details - Host: ${host}, Port: ${port}, TLS: ${tls}, Username: ${username}`);

  if (!isClusterMode) {
    console.log("[Redis] Creating standalone Redis client");
    const clientConfig: any = {
      socket: {
        host,
        port,
        tls: tls
          ? {
              servername: host,
              checkServerIdentity: () => undefined,
            }
          : false,
        connectTimeout: 10000,
        lazyConnect: false,
      },
      username,
      password,
      url: safeUrl,
    };
    console.log(`[Redis] Client config TLS enabled: ${!!clientConfig.socket.tls}`);
    console.log(`[Redis] TLS servername: ${clientConfig.socket.tls ? clientConfig.socket.tls.servername : "N/A"}`);
    return redis.createClient(clientConfig);
  }

  console.log("[Redis] Creating Redis cluster client");
  return redis.createCluster({
    useReplicas: true,
    rootNodes: [
      {
        url: safeUrl,
        socket: {
          tls: tls
            ? {
                servername: host,
                checkServerIdentity: () => undefined,
              }
            : false,
          connectTimeout: 10000,
        },
      },
    ],
    defaults: { username, password },
  } as any);
}

const gameManager = {
  publisher: getRedisClient() as any,
  subscriber: getRedisClient() as any,
  connections: [] as SSEConnection[],
  publish: function (channel: string, message: any) {
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: async function (channel: string) {
    try {
      console.log(`[Redis] Attempting to subscribe to channel: ${channel}`);
      await this.subscriber.subscribe(channel, (message: string) => {
        const data = JSON.parse(message);
        this.connections.forEach(({ res: existingConnection }: SSEConnection) => {
          const { profileId } = (existingConnection as any).req.query;
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
  addConn: function (connection: SSEConnection) {
    const { profileId, interactiveNonce } = (connection.res as any).req.query;
    if (
      this.connections.some(
        ({ res: existingConnection }: SSEConnection) =>
          (existingConnection as any).req.query.interactiveNonce === interactiveNonce &&
          (existingConnection as any).req.query.profileId === profileId,
      )
    ) {
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }: SSEConnection) =>
            (existingConnection as any).req.query.interactiveNonce === interactiveNonce &&
            (existingConnection as any).req.query.profileId === profileId,
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
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }: SSEConnection) => {
      const isActive = lastHeartbeatTime > Date.now() - 10 * 60 * 1000;
      if (!isActive && process.env.NODE_ENV === "development") {
        console.log(`Connection to ${(res as any).req.query.interactiveNonce} deleted`);
      }
      return isActive;
    });
  },
  get: async function (key: string): Promise<string | null> {
    return await this.publisher.get(key);
  },
  set: async function (key: string, value: string) {
    await this.publisher.set(key, value);
  },
};

// Wire health handlers
gameManager.publisher.on("connect", () => handleRedisConnection(gameManager.publisher, "pub"));
gameManager.publisher.on("reconnecting", () => handleRedisReconnection("pub"));
gameManager.publisher.on("error", (err: any) => handleRedisError("pub", err));
gameManager.publisher.on("end", () => console.log("[Redis] Publisher connection ended"));
gameManager.publisher.on("ready", () => console.log("[Redis] Publisher is ready"));

gameManager.subscriber.on("connect", () => handleRedisConnection(gameManager.subscriber, "sub"));
gameManager.subscriber.on("reconnecting", () => handleRedisReconnection("sub"));
gameManager.subscriber.on("error", (err: any) => handleRedisError("sub", err));
gameManager.subscriber.on("end", () => console.log("[Redis] Subscriber connection ended"));
gameManager.subscriber.on("ready", () => console.log("[Redis] Subscriber is ready"));

// Initialize connections and subscription with proper sequencing
async function initRedis() {
  try {
    console.log(`[Redis] INTERACTIVE_KEY: ${process.env.INTERACTIVE_KEY}`);
    console.log(`[Redis] REDIS_URL: ${process.env.REDIS_URL ? "SET" : "NOT SET"}`);
    console.log(`[Redis] REDIS_CLUSTER_MODE: ${process.env.REDIS_CLUSTER_MODE}`);

    console.log("[Redis] Connecting publisher...");
    try {
      await gameManager.publisher.connect();
      console.log("[Redis] Publisher connected successfully");
    } catch (pubError: any) {
      console.error("[Redis] Publisher connection failed:", pubError.message);
      throw pubError;
    }

    console.log("[Redis] Connecting subscriber...");
    try {
      await gameManager.subscriber.connect();
      console.log("[Redis] Subscriber connected successfully");
    } catch (subError: any) {
      console.error("[Redis] Subscriber connection failed:", subError.message);
      throw subError;
    }

    // Subscribe only after connections are established
    const channelName = `${process.env.INTERACTIVE_KEY}_RACE`;
    console.log(`[Redis] Subscribing to channel: ${channelName}`);
    try {
      await gameManager.subscribe(channelName);
      console.log("[Redis] Subscription established successfully");
    } catch (subError: any) {
      console.error("[Redis] Subscription failed:", subError.message);
      throw subError;
    }

    console.log("[Redis] Redis initialization completed successfully");
  } catch (err: any) {
    console.error("[Redis] Initialization error:", err);
    console.error("[Redis] Error details:", err.message);
    if (err.stack) {
      console.error("[Redis] Stack trace:", err.stack);
    }
    console.error("[Redis] Redis will not be available for this session");
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
