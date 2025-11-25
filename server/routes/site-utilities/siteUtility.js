import { Router } from "express";
import {
  createContractPaymentConditions,
  deleteContractPaymentConditions,
  getContractPaymentConditions,
  getPdfSiteUtilities,
  updateContractPaymentConditions,
  updatePdfSiteUtilities,
} from "../../services/main/siteUtilityServices.js";
import contractUtilityRouter from "./contract-utilities.js";
const router = Router();
router.use("/contract-utility", contractUtilityRouter);
router.get("/pdf-utility", async (req, res) => {
  try {
    const data = await getPdfSiteUtilities();
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error fetching site utilities:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching site utilities" });
  }
});

router.post("/pdf-utility", async (req, res) => {
  try {
    const data = await updatePdfSiteUtilities({ data: req.body });
    res
      .status(200)
      .json({ data: data, message: "Site utilities updated successfully" });
  } catch (error) {
    console.error("Error creating site utilities:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get("/contract-payment-conditions", async (req, res) => {
  try {
    const data = await getContractPaymentConditions();
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error fetching contract payment conditions:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching site utilities" });
  }
});

router.post("/contract-payment-conditions", async (req, res) => {
  try {
    const data = await createContractPaymentConditions({ data: req.body });
    res.status(200).json({
      data: data,
      message: "Contract payment conditions created successfully",
    });
  } catch (error) {
    console.error("Error creating contract payment conditions:", error.message);
    res.status(500).json({ message: error.message });
  }
});
router.put("/contract-payment-conditions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await updateContractPaymentConditions({
      id: Number(id),
      data: req.body,
    });
    res.status(200).json({
      data: data,
      message: "Contract payment conditions updated successfully",
    });
  } catch (error) {
    console.error("Error updating contract payment conditions:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/contract-payment-conditions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await deleteContractPaymentConditions({ id: Number(id) });
    res.status(200).json({
      data: data,
      message: "Contract payment conditions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contract payment conditions:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
