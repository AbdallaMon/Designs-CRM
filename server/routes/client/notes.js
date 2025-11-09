import express from "express";
const router = express.Router();
import { addNote, getNotes } from "../../services/main/sharedServices.js";

router.get("/notes", async (req, res) => {
  try {
    const searchParams = req.query;
    const notes = await getNotes(searchParams);
    res.status(200).json({ data: notes });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ message: error.message });
  }
});

router.post("/notes", async (req, res) => {
  try {
    const newNote = await addNote({
      ...req.body,
      client: true,
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
