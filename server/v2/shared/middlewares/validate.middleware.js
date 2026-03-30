// يه هو؟ middleware عام بيستقبل Zod schema ويشيك الداتا قبل ما توصل للـ controller.
// ليه في shared؟ لأن كل موديول محتاج validation (auth, chat, orders...).
// بيعمل ايه؟ يشيك على req.body أو req.params أو req.query حسب ما تحدد.
// لو فشل: يرمي AppError بـ 422 + تفاصيل الحقول الغلط.

import { AppError } from "../errors/AppError.js";

// src/shared/middlewares/validate.middleware.js

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      // throw new AppError("Validation failed", 422, details);
      next(new AppError("Validation failed", 422, details));
      return;
    }

    // ✅ نستبدل req[source] بالبيانات المنظفة (Zod strips unknown fields)
    req[source] = result.data;
    next();
  };
}

// ✅ Usage in routes:
// validate body:
// router.post("/register", validate(registerSchema), asyncHandler(ctrl.register));
// validate params:
// router.get("/rooms/:roomId", validate(roomIdSchema, "params"), asyncHandler(ctrl.getRoom));
// validate query:
// router.get("/messages", validate(messagesQuerySchema, "query"), asyncHandler(ctrl.list));

// ❌ Bad: validation inside controller
// export async function register(req, res) {
//   if (!req.body.email) return res.status(400).json({ message: "Email required" });
//   if (!req.body.password) return res.status(400).json({ message: "Password required" });
//   if (req.body.password.length < 8) return res.status(400).json({ ... });
// ← messy, duplicated, no standard format
// }
