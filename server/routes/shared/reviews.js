import { Router } from "express";
import {
  createAuthUrl,
  getLocations,
  getReviews,
  handleOAuthCallback,
} from "../../services/reviews.js";

const router = Router();

/* ======================================================================================= */
/*                              Reviews OAuth & Integration                                */
/* ======================================================================================= */

// OAuth callback
router.get("/oauth2callback", async (req, res) => {
  try {
    const token = await handleOAuthCallback(req.query.code);
    res.status(200).json({ data: token });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

// Locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await getLocations(req.query.code);
    res.status(200).json({ data: locations });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

// Reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await getReviews(req.query.accountId, req.query.locationId);
    res.status(200).json({ data: reviews });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

export default router;
