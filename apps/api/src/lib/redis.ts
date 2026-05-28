import Redis from "ioredis";
import { environment } from "../config/environment.js";

declare global {
  var adaptiveRedis: Redis | undefined;
}

export const redis = globalThis.adaptiveRedis ?? new Redis(environment.redisUrl, { lazyConnect: true });

if (process.env.NODE_ENV !== "production") {
  globalThis.adaptiveRedis = redis;
}

export const ensureRedisConnected = async (): Promise<Redis> => {
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }

  return redis;
};
