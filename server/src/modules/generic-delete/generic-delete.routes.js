import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { genericDeleteController } from "./generic-delete.controller.js";
import { genericDeleteSchemas } from "./generic-delete.validation.js";

// Restores master's single generic delete. The frontend's DeleteModelButton posts
// `shared/delete/:id` which the FE path-map rewrites to `/delete/:id`. Authenticated for any
// role (the legacy SHARED gate); the frozen deleteAModel service enforces the non-admin
// time-window guard, and the validation layer allow-lists which models may be deleted.
const genericDeleteRouter = Router();

genericDeleteRouter.delete(
  "/:id",
  AuthMiddleware.requireAuth,
  validate(genericDeleteSchemas.remove),
  asyncHandler(genericDeleteController.remove),
);

export { genericDeleteRouter };
