import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";
import { environment } from "./config/environment.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { createAssessmentRouter } from "./routes/assessment.routes.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import type { AssessmentService } from "./services/assessment.service.js";
import type { AuthService } from "./services/auth.service.js";

interface AppDependencies {
  assessmentService?: AssessmentService;
  authService?: AuthService;
}

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: environment.corsOrigin
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(healthRouter);
  app.use(createAuthRouter(dependencies.authService));
  app.use(createAssessmentRouter(dependencies.assessmentService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
