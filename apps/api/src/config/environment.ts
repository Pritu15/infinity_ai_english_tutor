import "dotenv/config";

const DEFAULT_PORT = 4000;

export const environment = {
  apiName: "Adaptive AI Tutor API",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "development-access-secret",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "development-refresh-secret",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6380",
  refreshCookieName: "adaptive_refresh_token"
} as const;
