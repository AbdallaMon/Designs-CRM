import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { genericDeleteController } from "./generic-delete.controller.js";
import { genericDeleteSchemas } from "./generic-delete.validation.js";

// Authenticated, allow-listed compatibility delete surface. Object scope and model
// validation run before the usecase enforces profile-specific time windows.
const genericDeleteRouter = Router();

genericDeleteRouter.delete(
  "/:id",
  AuthMiddleware.requireAuth,
  validate(genericDeleteSchemas.remove),
  AuthMiddleware.requireSpecialChecker(genericDeleteController.checkIfUserCanDeleteModel),
  asyncHandler(genericDeleteController.deleteModel),
);

export { genericDeleteRouter };
