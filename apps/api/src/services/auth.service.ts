import bcrypt from "bcryptjs";
import type { User, UserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { environment } from "../config/environment.js";
import { HttpError } from "../middleware/error.middleware.js";
import { RefreshSessionRepository } from "../repositories/refresh-session.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { TokenService, type TokenPair } from "./token.service.js";

export interface AuthResult {
  tokens: TokenPair;
  user: PublicUser;
}

export interface PublicUser {
  email: string;
  id: string;
  role: UserRole;
}

export class AuthService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly refreshSessionRepository = new RefreshSessionRepository(),
    private readonly tokenService = new TokenService()
  ) {}

  async register(email: string, password: string): Promise<PublicUser> {
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new HttpError(StatusCodes.CONFLICT, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({ email, passwordHash });

    return this.toPublicUser(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(email);

    if (!user?.passwordHash) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const tokens = await this.issueTokenPair(user);

    return {
      tokens,
      user: this.toPublicUser(user)
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.refreshSessionRepository.find(payload.jti);

    if (!session || session.userId !== payload.sub) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Refresh session is no longer valid");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Refresh user no longer exists");
    }

    await this.refreshSessionRepository.delete(payload.jti);
    const tokens = await this.issueTokenPair(user);

    return {
      tokens,
      user: this.toPublicUser(user)
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      await this.refreshSessionRepository.delete(payload.jti);
    } catch {
      return;
    }
  }

  googleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: environment.googleClientId,
      redirect_uri: environment.googleCallbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async upsertGoogleUser(email: string): Promise<AuthResult> {
    const user =
      (await this.userRepository.findByEmail(email)) ??
      (await this.userRepository.create({ email, oauthProvider: "google" }));
    const tokens = await this.issueTokenPair(user);

    return {
      tokens,
      user: this.toPublicUser(user)
    };
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const tokens = this.tokenService.createTokenPair(user);
    await this.refreshSessionRepository.create(
      tokens.refreshJti,
      { userId: user.id },
      this.tokenService.refreshTtlSeconds()
    );

    return tokens;
  }

  private toPublicUser(user: User): PublicUser {
    return {
      email: user.email,
      id: user.id,
      role: user.role
    };
  }
}
