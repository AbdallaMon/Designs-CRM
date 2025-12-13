import { Router } from "express";
import {
  createClientWithLead,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
} from "../../services/main/auth/authServices.js";
import {
  handlePrismaError,
  verifyToken,
} from "../../services/main/utility/utility.js";

const router = Router();

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await loginUser(email, password);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.status(200).json({
      status: 200,
      message: "Login successful, redirecting...",
      user,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: `خطأ: ${error.message}` });
  }
});
router.post("/register", async (req, res) => {
  try {
    const user = await createClientWithLead(req.body);

    res.status(200).json({
      status: 200,
      message:
        "Account successfully created, please check your email to verify your account.",
      user,
    });
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      res
        .status(400)
        .json({ status: 400, message: "This email is already registered" });
    } else {
      handlePrismaError(res, error);
    }
  }
});
// Logout Route
router.post("/logout", (req, res) => {
  try {
    const { token, options } = logoutUser();
    res.cookie("token", token, options);
    res.status(200).json({ status: 200, message: "Successfully logged out" });
  } catch (error) {
    res.status(500).json({ status: 500, message: `Error: ${error.message}` });
  }
});

// Check Login Status Route
router.get("/status", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ auth: false, message: "You are not logged in" });
  }
  try {
    const decoded = verifyToken(token, res);
    res.status(200).json({
      message: "User is authenticated",
      user: {
        id: decoded.id,
        role: decoded.role,
        accountStatus: decoded.accountStatus,
        ...decoded,
      },
      auth: true,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(400).json({
      message: "Your session has expired",
      error: error.message,
      auth: false,
    });
  }
});

router.post("/reset", async (req, res) => {
  const { email } = req.body;
  try {
    const message = await requestPasswordReset(email);
    res.status(200).json({ status: 200, message });
  } catch (error) {
    res.status(500).json({ status: 500, message: `Error: ${error.message}` });
  }
});

// Reset password route
router.post("/reset/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const message = await resetPassword(token, password);
    res.status(200).json({ status: 200, message });
  } catch (error) {
    res.status(500).json({ status: 500, message: `Error: ${error.message}` });
  }
});

export default router;
