// ايه هو؟ middleware بيشيك إن الريكوست فيه توكن صحيح.
// ليه في shared مش في modules/auth؟ لأن كل موديول محتاج يحمي routes بتاعته (chat, orders, profile...)، مش auth بس.

import { AppError } from "../errors/AppError";

// بيعمل ايه؟ يقرأ Authorization: Bearer TOKEN → يعمل verify → يحط الـ user data في req.auth.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Missing or invalid Authorization header", 401);
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyToken(token);
    // نحط بيانات اليوزر في req.auth عشان أي controller بعده يقدر يستخدمها
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}

// ✅ Usage in ANY module's routes:
// Auth module:
// router.get("/me", requireAuth, asyncHandler(authController.getMe));
// Chat module:
// router.post(
//   "/rooms/:id/messages",
//   requireAuth,
//   asyncHandler(chatController.send),
// );
// Orders module:
// router.get("/orders", requireAuth, asyncHandler(orderController.list));

// ❌ Bad: putting auth check inside each controller manually
// export async function send(req, res) {
//   const token = req.headers.authorization?.split(" ")[1];
//   const payload = jwt.verify(token, process.env.JWT_SECRET); // duplicated everywhere
// }
