import { Router } from "express";
import {
  getCurrentUser,
  getNotifications,
  getPagination,
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../services/main/utility.js";
import {
  addNote,
  assignLeadToAUser,
  assignProjectToUser,
  authorizeDepartmentToUpdate,
  checkIfUserAllowedToTakeALead,
  checkUserLog,
  createAnUpdate,
  createClientImageSession,
  createNewContract,
  createNewTask,
  deleteAModel,
  deleteContract,
  deleteInProgressSession,
  deleteNote,
  editContract,
  editPriceOfferStatus,
  getAdmins,
  getAllFixedData,
  getArchivedProjects,
  getClientImageSessions,
  getClientLeadDetails,
  getClientLeads,
  getClientLeadsByDateRange,
  getClientLeadsColumnStatus,
  getContractForLead,
  getDashboardLeadStatusData,
  getDesignerMetrics,
  getEmiratesAnalytics,
  getImages,
  getImageSesssionModel,
  getKeyMetrics,
  getLatestNewLeads,
  getLeadByPorjects,
  getLeadByPorjectsColumn,
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
  getSharedSettings,
  getTaskDetails,
  getTasksWithNotesIncluded,
  getUpdates,
  getUserProjects,
  getUserRole,
  makeExtraServicePayments,
  makePayments,
  markAnUpdateAsDone,
  markClientLeadAsConverted,
  regenerateSessionToken,
  submitUserLog,
  toggleArchieveAnUpdate,
  toggleArchieveASharedUpdate,
  unAuthorizeDepartmentToUpdate,
  updateClientLeadStatus,
  updateProject,
  updateTask,
} from "../services/main/sharedServices.js";
import {
  getAdminClientLeadDetails,
  updateLeadField,
} from "../services/main/adminServices.js";
import {
  createCallReminder,
  createFile,
  createMeetingReminder,
  createMeetingReminderWithToken,
  createNote,
  createPriceOffer,
  updateCallReminderStatus,
  updateMeetingReminderStatus,
} from "../services/main/staffServices.js";
import {
  generateTelegramMessageLink,
  getFilePath,
  getMessages,
  sendTelegramMessage,
} from "../services/test-telegram.js";
import {
  createAuthUrl,
  getLocations,
  getReviews,
  handleOAuthCallback,
} from "../services/reviews.js";

const router = Router();
import questionsRoutes from "./questions/questions.js";
import calendarRoutes from "./calendar/calendar.js";
import imageSessionRouter from "./image-session/admin-image-session.js";
import {
  addCutsomDate,
  createAvailableDatesForMoreThanOneDay,
  createAvailableDay,
  deleteADay,
  deleteASlot,
  updateAvailableDay,
} from "../services/main/calendarServices.js";

router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.use("/questions", questionsRoutes);
router.use("/calendar", calendarRoutes);
router.use("/image-session", imageSessionRouter);

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
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT"
    ) {
      searchParams.selfId = token.id;
      searchParams.userId = token.id;
    }

    const clientLeads = await getClientLeadsByDateRange({
      searchParams,
      isAdmin: token.role === "ADMIN" || token.role === "SUPER_ADMIN",
      user: token,
    });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});

router.get("/client-leads/columns", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT"
    ) {
      searchParams.selfId = token.id;
      searchParams.userId = token.id;
    }

    const clientLeads = await getClientLeadsColumnStatus({
      searchParams,
      isAdmin: token.role === "ADMIN" || token.role === "SUPER_ADMIN",
      user: token,
    });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
