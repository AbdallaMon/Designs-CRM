import { Router } from "express";
import { getConsAndPros } from "../../services/main/image-session/imageSessionSevices.js";

const router = Router();

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

export default router;
