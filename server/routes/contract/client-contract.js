import { Router } from "express";
import { getAndThrowError } from "../../services/main/utility.js";
import {
  changeContractSessionStatus,
  getContractSessionByToken,
} from "../../services/main/contract/clientContractServices.js";
import { buildAndUploadContractPdf } from "../../services/main/contract/generateContractPdf.js";
const router = Router();

router.get(`/session`, async (req, res) => {
  try {
    const contractSession = await getContractSessionByToken({
      token: req.query.token,
    });
    res.status(200).json({ data: contractSession });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/session/status", async (req, res) => {
  try {
    const data = await changeContractSessionStatus({
      token: req.body.token && req.body.token !== "undefined" && req.body.token,
      id: req.body.id,
      sessionStatus: req.body.sessionStatus,
    });
    res.status(200).json({ data: data, message: "Data fetched" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post("/generate-pdf", async (req, res) => {
  const { sessionData, signatureUrl, sessionStatus, lng } = req.body;
  try {
    const data = await changeContractSessionStatus({
      token: sessionData.arToken,
      sessionStatus: "SIGNING",
      extra: { signatureUrl },
    });
    await buildAndUploadContractPdf({
      token: sessionData.arToken,
      signatureUrl,
      lng,
      defaultDrawingUrl: `${process.env.SERVER}/uploads/default-drawing.jpg`,
    });
    return res
      .status(200)
      .json({ data: {}, message: "Response saved succussfully", url: null });
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate PDF",
      message: "Error in generating pdf",
    });
  }
});
export default router;
