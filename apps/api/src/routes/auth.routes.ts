import { Router, type Router as ExpressRouter } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireRole, validateJWT } from "../middleware/auth.middleware.js";

const authController = new AuthController();

export const authRouter: ExpressRouter = Router();

authRouter.post("/auth/register", asyncHandler(authController.register));
authRouter.post("/auth/login", asyncHandler(authController.login));
authRouter.post("/auth/refresh", asyncHandler(authController.refresh));
authRouter.post("/auth/logout", asyncHandler(authController.logout));
authRouter.get("/auth/google", authController.googleRedirect);
authRouter.get("/auth/google/callback", asyncHandler(authController.googleCallback));
authRouter.get("/auth/me", validateJWT, requireRole(["LEARNER", "TUTOR", "ADMIN"]), authController.me);
