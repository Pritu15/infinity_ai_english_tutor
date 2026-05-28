import type Redis from "ioredis";
import { ensureRedisConnected } from "../lib/redis.js";

const REFRESH_PREFIX = "refresh-session";

export interface RefreshSessionRecord {
  userId: string;
}

export class RefreshSessionRepository {
  constructor(private readonly redisFactory: () => Promise<Redis> = ensureRedisConnected) {}

  async create(jti: string, record: RefreshSessionRecord, ttlSeconds: number): Promise<void> {
    const redis = await this.redisFactory();
    await redis.set(this.key(jti), JSON.stringify(record), "EX", ttlSeconds);
  }

  async delete(jti: string): Promise<void> {
    const redis = await this.redisFactory();
    await redis.del(this.key(jti));
  }

  async find(jti: string): Promise<RefreshSessionRecord | null> {
    const redis = await this.redisFactory();
    const value = await redis.get(this.key(jti));

    if (!value) {
      return null;
    }

    return JSON.parse(value) as RefreshSessionRecord;
  }

  private key(jti: string): string {
    return `${REFRESH_PREFIX}:${jti}`;
  }
}
