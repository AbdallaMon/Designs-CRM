import { Router } from "express";
import { verifyTokenAndHandleAuthorization } from "../../services/main/utility.js";
import {
  createSpace,
  getSpaces,
  updateSpace,
} from "../../services/main/image-session/imageSessionSevices.js";

const router = Router();

router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "ADMIN");
});

router.get("/space", async (req, res) => {
  try {
    const data = await getSpaces({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
router.post("/space", async (req, res) => {
  try {
    const data = await createSpace({ data: req.body });
    res.status(200).json({ data, message: "Space created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
router.put("/space/:spaceId", async (req, res) => {
  try {
    const data = await updateSpace({
      data: req.body,
      spaceId: req.params.spaceId,
    });
    res.status(200).json({ data, message: "Space updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
export default router;
