import express from "express";
const router = express.Router();
import {
  changeSessionStatus,
  submitSelectedImages,
  submitSelectedPatterns,
} from "../../services/main/image-session/clientImageServices.js";
import {
  getImages,
  getImageSesssionModel,
} from "../../services/main/sharedServices.js";

router.get(`/data`, async (req, res) => {
  try {
    const colors = await getImageSesssionModel({ model: req.query.model });
    res.status(200).json({ data: colors });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

router.get(`/images`, async (req, res) => {
  try {
    const images = await getImages({
      patternIds: req.query.patterns,
      spaceIds: req.query.spaces,
    });
    res.status(200).json({ data: images });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

router.post(`/save-patterns`, async (req, res) => {
  try {
    const session = await submitSelectedPatterns({
      token: req.body.token,
      patternIds: req.body.patterns,
    });
    res.status(200).json({ data: session, message: "Colors pattern selected" });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

router.post(`/save-images`, async (req, res) => {
  try {
    const session = await submitSelectedImages({
      token: req.body.token,
      imageIds: req.body.imageIds,
    });
    res
      .status(200)
      .json({ data: session, message: "Image selections saved succsfully" });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

// duplicated path preserved exactly as in your code
router.post(`/save-images`, async (req, res) => {
  try {
    const session = await changeSessionStatus({
      token: req.body.token,
      status: "APPROVING",
    });
    res.status(200).json({
      data: session,
      message: "Success now just signature and approve your data",
    });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

export default router;
