import { Router, type Router as ExpressRouter } from "express";
import { AssessmentController } from "../controllers/assessment.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validateJWT } from "../middleware/auth.middleware.js";
import type { AssessmentService } from "../services/assessment.service.js";

export const createAssessmentRouter = (assessmentService?: AssessmentService): ExpressRouter => {
  const assessmentController = new AssessmentController(assessmentService);
  const router = Router();

  router.post("/assessment/start", validateJWT, asyncHandler(assessmentController.start));
  router.post("/assessment/submit", validateJWT, asyncHandler(assessmentController.submit));

  return router;
};

export const assessmentRouter = createAssessmentRouter();
