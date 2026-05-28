import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { UserRole } from "@prisma/client";
import { HttpError } from "./error.middleware.js";
import { TokenService } from "../services/token.service.js";

const tokenService = new TokenService();

export const validateJWT = (request: Request, _response: Response, next: NextFunction): void => {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(new HttpError(StatusCodes.UNAUTHORIZED, "Missing bearer token"));
    return;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    request.user = {
      email: payload.email,
      id: payload.sub,
      role: payload.role as UserRole
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (roles: readonly UserRole[]) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      next(new HttpError(StatusCodes.UNAUTHORIZED, "Authentication required"));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new HttpError(StatusCodes.FORBIDDEN, "Insufficient role"));
      return;
    }

    next();
  };
