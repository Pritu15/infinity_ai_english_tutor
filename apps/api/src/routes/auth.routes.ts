import { Router, type Router as ExpressRouter } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireRole, validateJWT } from "../middleware/auth.middleware.js";
import type { AuthService } from "../services/auth.service.js";

export const createAuthRouter = (authService?: AuthService): ExpressRouter => {
  const authController = new AuthController(authService);
  const router: ExpressRouter = Router();

  router.post("/auth/register", asyncHandler(authController.register));
  router.post("/auth/login", asyncHandler(authController.login));
  router.post("/auth/refresh", asyncHandler(authController.refresh));
  router.post("/auth/logout", asyncHandler(authController.logout));
  router.get("/auth/google", authController.googleRedirect);
  router.get("/auth/google/callback", asyncHandler(authController.googleCallback));
  router.get("/auth/me", validateJWT, requireRole(["LEARNER", "TUTOR", "ADMIN"]), authController.me);

  return router;
};

export const authRouter: ExpressRouter = createAuthRouter();
