import { Router } from "express";
import {
  getCurrentUser,
  getPagination,
  getTokenData,
} from "../../services/main/utility/utility.js";
import {
  getLeadByPorjects,
  getLeadByPorjectsColumn,
  getLeadDetailsByProject,
  getProjectsByClientLeadId,
  getArchivedProjects,
  getUserProjects,
  getProjectDetailsById,
  updateProject,
  assignProjectToUser,
  getUniqueProjectGroups,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                  Projects (Designers)                                   */
/* ======================================================================================= */

// Projects (designers) list
router.get("/designers", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);

    if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
      searchParams.isAdmin = true;
    } else {
      searchParams.userId = token.id;
    }
    searchParams.userRole = token.role;

    const clientLeads = await getLeadByPorjects({
      searchParams,
      isAdmin: token.role === "ADMIN" || token.role === "SUPER_ADMIN",
    });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Projects (designers) columns
router.get("/designers/columns", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);

    if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
      searchParams.isAdmin = true;
    } else {
      searchParams.userId = token.id;
    }
    searchParams.userRole = token.role;

    const clientLeads = await getLeadByPorjectsColumn({
      searchParams,
      isAdmin: token.role === "ADMIN" || token.role === "SUPER_ADMIN",
    });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Lead details by project id
router.get("/designers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const token = getTokenData(req, res);
    const searchParams = req.query;

    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT"
    ) {
      searchParams.userId = token.id;
    }
    if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
      searchParams.isAdmin = true;
    }

    const clientLeadDetails = await getLeadDetailsByProject(
      Number(id),
      searchParams
    );
    res.status(200).json({ data: clientLeadDetails });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

/* ======================================================================================= */
/*                                  Projects List & Details                                */
/* ======================================================================================= */

// Projects list (by clientLead / scoped by user unless admin)
router.get("/", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
      searchParams.userId = token.id;
    }
    const projects = await getProjectsByClientLeadId({ searchParams });
    res.status(200).json({ data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Archived projects (paginated)
router.get("/archived", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
      searchParams.userId = token.id;
    }
    const data = await getArchivedProjects(searchParams, limit, skip);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});

// User profile projects
router.get("/user-profile/:userId", async (req, res) => {
  try {
    const searchParams = req.query;
    const { userId } = req.params;
    searchParams.userId = userId;

    const { limit, skip } = getPagination(req);
    const projects = await getUserProjects(
      searchParams,
      Number(limit),
      Number(skip)
    );
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

// Project details by id (scoped)
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
    const project = await getProjectDetailsById({
      id: req.params.id,
      searchParams: req.query,
    });
    res.status(200).json({ data: project });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ======================================================================================= */
/*                                    Project Updates                                      */
/* ======================================================================================= */

// Update project
router.put("/:id", async (req, res) => {
  try {
    const project = req.body;
    const newProject = await updateProject({ data: project });
    res
      .status(200)
      .json({ data: newProject, message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

// Assign designer to project
router.put("/:id/assign-designer", async (req, res) => {
  try {
    const { id } = req.params;
    const project = req.body;
    const newProject = await assignProjectToUser({
      userId: project.designerId,
      projectId: id,
      assignmentId: project.assignmentId,
      deleteDesigner: project.deleteDesigner,
      addToModification: project.addToModification,
      removeFromModification: project.removeFromModification,
      groupId: project.groupId,
    });
    res
      .status(200)
      .json({ data: newProject, message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update project status (designers board)
router.put("/designers/:leadId/status", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";
    await updateProject({
      data: req.body,
      isAdmin,
    });

    res.status(200).json({
      message: "Status changed successfully",
    });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ======================================================================================= */
/*                                  Project Groups                                         */
/* ======================================================================================= */

// Unique project groups for a lead
router.get("/:leadId/groups", async (req, res) => {
  try {
    const { leadId } = req.params;
    const groups = await getUniqueProjectGroups({
      clientLeadId: leadId,
    });
    res.status(200).json({ data: groups });
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

export default router;
