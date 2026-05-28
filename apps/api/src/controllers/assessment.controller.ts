import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HttpError } from "../middleware/error.middleware.js";
import { assessmentStartSchema, assessmentSubmitSchema } from "../schemas/assessment.schemas.js";
import { AssessmentService } from "../services/assessment.service.js";

export class AssessmentController {
  constructor(private readonly assessmentService = new AssessmentService()) {}

  start = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Authentication required");
    }

    const input = assessmentStartSchema.parse(request.body ?? {});
    const assessment = await this.assessmentService.start(request.user.id, input.difficulty);

    response.status(StatusCodes.CREATED).json(assessment);
  };

  submit = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, "Authentication required");
    }

    const input = assessmentSubmitSchema.parse(request.body);
    const result = await this.assessmentService.submit(request.user.id, input);

    response.status(StatusCodes.OK).json(result);
  };
}
