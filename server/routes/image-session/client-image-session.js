import { Router } from "express";
import {
  changeSessionStatus,
  deleteImage,
  getColorsByLng,
  getConsAndPros,
  getImagesByStyleAndSpaces,
  getMaterialsByLng,
  getPageInfo,
  getSessionByToken,
  getStyleByLng,
  saveClientSelectedColor,
  saveClientSelectedImages,
  saveClientSelectedMaterials,
  saveClientSelectedStyle,
} from "../../services/main/image-session/imageSessionSevices.js";
import { getAndThrowError } from "../../services/main/utility.js";
import { uploadPdfAndApproveSession } from "../../services/main/clientServices.js";
import { pdfQueue } from "../../services/queues/pdfQueue.js";
const router = Router();

router.get("/page-info", async (req, res) => {
  try {
    const data = await getPageInfo({
      notArchived: true,
      lng: req.query.lng || "ar",
      type: req.query.type,
    });
    res.status(200).json({ data: data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/pros-and-cons", async (req, res) => {
  try {
    const data = await getConsAndPros({
      id: req.query.id,
      type: req.query.type,
      lng: req.query.lng,
      isClient:
        req.query.isClient &&
        req.query.isClient !== "undefined" &&
        req.query.isClient === "true",
    });
    res.status(200).json({ data: data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching pros and cons", e });
  }
});

router.get(`/session`, async (req, res) => {
  try {
    const imageSesssion = await getSessionByToken({ token: req.query.token });
    res.status(200).json({ data: imageSesssion });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/session/status", async (req, res) => {
  try {
    const data = await changeSessionStatus({
      token: req.body.token && req.body.token !== "undefined" && req.body.token,
      id: req.body.id,
      sessionStatus: req.body.sessionStatus,
    });
    res.status(200).json({ data: data, message: "Data fetched" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.get(`/colors`, async (req, res) => {
  try {
    const data = await getColorsByLng({ lng: req.query.lng });
    res.status(200).json({ data: data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/colors", async (req, res) => {
  try {
    const data = await saveClientSelectedColor({ ...req.body });
    res
      .status(200)
      .json({ data: data, message: "Color pallete saved succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.get(`/materials`, async (req, res) => {
  try {
    const data = await getMaterialsByLng({ lng: req.query.lng });
    res.status(200).json({ data: data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/materials", async (req, res) => {
  try {
    const data = await saveClientSelectedMaterials({ ...req.body });
    res.status(200).json({ data: data, message: "Material saved succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.get(`/styles`, async (req, res) => {
  try {
    const data = await getStyleByLng({ lng: req.query.lng });
    res.status(200).json({ data: data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/styles", async (req, res) => {
  try {
    const data = await saveClientSelectedStyle({ ...req.body });
    res.status(200).json({ data: data, message: "Style saved succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get(`/images`, async (req, res) => {
  try {
    console.log(req.query, "query");
    const data = await getImagesByStyleAndSpaces({
      spaceIds: req.query.spaceIds,
      styleId: req.query.styleId,
    });
    res.status(200).json({ data: data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/images", async (req, res) => {
  try {
    const data = await saveClientSelectedImages({ ...req.body });
    res.status(200).json({ data: data, message: "Images saved succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/images/:imageId", async (req, res) => {
  try {
    const data = await deleteImage({ imageId: Number(req.params.imageId) });
    res.status(200).json({ data: data, message: "Images deleted succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/generate-pdf", async (req, res) => {
  const { sessionData, signatureUrl, sessionStatus, lng } = req.body;
  try {
    //     const data = await changeSessionStatus({
    //   token: sessionData.token,
    //   sessionStatus,
    //   extra: { signatureUrl },
    // });
    // await pdfQueue.add("generate-approve-pdf", {
    //   sessionData,
    //   signatureUrl,
    //   lng,
    // });
    const data = await changeSessionStatus({
      token: sessionData.token,
      sessionStatus,
      extra: { signatureUrl },
    });
    await uploadPdfAndApproveSession({ sessionData, signatureUrl, lng });
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
