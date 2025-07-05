import { Router } from "express";
import {
  changeSessionStatus,
  getConsAndPros,
  getPageInfo,
  getSessionByToken,
} from "../../services/main/image-session/imageSessionSevices.js";
import { getAndThrowError } from "../../services/main/utility.js";

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
      lngId: req.query.lngId,
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
export default router;
