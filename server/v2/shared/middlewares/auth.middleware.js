import { AppError } from "../errors/AppError.js";
import { JwtService } from "../../infra/security/jwt.js";
class AuthMiddleware {
  static requireAuth(req, res, next) {
    const token = req.cookies?.[JwtService.currentMainTokenName];
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const payload = JwtService.verifyAccess(token);
      req.auth = payload;
      next();
    } catch (error) {
      console.log("AuthMiddleware: requireAuth - error:", error);
      throw new AppError("Invalid or expired token", 401);
    }
  }
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.auth) {
        throw new AppError("Unauthorized", 401);
      }
      if (!allowedRoles.includes(req.auth.activeRole || req.auth.role)) {
        throw new AppError(
          "Forbidden: insufficient permissions",
          403,
          "Your role does not have access to this resource",
        );
      }
      next();
    };
  }
}

export { AuthMiddleware };
