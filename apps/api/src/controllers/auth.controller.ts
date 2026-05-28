import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { randomUUID } from "node:crypto";
import { environment } from "../config/environment.js";
import { HttpError } from "../middleware/error.middleware.js";
import { emailPasswordSchema, refreshTokenSchema } from "../schemas/auth.schemas.js";
import { AuthService, type AuthResult } from "../services/auth.service.js";

const isProduction = environment.nodeEnv === "production";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (request: Request, response: Response): Promise<void> => {
    const input = emailPasswordSchema.parse(request.body);
    const user = await this.authService.register(input.email, input.password);

    response.status(StatusCodes.CREATED).json({ user });
  };

  login = async (request: Request, response: Response): Promise<void> => {
    const input = emailPasswordSchema.parse(request.body);
    const authResult = await this.authService.login(input.email, input.password);

    this.sendAuthResult(response, StatusCodes.OK, authResult);
  };

  refresh = async (request: Request, response: Response): Promise<void> => {
    const input = refreshTokenSchema.parse(request.body ?? {});
    // BUGFIX: allow API clients to refresh with a body token without also requiring the browser cookie.
    const cookieToken = this.readRefreshCookie(request, !input.refreshToken);
    const authResult = await this.authService.refresh(input.refreshToken ?? cookieToken);

    this.sendAuthResult(response, StatusCodes.OK, authResult);
  };

  logout = async (request: Request, response: Response): Promise<void> => {
    const input = refreshTokenSchema.parse(request.body ?? {});
    await this.authService.logout(input.refreshToken ?? this.readRefreshCookie(request, false));
    response.clearCookie(environment.refreshCookieName);
    response.status(StatusCodes.NO_CONTENT).send();
  };

  googleRedirect = (_request: Request, response: Response): void => {
    // BUGFIX: use Node's native UUID generator so Jest does not load uuid's ESM-only build.
    response.redirect(this.authService.googleAuthUrl(randomUUID()));
  };

  googleCallback = async (request: Request, response: Response): Promise<void> => {
    const email = typeof request.query.email === "string" ? request.query.email : undefined;

    if (!email) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        "Google callback requires an email when OAuth exchange is not configured"
      );
    }

    const authResult = await this.authService.upsertGoogleUser(email.toLowerCase());
    this.sendAuthResult(response, StatusCodes.OK, authResult);
  };

  me = (request: Request, response: Response): void => {
    response.status(StatusCodes.OK).json({ user: request.user });
  };

  private readRefreshCookie(request: Request, required = true): string {
    const token = request.cookies?.[environment.refreshCookieName] as string | undefined;

    if (!token && required) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Missing refresh token");
    }

    return token ?? "";
  }

  private sendAuthResult(response: Response, statusCode: StatusCodes, authResult: AuthResult): void {
    response.cookie(environment.refreshCookieName, authResult.tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: isProduction
    });
    response.status(statusCode).json({
      accessToken: authResult.tokens.accessToken,
      refreshToken: authResult.tokens.refreshToken,
      user: authResult.user
    });
  }
}
