import { Router } from "express";
import {
  getAndThrowError,
  getCurrentUser,
} from "../../services/main/utility/utility.js";
import {
  getSalesStages,
  editSalesSage,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                   Sales Stages                                          */
/* ======================================================================================= */

// Get sales stages for a lead
router.get("/:clientLeadId", async (req, res) => {
  try {
    console.log("Fetching sales stages for lead:", req.params.clientLeadId);
    const imageSesssions = await getSalesStages({
      clientLeadId: Number(req.params.clientLeadId),
    });
    res.status(200).json({ data: imageSesssions });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

// Edit sales stage
router.post("/:clientLeadId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newSession = await editSalesSage({
      clientLeadId: Number(req.params.clientLeadId),
      ...req.body,
    });
    res
      .status(200)
      .json({ data: newSession, message: "Stage updated succussfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

export default router;
