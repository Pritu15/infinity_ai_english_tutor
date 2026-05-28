import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { environment } from "../config/environment.js";
import { HttpError } from "../middleware/error.middleware.js";
import { StatusCodes } from "http-status-codes";

export interface AccessTokenPayload extends JwtPayload {
  email: string;
  role: string;
  sub: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  jti: string;
  sub: string;
}

export interface TokenPair {
  accessToken: string;
  refreshJti: string;
  refreshToken: string;
}

const signToken = (payload: object, secret: string, options: SignOptions): string =>
  jwt.sign(payload, secret, options);

export class TokenService {
  createTokenPair(user: { email: string; id: string; role: string }): TokenPair {
    // BUGFIX: use Node's native UUID generator so Jest does not load uuid's ESM-only build.
    const refreshJti = randomUUID();
    const accessToken = signToken(
      {
        email: user.email,
        role: user.role
      },
      environment.jwtAccessSecret,
      {
        // BUGFIX: jsonwebtoken's strict typings require the configured duration to match SignOptions.
        expiresIn: environment.jwtAccessExpiresIn as SignOptions["expiresIn"],
        subject: user.id
      }
    );
    const refreshToken = signToken({}, environment.jwtRefreshSecret, {
      // BUGFIX: jsonwebtoken's strict typings require the configured duration to match SignOptions.
      expiresIn: environment.jwtRefreshExpiresIn as SignOptions["expiresIn"],
      jwtid: refreshJti,
      subject: user.id
    });

    return {
      accessToken,
      refreshJti,
      refreshToken
    };
  }

  refreshTtlSeconds(): number {
    const match = /^(\d+)([dhms])$/.exec(environment.jwtRefreshExpiresIn);

    if (!match) {
      return 7 * 24 * 60 * 60;
    }

    const value = Number.parseInt(match[1] ?? "7", 10);
    const unit = match[2];
    const multiplier = unit === "d" ? 86_400 : unit === "h" ? 3_600 : unit === "m" ? 60 : 1;

    return value * multiplier;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, environment.jwtAccessSecret);

    if (!this.isAccessPayload(payload)) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid access token");
    }

    return payload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, environment.jwtRefreshSecret);

    if (!this.isRefreshPayload(payload)) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
    }

    return payload;
  }

  private isAccessPayload(payload: string | JwtPayload): payload is AccessTokenPayload {
    return (
      typeof payload !== "string" &&
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    );
  }

  private isRefreshPayload(payload: string | JwtPayload): payload is RefreshTokenPayload {
    return (
      typeof payload !== "string" &&
      typeof payload.sub === "string" &&
      typeof payload.jti === "string"
    );
  }
}
