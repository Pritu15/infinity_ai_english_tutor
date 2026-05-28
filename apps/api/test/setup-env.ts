process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-enough-entropy";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-enough-entropy";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
