import { AppError } from "../errors/AppError.js";
import { JwtService } from "../../infra/security/jwt.js";
import { AuthSchema } from "../../modules/auth/auth.dto.js";

class AuthMiddleware {
  static requireAuth(req, res, next) {
    const token = req.cookies?.[AuthSchema.cookieNames.ACCESS];
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const payload = JwtService.verifyAccess(token);
      req.auth = payload;
      next();
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }
  }
  static requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.auth) {
        throw new AppError("Unauthorized", 401);
      }
      if (!allowedRoles.includes(req.auth.activeRole)) {
        throw new AppError("Forbidden: insufficient permissions", 403);
      }
      next();
    };
  }
}

export { AuthMiddleware };
