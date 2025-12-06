import { Router } from "express";
import {
  getTokenData,
  getCurrentUser,
  getNotifications,
  getPagination,
} from "../../services/main/utility/utility.js";
import {
  getAllFixedData,
  checkUserLog,
  submitUserLog,
  getUserRole,
  getAdmins,
  getImages,
  getImageSesssionModel,
  getOtherRoles,
} from "../../services/main/shared/index.js";
import { getModelIds } from "../../services/main/admin/adminServices.js";

const router = Router();

/* ======================================================================================= */
/*                                  Notifications & Logs                                   */
/* ======================================================================================= */

// Notifications (paginated)
router.get("/notifications", async (req, res) => {
  const searchParams = req.query;
  const { limit = 9, skip = 1 } = getPagination(req);
  try {
    const { notifications, total } = await getNotifications(
      searchParams,
      limit,
      skip,
      false
    );
    const totalPages = Math.ceil(total / limit);

    if (!notifications) {
      return res.status(404).json({ message: "No new notifications" });
    }
    res.status(200).json({ data: notifications, totalPages, total });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error getting notification" });
  }
});

// Fixed data
router.get("/fixed-data", async (req, res) => {
  try {
    const result = await getAllFixedData();
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});

// User logs (get within time range)
router.get("/user-logs", async (req, res) => {
  try {
    const searchParams = req.query;
    const data = await checkUserLog(
      searchParams.userId,
      searchParams.startTime,
      searchParams.endTime
    );
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

// Submit user log
router.post("/user-logs", async (req, res) => {
  try {
    const data = await submitUserLog(
      req.body.userId,
      req.body.date,
      req.body.description,
      req.body.totalMinutes
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

/* ======================================================================================= */
/*                                    Users & Admins                                       */
/* ======================================================================================= */

// Get user role (by id)
router.get("/users/role/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const newUser = await getUserRole(userId);
    res.status(200).json({
      data: newUser,
      message: "Restricted countries updated successfully",
    });
  } catch (error) {
    console.error("Error fetching personal info:", error);
  }
});

// Admin users
router.get("/users/admins", async (req, res) => {
  try {
    const users = await getAdmins();
    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});

// Get user roles (multi-roles)
router.get("/roles", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const roles = await getOtherRoles(token.id);
    res.status(200).json({ data: roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "An error occurred while fetching roles" });
  }
});

/* ======================================================================================= */
/*                                     Image Session                                       */
/* ======================================================================================= */

// Get images (by patterns / spaces)
router.get("/images", async (req, res) => {
  try {
    const { patternIds, spaceIds } = req.query;
    const images = await getImages({
      patternIds: patternIds,
      spaceIds: spaceIds,
    });

    res.status(200).json({ data: images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});

// Get image session model
router.get("/", async (req, res) => {
  try {
    const data = await getImageSesssionModel({
      model: req.query.model,
      searchParams: req.query,
    });
    return res.status(200).json({ data });
  } catch (e) {
    console.error("Error fetching images:", e);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});

/* ======================================================================================= */
/*                                    Model IDs Helper                                     */
/* ======================================================================================= */

// Get ids for a model with search params
router.get("/ids", async (req, res) => {
  try {
    const model = req.query.model;
    delete req.query.model;
    const data = await getModelIds({
      searchParams: req.query,
      model,
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces" });
  }
});

export default router;
