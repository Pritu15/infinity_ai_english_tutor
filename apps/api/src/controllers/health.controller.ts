import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HealthService } from "../services/health.service.js";

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  show = (_request: Request, response: Response): void => {
    response.status(StatusCodes.OK).json(this.healthService.getHealth());
  };
}
