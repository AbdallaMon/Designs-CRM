// client-portal/languages route — PUBLIC languages lookup. Legacy
// `routes/client/languages.js` (`GET /languages`), mounted PATHLESS under `/client`. Mounted
// under v2 at `/v2/client/languages`. PUBLIC BY DESIGN — a read-only lookup the website
// consumes before any client identity exists; NO auth, exactly like legacy.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { languagesController as c } from "./languages.controller.js";
import { LanguagesValidation as V } from "./languages.validation.js";

const router = Router();

router.get("/", validate(V.listQuery, "query"), asyncHandler(c.list));

export { router as clientLanguagesRouter };
