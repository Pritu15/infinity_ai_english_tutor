import { Router, type Router as ExpressRouter } from "express";
import { HealthController } from "../controllers/health.controller.js";

const healthController = new HealthController();

// BUGFIX: Explicit router type keeps declaration emit portable under pnpm's nested dependency layout.
export const healthRouter: ExpressRouter = Router();

healthRouter.get("/health", healthController.show);
