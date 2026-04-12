// ايه هو؟ آخر middleware في الـ app. أي throw أو next(err) بيوصل هنا.
// ليه في shared؟ لأنه بيمسك errors من كل الموديولات (auth, chat, أي حاجه).

import { AppError } from "./AppError.js";

// بيعمل ايه؟ يشوف لو AppError يرجع statusCode بتاعها، لو Error عادي يرجع 500.
export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// Global error handler — لازم يكون آخر app.use()
// Express بيعرف إنه error handler لأن عنده 4 parameters (err, req, res, next)
export function errorHandler(err, req, res, next) {
  console.error("Error caught by errorHandler:", err);

  if (err instanceof AppError) {
    // خطأ متوقع (400, 401, 404, 409, 422 ...)
    console.log("isAppError:", {
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // خطأ غير متوقع (database crash, bug, etc.)
  console.error("Unexpected error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

// ✅ in app.js (ORDER MATTERS):
// app.use("/api/auth", authRoutes);   // routes first
// app.use("/api/chat", chatRoutes);
// app.use(notFoundHandler);           // then 404
// app.use(errorHandler);              // then error handler LAST

// ❌ Bad: error handler before routes → will never catch anything
// app.use(errorHandler);
// app.use("/api/auth", authRoutes);
