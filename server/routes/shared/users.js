import { Router } from "express";
import {
  getUserProfileById,
  updateUserProfileById,
} from "../../services/main/shared/userProfile.js";

const router = Router();
// userId/profile

router.get("/:userId/profile", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const userProfile = await getUserProfileById(userId);
    if (!userProfile) {
      return res
        .status(404)
        .json({ message: "User profile not found for the given userId." });
    }
    res.status(200).json({ data: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching user profile." });
  }
});

router.put("/:userId/profile", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const updates = req.body;

    const updatedProfile = await updateUserProfileById(userId, updates);
    res
      .status(200)
      .json({ data: updatedProfile, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating user profile." });
  }
});
export default router;
