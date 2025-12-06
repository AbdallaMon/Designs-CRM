import { Router } from "express";
import {
  getTokenData,
  getCurrentUser,
} from "../../services/main/utility/utility.js";
import {
  getTasksWithNotesIncluded,
  getTaskDetails,
  createNewTask,
  updateTask,
  getNotes,
  addNote,
  deleteAModel,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                        Tasks                                            */
/* ======================================================================================= */

// List tasks
router.get("/", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role === "THREE_D_DESIGNER" ||
      token.role === "TWO_D_DESIGNER" ||
      token.role === "STAFF"
    ) {
      searchParams.userId = token.id;
    }
    const tasks = await getTasksWithNotesIncluded({ searchParams });
    res.status(200).json({ data: tasks });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Create task
router.post("/", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const task = req.body;
    task.createdById = Number(token.id);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";
    const newTask = await createNewTask({
      data: task,
      isAdmin,
      staffId: token.id,
    });
    const name = newTask.type === "MODIFICATION" ? "Modification" : "Task";
    res
      .status(200)
      .json({ data: newTask, message: `${name} created successfully` });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

// Task details
router.get("/:id", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role === "THREE_D_DESIGNER" ||
      token.role === "TWO_D_DESIGNER" ||
      token.role === "STAFF"
    ) {
      searchParams.userId = token.id;
    }
    const tasks = await getTaskDetails({ searchParams, id: req.params.id });
    res.status(200).json({ data: tasks });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Update task
router.put("/:taskId", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const { taskId } = req.params;
    const task = req.body;
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";
    const newTask = await updateTask({
      data: task,
      taskId,
      isAdmin,
      userId: token.id,
    });
    const name = newTask.type === "MODIFICATION" ? "Modification" : "Task";

    res
      .status(200)
      .json({ data: newTask, message: `${name} updated successfully` });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ======================================================================================= */
/*                                        Notes                                            */
/* ======================================================================================= */

// List notes
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

// Create note (generic)
router.post("/notes", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";

    const newNote = await addNote({
      ...req.body,
      userId: token.id,
      isAdmin,
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete by model (generic)
router.delete("/:id", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";

    const newNote = await deleteAModel({
      id: req.params.id,
      isAdmin,
      data: req.body,
    });
    res.status(200).json(newNote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
