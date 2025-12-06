import { Router } from "express";
import { getCurrentUser } from "../../services/main/utility/utility.js";
import {
  getDeliveryScheduleByProjectId,
  createNewDeliverySchedule,
  linkADeliveryToMeeting,
  deleteDeliverySchedule,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                 Delivery Schedule                                       */
/* ======================================================================================= */

// Delivery schedules of a project
router.get("/:projectId/schedules", async (req, res) => {
  try {
    const { projectId } = req.params;
    const deliverySchedule = await getDeliveryScheduleByProjectId({
      projectId,
    });
    res.status(200).json({ data: deliverySchedule });
  } catch (error) {
    console.error("Error fetching delivery schedule:", error);
    res.status(500).json({ message: "Failed to fetch delivery schedule." });
  }
});

// Create delivery schedule
router.post("/", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newDelivery = await createNewDeliverySchedule({
      userId: user.id,
      ...req.body,
    });
    res.status(200).json({ data: newDelivery, message: "Added Successfully" });
  } catch (error) {
    console.error("Error creating delivery schedule:", error);
    res.status(500).json({ message: "Failed to create delivery schedule." });
  }
});

// Link delivery schedule to meeting
router.post("/:deliveryId/link-meeting", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { meetingReminderId } = req.body;
    const updatedDelivery = await linkADeliveryToMeeting({
      deliveryId,
      meetingReminderId: meetingReminderId,
    });
    res
      .status(200)
      .json({ data: updatedDelivery, message: "Linked Successfully" });
  } catch (error) {
    console.error("Error linking delivery to meeting:", error);
    res.status(500).json({ message: "Failed to link delivery to meeting." });
  }
});

// Delete delivery schedule
router.delete("/:deliveryId", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    await deleteDeliverySchedule({ deliveryId });
    res.status(200).json({ message: "Delivery deleted successfully" });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    res.status(500).json({ message: "Failed to delete delivery." });
  }
});

export default router;
