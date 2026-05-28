import request from "supertest";
import type { User } from "@prisma/client";
import { createApp } from "../src/app.js";
import { AuthService } from "../src/services/auth.service.js";

class InMemoryUserRepository {
  private readonly users = new Map<string, User>();

  async create(input: {
    email: string;
    oauthProvider?: string;
    passwordHash?: string;
    role?: User["role"];
  }): Promise<User> {
    const user: User = {
      createdAt: new Date(),
      email: input.email,
      id: `user_${this.users.size + 1}`,
      oauthProvider: input.oauthProvider ?? null,
      passwordHash: input.passwordHash ?? null,
      role: input.role ?? "LEARNER"
    };

    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}

class InMemoryRefreshSessionRepository {
  private readonly sessions = new Map<string, { userId: string }>();

  async create(jti: string, record: { userId: string }, _ttlSeconds: number): Promise<void> {
    this.sessions.set(jti, record);
  }

  async delete(jti: string): Promise<void> {
    this.sessions.delete(jti);
  }

  async find(jti: string): Promise<{ userId: string } | null> {
    return this.sessions.get(jti) ?? null;
  }
}

const buildApp = () => {
  const authService = new AuthService(
    new InMemoryUserRepository() as never,
    new InMemoryRefreshSessionRepository() as never
  );

  return createApp({ authService });
};

describe("auth flow", () => {
  it("registers, logs in, accesses a protected route, refreshes, and logs out", async () => {
    const app = buildApp();
    const credentials = {
      email: "learner@example.com",
      password: "StrongPassword123"
    };

    const registerResponse = await request(app).post("/auth/register").send(credentials).expect(201);

    expect(registerResponse.body.user).toMatchObject({
      email: credentials.email,
      role: "LEARNER"
    });
    expect(registerResponse.body.user.passwordHash).toBeUndefined();

    const loginResponse = await request(app).post("/auth/login").send(credentials).expect(200);

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));
    expect(loginResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("adaptive_refresh_token=")])
    );

    const protectedResponse = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(protectedResponse.body.user).toMatchObject({
      email: credentials.email,
      role: "LEARNER"
    });

    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.refreshToken);

    await request(app)
      .post("/auth/logout")
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(204);

    await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(401);
  });

  it("redirects to Google OAuth and accepts callback email fallback", async () => {
    const app = buildApp();

    const redirectResponse = await request(app).get("/auth/google").expect(302);
    expect(redirectResponse.headers.location).toContain("https://accounts.google.com/o/oauth2/v2/auth");

    const callbackResponse = await request(app)
      .get("/auth/google/callback")
      .query({ email: "oauth@example.com" })
      .expect(200);

    expect(callbackResponse.body.user).toMatchObject({
      email: "oauth@example.com",
      role: "LEARNER"
    });
    expect(callbackResponse.body.accessToken).toEqual(expect.any(String));
  });
});
