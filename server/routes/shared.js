import { Router } from "express";
import {
  getCurrentUser,
  getNotifications,
  getPagination,
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../services/utility.js";
import {
  addNote,
  assignLeadToAUser,
  assignProjectToUser,
  checkIfUserAllowedToTakeALead,
  checkUserLog,
  createNewTask,
  deleteAModel,
  deleteNote,
  editPriceOfferStatus,
  getAllFixedData,
  getArchivedProjects,
  getClientLeadDetails,
  getClientLeads,
  getClientLeadsByDateRange,
  getDashboardLeadStatusData,
  getDesignerMetrics,
  getEmiratesAnalytics,
  getKeyMetrics,
  getLatestNewLeads,
  getLeadByPorjects,
  getLeadDetailsByProject,
  getMonthlyPerformanceData,
  getNextCalls,
  getNextMeetings,
  getNotes,
  getOtherRoles,
  getPerformanceMetrics,
  getProjectDetailsById,
  getProjectsByClientLeadId,
  getRecentActivities,
  getTaskDetails,
  getTasksWithNotesIncluded,
  getUserProjects,
  getUserRole,
  makeExtraServicePayments,
  makePayments,
  markClientLeadAsConverted,
  submitUserLog,
  updateClientLeadStatus,
  updateProject,
  updateTask,
} from "../services/sharedServices.js";
import { getAdminClientLeadDetails } from "../services/adminServices.js";
import {
  createCallReminder,
  createFile,
  createMeetingReminder,
  createNote,
  createPriceOffer,
  updateCallReminderStatus,
  updateMeetingReminderStatus,
} from "../services/staffServices.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.get("/client-leads", async (req, res) => {
  try {
    const searchParams = req.query;
    const user = getTokenData(req, res);

    const { limit, skip } = getPagination(req);
    searchParams.checkConsult = true;

    const result = await getClientLeads({
      limit: Number(limit),
      skip: Number(skip),
      searchParams,
      userId: user.id,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.get("/client-leads/deals", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    // if (token.role === "STAFF") {
    //   searchParams.userId = token.id;
    // }
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT"
    ) {
      searchParams.selfId = token.id;
      searchParams.userId = token.id;
    }
    const clientLeads = await getClientLeadsByDateRange({ searchParams });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.post("/:userId/client-leads/countries", async (req, res) => {
  const { userId } = req.params;

  try {
    const isAllowed = await checkIfUserAllowedToTakeALead(
      userId,
      req.body.country
    );
    res.status(200).json({
      allowed: isAllowed,
      message: isAllowed
        ? "You are allowed to take this lead"
        : "You are restricetd to take lead from this country",
    });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
  }
});
router.get("/client-leads/calls", async (req, res) => {
  try {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);
    const result = await getNextCalls({
      limit: Number(limit),
      skip: Number(skip),
      searchParams,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.put("/client-leads/call-reminders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);

    const callReminder = await updateCallReminderStatus({
      reminderId: Number(id),
      currentUser: user,
      ...req.body,
    });
    res.status(200).json({
      data: callReminder,
      message: "Call reminder updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "An error occurred while updating call reminder.",
    });
  }
});

router.get("/client-leads/meetings", async (req, res) => {
  try {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);
    const result = await getNextMeetings({
      limit: Number(limit),
      skip: Number(skip),
      searchParams,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.put("/client-leads/meeting-reminders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);

    const callReminder = await updateMeetingReminderStatus({
      reminderId: Number(id),
      currentUser: user,
      ...req.body,
    });
    res.status(200).json({
      data: callReminder,
      message: "Meeting reminder updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "An error occurred while updating call reminder.",
    });
  }
});

router.get("/client-leads/:id", async (req, res) => {
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
    if (token.role !== "ADMIN") {
      searchParams.checkConsult = true;
    }
    const clientLeadDetails =
      token.role === "ADMIN" || token.role === "SUPER_ADMIN"
        ? await getAdminClientLeadDetails(Number(id), searchParams)
        : await getClientLeadDetails(
            Number(id),
            searchParams,
            token.role,
            token.id
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

router.post("/client-leads/:id/call-reminders", async (req, res) => {
  try {
    const { id } = req.params;
    const callReminder = await createCallReminder({
      clientLeadId: Number(id),
      ...req.body,
    });

    res.status(200).json({
      data: callReminder,
      message: "Call reminder created successfully",
    });
  } catch (error) {
    console.error("Error createCallReminder:", error);
    res.status(500).json({
      message:
        error.message || "An error occurred while creating call reminder.",
    });
  }
});
router.post("/client-leads/:id/meeting-reminders", async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await getCurrentUser(req);
    const callReminder = await createMeetingReminder({
      clientLeadId: Number(id),
      currentUser,
      ...req.body,
    });
    res.status(200).json({
      data: callReminder,
      message: "Meeting reminder created successfully",
    });
  } catch (error) {
    console.error("Error createCallReminder:", error);
    res.status(500).json({
      message:
        error.message || "An error occurred while creating Meeting reminder.",
    });
  }
});
router.post("/client-leads/:id/price-offers", async (req, res) => {
  try {
    const { id } = req.params;
    const priceOffers = await createPriceOffer({
      clientLeadId: Number(id),
      ...req.body,
    });
    res
      .status(200)
      .json({ data: priceOffers, message: "Price offer added successfully" });
  } catch (error) {
    console.error("Error Creating new price offer:", error);
    res.status(500).json({
      message:
        error.message || "An error occurred while creating call reminder.",
    });
  }
});
router.post("/client-leads/:id/files", async (req, res) => {
  try {
    const { id } = req.params;
    const file = await createFile({
      clientLeadId: Number(id),
      ...req.body,
    });
    res.status(200).json({ data: file, message: "File Saved successfully" });
  } catch (error) {
    console.error("Error updating client lead status:", error);
    res.status(500).json({ message: "Failed to save the file." });
  }
});
router.post("/client-leads/:id/payments", async (req, res) => {
  const { id } = req.params;
  let payments;
  if (req.body.paymentType === "extra-service") {
    payments = await makeExtraServicePayments({
      data: req.body.payments,
      leadId: Number(id),
      ...req.body,
    });
  } else {
    payments = await makePayments(req.body.payments, Number(id));
  }
  try {
    res.status(200).json({
      data: payments,
      message: "Payments added successfully",
    });
  } catch (error) {
    console.error("Error Creating payments:", error);
    res.status(500).json({ message: "Error Creating payments" });
  }
});

router.post("/client-lead/price-offers/change-status", async (req, res) => {
  let priceOffer = await editPriceOfferStatus(
    req.body.priceOfferId,
    req.body.isAccepted
  );

  try {
    res.status(200).json({
      data: priceOffer,
      message: "Price offer status changed successfully",
    });
  } catch (error) {
    console.error("Error editing Price offer:", error);
    res.status(500).json({ message: "Error editing Price offer" });
  }
});

router.put("/client-leads", async (req, res) => {
  try {
    const clientLead = req.body;
    const currentUser = await getCurrentUser(req);
    const isAdmin =
      currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
    const result = await assignLeadToAUser(
      Number(clientLead.id),
      isAdmin ? req.body.userId : Number(currentUser.id),
      isAdmin
    );

    res.status(200).json({
      data: result,
      message: isAdmin
        ? "Deal converted successfully"
        : "Deal assigned to you successfully",
    });
  } catch (error) {
    console.error("Error assigning client leads:", error);
    res.status(500).json({ message: error.message });
  }
});
router.put("/client-leads/convert", async (req, res) => {
  try {
    const body = req.body;
    const result = await markClientLeadAsConverted(
      Number(body.id),
      body.reasonToConvert,
      "ON_HOLD"
    );
    res
      .status(200)
      .json({ data: result, message: "Deal are now in the converted list" });
  } catch (error) {
    console.error("Error assigning client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while assigning client leads" });
  }
});
router.put("/client-leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatePrice } = req.body;

    await updateClientLeadStatus({
      clientLeadId: Number(id),
      ...req.body,
    });

    res.status(200).json({
      message: updatePrice
        ? "Price updated successfully"
        : "Status changed successfully",
    });
  } catch (error) {
    console.error("Error updating client lead status:", error);
    res.status(500).json({ message: error.message });
  }
});

/* dashboard */
router.get("/dashboard/key-metrics", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getKeyMetrics(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

router.get("/dashboard/leads-status", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getDashboardLeadStatusData(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

router.get("/dashboard/monthly-performance", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getMonthlyPerformanceData(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/dashboard/emirates-analytics", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getEmiratesAnalytics(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/dashboard/week-performance", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getPerformanceMetrics(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/dashboard/latest-leads", async (req, res) => {
  try {
    const data = await getLatestNewLeads();
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/dashboard/recent-activities", async (req, res) => {
  try {
    const searchParams = req.query;
    const data = await getRecentActivities(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/users/role/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const newUser = await getUserRole(userId);
    res.status(200).json({
      data: newUser,
      message: "Restricted countries updated successfully",
    });
  } catch (error) {
    console.error("Error fetching personal info:", error);
  }
});
//desginer dashboard
router.get("/dashboard/designer-metrics", async (req, res) => {
  try {
    const searchParams = req.query;
    const data = await getDesignerMetrics(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching designer metrics:", error);
    res.status(500).json({
      message:
        error.message || "An error occurred while fetching designer metrics.",
    });
  }
});
// end of desginer dashboard

/////////////////// Projects ///////////////////

router.get("/client-leads/projects/designers", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);

    if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
      searchParams.isAdmin = true;
    } else {
      searchParams.userId = token.id;
    }
    searchParams.userRole = token.role;
    const clientLeads = await getLeadByPorjects({ searchParams });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});
router.get("/client-leads/projects/designers/:id", async (req, res) => {
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
router.get("/projects", async (req, res) => {
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
router.get("/archived-projects", async (req, res) => {
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

router.get("/projects/user-profile/:userId", async (req, res) => {
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
router.get("/projects/:id", async (req, res) => {
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
router.put("/projects/:id", async (req, res) => {
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
router.put("/projects/:id/assign-designer", async (req, res) => {
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
router.put("/client-leads/designers/:leadId/status", async (req, res) => {
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

///////////// end of projects ///////////////
// utility
router.get("/notifications", async (req, res) => {
  const searchParams = req.query;
  const { limit = 9, skip = 1 } = getPagination(req);
  try {
    const { notifications, total } = await getNotifications(
      searchParams,
      limit,
      skip,
      false
    );
    const totalPages = Math.ceil(total / limit);

    if (!notifications) {
      return res.status(404).json({ message: "No new notifications" });
    }
    res.status(200).json({ data: notifications, totalPages, total });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error getting notification" });
  }
});
router.get("/fixed-data", async (req, res) => {
  try {
    const result = await getAllFixedData();
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.get("/user-logs", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await checkUserLog(
      searchParams.userId,
      searchParams.startTime,
      searchParams.endTime
    );
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.post("/user-logs", async (req, res) => {
  try {
    const data = await submitUserLog(
      req.body.userId,
      req.body.date,
      req.body.description,
      req.body.totalMinutes
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});
router.get("/tasks", async (req, res) => {
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
router.post("/tasks", async (req, res) => {
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
router.get("/tasks/:id", async (req, res) => {
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
router.put("/tasks/:taskId", async (req, res) => {
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
router.delete("/delete/:id", async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});
router.post("/client-leads/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await createNote({ clientLeadId: Number(id), ...req.body });
    res.status(200).json({ data: note, message: "Note added successfully" });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note." });
  }
});
router.get("/roles", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const roles = await getOtherRoles(token.id);
    res.status(200).json({ data: roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "An error occurred while fetching roles" });
  }
});
/////////////// end of utility /////////
export default router;