router.get("/client-leads/:id/contracts", async (req, res) => {
  try {
    const contracts = await getContractForLead({ clientLeadId: req.params.id });
    res.status(200).json({ data: contracts });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});
router.post("/client-leads/:id/contracts", async (req, res) => {
  try {
    const { id } = req.params;
    const newContract = await createNewContract({
      clientLeadId: id,
      ...req.body,
    });

    res.status(200).json({
      data: newContract,
      message: "Contract updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});
router.put("/client-leads/contract/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContract = await editContract({ id: id, ...req.body });

    res.status(200).json({
      data: updatedContract,
      message: "Contract updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});

router.delete("/client-leads/contract/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedContract = await deleteContract({ contractId: Number(id) });

    res.status(200).json({
      data: deletedContract,
      message: "Contract deleted successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});

router.put("/lead/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLead = await updateLeadField({ data: req.body, leadId: id });

    res.status(200).json({
      data: updatedLead,
      message: "Lead updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
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
            token.id,
            token
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
router.post("/client-leads/:id/meeting-reminders/token", async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await getCurrentUser(req);
    const callReminder = await createMeetingReminderWithToken({
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

/* Updates */
router.get("/client-leads/:clientLeadId/updates", async (req, res) => {
  try {
    const searchParams = {
      ...req.query,
      clientLeadId: req.params.clientLeadId,
    };
    const user = await getCurrentUser(req);
    const updates = await getUpdates(
      searchParams,
      user.role === "ADMIN" || user.role === "SUPER_ADMIN"
    );
    res.status(200).json({ data: updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching updates." });
  }
});
router.get("/client-leads/shared-settings/:updateId", async (req, res) => {
  try {
    const updates = await getSharedSettings(req.params.updateId);
    res.status(200).json({ data: updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching updates." });
  }
});

// POST: Create a new update for a client lead
router.post("/client-leads/:clientLeadId/updates", async (req, res) => {
  try {
    const searchParams = {
      ...req.query,
    };
    req.body.clientLeadId = Number(req.params.clientLeadId);
    const user = await getCurrentUser(req);
    const newUpdate = await createAnUpdate({
      data: req.body,
      searchParams,
      userId: user.id,
    });
    res
      .status(200)
      .json({ data: newUpdate, message: "Update created successfully." });
  } catch (error) {
    console.error("Error creating update:", error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the update." });
  }
});

// POST: Authorize department to access an update
router.post("/client-leads/updates/:updateId/authorize", async (req, res) => {
  try {
    const result = await authorizeDepartmentToUpdate({
      type: req.body.type,
      updateId: req.params.updateId,
    });
    res
      .status(200)
      .json({ data: result, message: "Department authorized successfully." });
  } catch (error) {
    console.error("Error authorizing department:", error);
    res
      .status(500)
      .json({ message: "An error occurred while authorizing department." });
  }
});

// DELETE: Unauthorize department from accessing an update
router.post(
  "/client-leads/updates/:updateId/authorize/shared",
  async (req, res) => {
    try {
      const result = await unAuthorizeDepartmentToUpdate({
        updateId: req.params.updateId,
        type: req.body.type,
      });
      res.status(200).json({
        data: result,
        message: "Department unauthorized successfully.",
      });
    } catch (error) {
      console.error("Error unauthorizing department:", error);
      res
        .status(500)
        .json({ message: "An error occurred while unauthorizing department." });
    }
  }
);

// PUT: Toggle archive for a client lead update
router.put("/client-leads/updates/:updateId/archive", async (req, res) => {
  try {
    const result = await toggleArchieveAnUpdate({
      updateId: req.params.updateId,
      isArchived: req.body.isArchived,
    });
    res
      .status(200)
      .json({ data: result, message: "Update archive toggled successfully." });
  } catch (error) {
    console.error("Error archiving update:", error);
    res
      .status(500)
      .json({ message: "An error occurred while toggling archive state." });
  }
});

// PUT: Toggle archive for a shared update
router.put(
  "/client-leads/shared-updates/:sharedUpdateId/archive",
  async (req, res) => {
    try {
      const data = await toggleArchieveASharedUpdate({
        sharedUpdateId: req.params.sharedUpdateId,
        isArchived: req.body.isArchived,
      });
      res
        .status(200)
        .json({ message: "Shared update archive toggled successfully.", data });
    } catch (error) {
      console.error("Error archiving shared update:", error);
      res.status(500).json({
        message: "An error occurred while toggling shared update archive.",
      });
    }
  }
);
// PUT: mark an update as done
router.put("/client-leads/updates/:updateId/mark-done", async (req, res) => {
  try {
    const data = req.body;
    const update = await markAnUpdateAsDone({
      updateId: req.params.updateId,
      clientLeadId: data.clientLeadId,
      isArchived: data.isArchived,
    });
    res.status(200).json({
      data: update,
      message: `Client lead update has been marked as done${
        data.isArchived ? " and has been archievd" : ""
      }.`,
    });
  } catch (error) {
    console.error("Error archiving shared update:", error);
    res.status(500).json({
      message: "An error occurred while toggling shared update archive.",
    });
  }
});

/* end of updates */
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

router.get("/client-leads/projects/designers/columns", async (req, res) => {
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
    console.log(error);
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
router.get("/test", async (req, res) => {
  try {
    const test = await sendTelegramMessage();
    res.status(200).json({ data: test });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "An error occurred while fetching roles" });
  }
});
router.get("/test/file", async (req, res) => {
  try {
    const test = await getFilePath(req.query.id);

    res.status(200).json({ data: test });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/test/channel", async (req, res) => {
  try {
    const messages = await generateTelegramMessageLink();

    res.status(200).json({ data: messages });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/test/chat", async (req, res) => {
  try {
    const messages = await getMessages();

    res.status(200).json({ data: messages });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/url", async (req, res) => {
  try {
    const url = await createAuthUrl();

    res.status(200).json({ data: url });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/oauth2callback", async (req, res) => {
  try {
    const token = await handleOAuthCallback(req.query.code);

    res.status(200).json({ data: token });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/locations", async (req, res) => {
  try {
    const locations = await getLocations(req.query.code);

    res.status(200).json({ data: locations });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await getReviews(req.query.accountId, req.query.locationId);

    res.status(200).json({ data: reviews });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

/////////////// end of utility /////////

////////// start of image sesssion //////////////
router.get("/image-session/images", async (req, res) => {
  try {
    const { patternIds, spaceIds } = req.query;
    const images = await getImages({
      patternIds: patternIds,
      spaceIds: spaceIds,
    });

    res.status(200).json({ data: images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});
router.get("/image-session", async (req, res) => {
  try {
    const data = await getImageSesssionModel({
      model: req.query.model,
      searchParams: req.query,
    });
    return res.status(200).json({ data });
  } catch (e) {
    console.error("Error fetching images:", e);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});

router.get("/image-session/:clientLeadId/sessions", async (req, res) => {
  try {
    const imageSesssions = await getClientImageSessions(
      Number(req.params.clientLeadId)
    );

    res.status(200).json({ data: imageSesssions });
  } catch (error) {
    console.error("Error fetching images:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});

router.post("/image-session/:clientLeadId/sessions", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newSession = await createClientImageSession({
      clientLeadId: Number(req.params.clientLeadId),
      userId: Number(user.id),
      selectedSpaceIds: req.body.spaces,
    });
    res
      .status(200)
      .json({ data: newSession, message: "New session created succussfully" });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: "An error occurred" });
  }
});
router.put(
  "/image-session/:clientLeadId/sessions/:sessionId/re-generate",
  async (req, res) => {
    try {
      const newSession = await regenerateSessionToken(
        Number(req.params.sessionId)
      );
      res.status(200).json({
        data: newSession,
        message: "Session link regenerated please copy it",
      });
    } catch (e) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
);
router.delete(
  "/image-session/:clientLeadId/sessions/:sessionId",
  async (req, res) => {
    try {
      await deleteInProgressSession(Number(req.params.sessionId));
      res.status(200).json({
        message: "Session deleted succussfully",
      });
    } catch (e) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
);

router.get("/users/admins", async (req, res) => {
  try {
    const users = await getAdmins();

    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching client leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching client leads" });
  }
});
//////// end of image sesssion ////////

///calendar

router.post("/calendar/available-days", async (req, res) => {
  try {
    const { date, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    const data = await createAvailableDay({
      date,
      fromHour,
      toHour,
      duration,
      breakMinutes,
      userId: user.id,
      timeZone: req.query.timezone,
    });
    res.status(200).json({
      message: "Available day created successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message,
      error: e.message || "Internal Server Error",
    });
  }
});
router.put("/calendar/available-days/:dayId", async (req, res) => {
  try {
    const { dayId } = req.params;
    const { date, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    const data = await updateAvailableDay({
      dayId,
      date,
      fromHour,
      toHour,
      duration,
      breakMinutes,
      userId: user.id,
      timeZone: req.query.timezone,
    });
    res.status(200).json({
      message: "Available day updated successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error updating available day",
      error: e.message || "Internal Server Error",
    });
  }
});
router.post("/calendar/available-days/multiple", async (req, res) => {
  try {
    const { days, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    const data = await createAvailableDatesForMoreThanOneDay({
      userId: user.id,
      days,
      fromHour,
      toHour,
      duration,
      breakMinutes,
      timeZone: req.query.timezone,
    });
    res.status(200).json({
      message: "Available days created successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error creating available days",
      error: e.message || "Internal Server Error",
    });
  }
});
router.post("/calendar/add-custom/:dayId", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const user = await getCurrentUser(req);
    const custom = await addCutsomDate({
      dayId: req.params.dayId,
      date,
      fromHour: startTime,
      toHour: endTime,
      userId: user.id,
      timeZone: req.query.timezone,
    });
    res.status(200).json({
      message: "Custom available day created successfully",
      data: custom,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message,
      error: e.message || "Internal Server Error",
    });
  }
});
router.delete("/calendar/slots/:slotId", async (req, res) => {
  try {
    const { slotId } = req.params;
    const data = await deleteASlot({
      slotId,
    });
    res.status(200).json({
      message: "Slot deleted successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error deleting available slot",
      error: e.message || "Internal Server Error",
    });
  }
});
router.delete("/calendar/days/:dayId", async (req, res) => {
  try {
    const { dayId } = req.params;
    const data = await deleteADay({
      dayId,
    });
    res.status(200).json({
      message: "Day deleted successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message,
      error: e.message || "Internal Server Error",
    });
  }
});
export default router;
