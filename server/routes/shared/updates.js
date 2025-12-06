import { Router } from "express";
import { getCurrentUser } from "../../services/main/utility/utility.js";
import {
  getUpdates,
  getSharedSettings,
  createAnUpdate,
  authorizeDepartmentToUpdate,
  unAuthorizeDepartmentToUpdate,
  toggleArchieveAnUpdate,
  toggleArchieveASharedUpdate,
  markAnUpdateAsDone,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                      Updates                                            */
/* ======================================================================================= */

// List updates for a client lead
router.get("/:clientLeadId", async (req, res) => {
  try {
    const searchParams = {
      ...req.query,
      clientLeadId: req.params.clientLeadId,
    };
    const user = await getCurrentUser(req);
    const updates = await getUpdates(
      searchParams,
      user.role === "ADMIN" || user.role === "SUPER_ADMIN"
    );
    res.status(200).json({ data: updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching updates." });
  }
});

// Get shared settings for a specific update
router.get("/shared-settings/:updateId", async (req, res) => {
  try {
    const updates = await getSharedSettings(req.params.updateId);
    res.status(200).json({ data: updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching updates." });
  }
});

// Create a new update
router.post("/:clientLeadId", async (req, res) => {
  try {
    const searchParams = { ...req.query };
    req.body.clientLeadId = Number(req.params.clientLeadId);
    const user = await getCurrentUser(req);
    const newUpdate = await createAnUpdate({
      data: req.body,
      searchParams,
      userId: user.id,
    });
    res
      .status(200)
      .json({ data: newUpdate, message: "Update created successfully." });
  } catch (error) {
    console.error("Error creating update:", error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the update." });
  }
});

/* ======================================================================================= */
/*                              Authorization/Approval                                     */
/* ======================================================================================= */

// Authorize department to access an update
router.post("/:updateId/authorize", async (req, res) => {
  try {
    const result = await authorizeDepartmentToUpdate({
      type: req.body.type,
      updateId: req.params.updateId,
    });
    res
      .status(200)
      .json({ data: result, message: "Department authorized successfully." });
  } catch (error) {
    console.error("Error authorizing department:", error);
    res
      .status(500)
      .json({ message: "An error occurred while authorizing department." });
  }
});

// Unauthorize department from a shared update
router.post("/:updateId/authorize/shared", async (req, res) => {
  try {
    const result = await unAuthorizeDepartmentToUpdate({
      updateId: req.params.updateId,
      type: req.body.type,
    });
    res.status(200).json({
      data: result,
      message: "Department unauthorized successfully.",
    });
  } catch (error) {
    console.error("Error unauthorizing department:", error);
    res
      .status(500)
      .json({ message: "An error occurred while unauthorizing department." });
  }
});

/* ======================================================================================= */
/*                              Archive/Unarchive                                          */
/* ======================================================================================= */

// Archive / unarchive update
router.put("/:updateId/archive", async (req, res) => {
  try {
    const result = await toggleArchieveAnUpdate({
      updateId: req.params.updateId,
      isArchived: req.body.isArchived,
    });
    res
      .status(200)
      .json({ data: result, message: "Update archive toggled successfully." });
  } catch (error) {
    console.error("Error archiving update:", error);
    res
      .status(500)
      .json({ message: "An error occurred while toggling archive state." });
  }
});

// Archive / unarchive shared update
router.put("/shared-updates/:sharedUpdateId/archive", async (req, res) => {
  try {
    const data = await toggleArchieveASharedUpdate({
      sharedUpdateId: req.params.sharedUpdateId,
      isArchived: req.body.isArchived,
    });
    res
      .status(200)
      .json({ message: "Shared update archive toggled successfully.", data });
  } catch (error) {
    console.error("Error archiving shared update:", error);
    res.status(500).json({
      message: "An error occurred while toggling shared update archive.",
    });
  }
});

/* ======================================================================================= */
/*                                 Mark as Done                                            */
/* ======================================================================================= */

// Mark update as done (and optionally archive)
router.put("/:updateId/mark-done", async (req, res) => {
  try {
    const data = req.body;
    const update = await markAnUpdateAsDone({
      updateId: req.params.updateId,
      clientLeadId: data.clientLeadId,
      isArchived: data.isArchived,
    });
    res.status(200).json({
      data: update,
      message: `Client lead update has been marked as done${
        data.isArchived ? " and has been archievd" : ""
      }.`,
    });
  } catch (error) {
    console.error("Error archiving shared update:", error);
    res.status(500).json({
      message: "An error occurred while toggling shared update archive.",
    });
  }
});

export default router;
