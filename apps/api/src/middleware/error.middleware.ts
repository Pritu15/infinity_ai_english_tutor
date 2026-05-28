import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const notFoundHandler = (request: Request, _response: Response, next: NextFunction): void => {
  next(new HttpError(StatusCodes.NOT_FOUND, `Route not found: ${request.method} ${request.path}`));
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    response.status(StatusCodes.BAD_REQUEST).json({
      error: "Validation failed",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
};
