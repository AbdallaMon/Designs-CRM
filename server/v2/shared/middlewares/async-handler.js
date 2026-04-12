// المشكلة: Express ما بيمسكش async errors تلقائيًا. لو عملت throw جوا async function، Express مش هيعرف.
// الحل: wrapper يمسك الـ Promise ويبعت الـ error لـ next().
// بدونه: لازم try/catch في كل controller function.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/// ✅ With asyncHandler: clean controller, no try/catch
// router.post("/register", asyncHandler(authController.register));
// لو register رمى AppError → asyncHandler يبعته لـ next() → errorHandler يمسكه

// ❌ Without asyncHandler: try/catch in every single function
// export async function register(req, res, next) {
//   try {
//     const result = await authUseCase.register(req.body);
//     res.status(201).json({ success: true, data: result });
//   } catch (err) {
//     next(err); // لازم تعملها manually
//   }
// }
// ← لازم تكرر ده في كل controller function = duplication
