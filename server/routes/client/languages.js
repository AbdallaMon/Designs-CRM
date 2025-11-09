import express from "express";
const router = express.Router();
import { getLanguages } from "../../services/main/clientServices.js";

router.get("/languages", async (req, res) => {
  try {
    const languages = await getLanguages({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data: languages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
