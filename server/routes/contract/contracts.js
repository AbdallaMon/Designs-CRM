import { Router } from "express";
import {
  createContract,
  createContractDrawing,
  createContractSpecialItem,
  createContractStage,
  updateContractStage,
  createNewContractPayment,
  deleteContractDrawing,
  deleteContractPayment,
  deleteContractSpecialItem,
  deleteContractStage,
  generatePdfSessionToken,
  getContractDetailsById,
  getLeadContractList,
  updateContractBasics,
  updateContractDrwaing,
  updateContractPayment,
  updateContractPaymentStatus,
  updateContractSpecialItem,
  markContractAsCancelled,
  getContractPaymentsGroupedService,
} from "../../services/main/contract/contractServices.js";

const router = Router();

router.get("/client-lead/:leadId", async (req, res) => {
  try {
    const leadId = req.params.leadId;
    const result = await getLeadContractList({ leadId });
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const result = await createContract({ payload });
    res.status(200).json({ data: result, message: "Contract created" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.get("/:contractId", async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const result = await getContractDetailsById({ contractId });
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});
router.patch("/:contractId/cancel", async (req, res) => {
  try {
    const result = await markContractAsCancelled({
      contractId: Number(req.params.contractId),
    });
    res.status(200).json({ data: result, message: "Contract Cancelled" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.put("/:contractId/basics", async (req, res) => {
  try {
    const payload = req.body;
    const result = await updateContractBasics({
      contractId: Number(req.params.contractId),
      ...payload,
    });
    res.status(200).json({ data: result, message: "Contract updated" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.patch("/:contractId", async (req, res) => {
  try {
    const result = await generatePdfSessionToken({
      contractId: Number(req.params.contractId),
    });
    res.status(200).json({ data: result, message: "Session token generated" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/:contractId/stages", async (req, res) => {
  try {
    const payload = req.body;
    const result = await createContractStage({
      contractId: Number(req.params.contractId),
      stage: payload,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract level added successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.put("/:contractId/stages/:stageId", async (req, res) => {
  try {
    const payload = req.body;
    const result = await updateContractStage({
      newStage: payload,
      stageId: req.params.stageId,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract level updated successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});
router.delete("/:contractId/stages/:stageId", async (req, res) => {
  try {
    const result = await deleteContractStage({
      stageId: req.params.stageId,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract level delete successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});
router.get("/payments/all", async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "DUE" } = req.query;
    const data = await getContractPaymentsGroupedService({
      page,
      limit,
      status,
    });
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error fetching grouped contract payments:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.post("/payments/:paymentId/status", async (req, res) => {
  try {
    const result = await updateContractPaymentStatus({
      paymentId: req.params.paymentId,
      status: req.body.status,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract payment updated successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/:contractId/payments/:paymentId/status", async (req, res) => {
  try {
    const result = await updateContractPaymentStatus({
      paymentId: req.params.paymentId,
      status: req.body.status,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract payment updated successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/:contractId/payments", async (req, res) => {
  try {
    const result = await createNewContractPayment({
      contractId: req.params.contractId,
      payment: req.body,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract payment added successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.put("/:contractId/payments/:paymentId", async (req, res) => {
  try {
    const result = await updateContractPayment({
      paymentId: req.params.paymentId,
      newPayment: req.body,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract payment updated successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.delete("/:contractId/payments/:paymentId", async (req, res) => {
  try {
    const result = await deleteContractPayment({
      paymentId: req.params.paymentId,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract payment deleted successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/:contractId/drawings", async (req, res) => {
  try {
    const result = await createContractDrawing({
      contractId: req.params.contractId,
      drawing: req.body,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract drawing added successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.put("/:contractId/drawings/:drawId", async (req, res) => {
  try {
    const result = await updateContractDrwaing({
      drawId: req.params.drawId,
      newDrawing: req.body,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract drawing updated successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.delete("/:contractId/drawings/:drawId", async (req, res) => {
  try {
    const result = await deleteContractDrawing({
      drawId: req.params.drawId,
    });
    res
      .status(200)
      .json({ data: result, message: "Contract drawing deleted successfully" });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.post("/:contractId/special-items", async (req, res) => {
  try {
    const result = await createContractSpecialItem({
      contractId: req.params.contractId,
      item: req.body,
    });
    res.status(200).json({
      data: result,
      message: "Contract special item added successfully",
    });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.put("/:contractId/special-items/:itemId", async (req, res) => {
  try {
    const result = await updateContractSpecialItem({
      specialItemId: req.params.itemId,
      newSpecialItem: req.body,
    });
    res.status(200).json({
      data: result,
      message: "Contract special item updated successfully",
    });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

router.delete("/:contractId/special-items/:itemId", async (req, res) => {
  try {
    const result = await deleteContractSpecialItem({
      specialItemId: req.params.itemId,
    });
    res.status(200).json({
      data: result,
      message: "Contract special item deleted successfully",
    });
  } catch (error) {
    console.error("Error fetching client leads contracts:", error);
    res.status(500).json({ message: error?.message });
  }
});

export default router;
