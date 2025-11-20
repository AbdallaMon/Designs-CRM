import { Router } from "express";

/* ============================== Shared Utils & Middleware ============================== */
import {
  getAndThrowError,
  getCurrentUser,
  getNotifications,
  getPagination,
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../services/main/utility.js";

/* ================================== Shared Services =================================== */
import {
  addNote,
  assignLeadToAUser,
  assignProjectToUser,
  authorizeDepartmentToUpdate,
  checkIfUserAllowedToTakeALead,
  checkUserLog,
  createAnUpdate,
  createNewDeliverySchedule,
  createNewTask,
  deleteAModel,
  deleteContract,
  deleteDeliverySchedule,
  editContract,
  editPriceOfferStatus,
  editSalesSage,
  getAdmins,
  getAllFixedData,
  getAllMeetingRemindersByClientLeadId,
  getArchivedProjects,
  getClientLeadDetails,
  getClientLeads,
  getClientLeadsByDateRange,
  getClientLeadsColumnStatus,
  getDashboardLeadStatusData,
  getDeliveryScheduleByProjectId,
  getDesignerMetrics,
  getEmiratesAnalytics,
  getImages,
  getImageSesssionModel,
  getKeyMetrics,
  getLatestNewLeads,
  getLeadByPorjects,
  getLeadByPorjectsColumn,
  getLeadDetailsByProject,
  getLeadsMonthlyOverview,
  getMeetingById,
  getMonthlyPerformanceData,
  getNextCalls,
  getNextMeetings,
  getNotes,
  getOtherRoles,
  getPerformanceMetrics,
  getProjectDetailsById,
  getProjectsByClientLeadId,
  getRecentActivities,
  getSalesStages,
  getSharedSettings,
  getTaskDetails,
  getTasksWithNotesIncluded,
  getUniqueProjectGroups,
  getUpdates,
  getUserProjects,
  getUserRole,
  linkADeliveryToMeeting,
  makeExtraServicePayments,
  makePayments,
  markAnUpdateAsDone,
  markAsCompleted,
  markAsCurrent,
  markClientLeadAsConverted,
  remindUserToCompleteRegister,
  remindUserToPay,
  submitUserLog,
  toggleArchieveAnUpdate,
  toggleArchieveASharedUpdate,
  unAuthorizeDepartmentToUpdate,
  updateClientLeadStatus,
  updateProject,
  updateTask,
} from "../services/main/sharedServices.js";

/* =================================== Admin Services =================================== */
import {
  getAdminClientLeadDetails,
  getModelIds,
  updateLeadField,
} from "../services/main/adminServices.js";

/* =================================== Staff Services =================================== */
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

/* =================================== Reviews OAuth ==================================== */
import {
  createAuthUrl,
  getLocations,
  getReviews,
  handleOAuthCallback,
} from "../services/reviews.js";

/* ================================== Sub-Routers ======================================= */
import questionsRoutes from "./questions/questions.js";
import calendarRoutes from "./calendar/calendar.js";
import coursesRouter from "./courses/staffCourses.js";
import contractRouter from "./contract/contracts.js";
import imageSessionRouter from "./image-session/image-session.js";
import siteUtilitiesServices from "./site-utilities/siteUtility.js";

/* =============================== Calendar Services ==================================== */
import {
  addCutsomDate,
  createAvailableDatesForMoreThanOneDay,
  createAvailableDay,
  deleteADay,
  deleteASlot,
  updateAvailableDay,
} from "../services/main/calendarServices.js";

/* ======================================================================================= */
/*                                          Init                                           */
/* ======================================================================================= */

const router = Router();

/* ======================================================================================= */
/*                                  Global Auth Middleware                                 */
/* ======================================================================================= */

router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});

/* ======================================================================================= */
/*                                     Mounted Routers                                     */
/* ======================================================================================= */

router.use("/courses", coursesRouter);
router.use("/contracts", contractRouter);
router.use("/site-utilities", siteUtilitiesServices);
router.use("/questions", questionsRoutes);
router.use("/calendar", calendarRoutes);
router.use("/image-session", imageSessionRouter);

/* ======================================================================================= */
/*                                      Client Leads                                       */
/* ======================================================================================= */

// List client leads (+ pagination)
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

// Deals (date range)
router.get("/client-leads/deals", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT" &&
      token.role !== "SUPER_SALES"
    ) {
      searchParams.selfId = token.id;
      searchParams.userId = token.id;
    }

    const clientLeads = await getClientLeadsByDateRange({
      searchParams,
      isAdmin:
        token.role === "ADMIN" ||
        token.role === "SUPER_ADMIN" ||
        token.role !== "SUPER_SALES",
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

// Kanban columns summary
router.get("/client-leads/columns", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT" &&
      !token.isSuperSales
    ) {
      searchParams.selfId = token.id;
      searchParams.userId = token.id;
    }
    const isAdmin =
      token.role === "ADMIN" ||
      token.role === "SUPER_ADMIN" ||
      token.isSuperSales;
    const clientLeads = await getClientLeadsColumnStatus({
      searchParams,
      isAdmin,
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

// (Commented) Lead contracts list/create
// router.get("/client-leads/:id/contracts", async (req, res) => { ... })
// router.post("/client-leads/:id/contracts", async (req, res) => { ... })

// Update single contract by id
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

// Mark contract as current
router.put("/client-leads/contract/:id/current", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContract = await markAsCurrent({
      contractId: Number(id),
      ...req.body,
    });

    res.status(200).json({
      data: updatedContract,
      message: "Contract updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});

// Mark contract as completed
router.put("/client-leads/contract/:id/completed", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContract = await markAsCompleted({
      contractId: Number(id),
      ...req.body,
    });

    res.status(200).json({
      data: updatedContract,
      message: "Contract updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});

// Delete contract
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

// Update lead field (admin)
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

// Check if user allowed to take a lead by country
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

// Next calls (reminders)
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

// Update call reminder status
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

// Next meetings (reminders)
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

// Get all meeting reminders for a client lead
router.get(
  "/client-leads/:clientLeadId/meeting-reminders/",
  async (req, res) => {
    try {
      const { clientLeadId } = req.params;
      const meetingReminders = await getAllMeetingRemindersByClientLeadId({
        clientLeadId,
      });
      res.status(200).json({
        data: meetingReminders,
        message: "Meeting reminders fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching meeting reminders:", error);
      res.status(500).json({
        message:
          error.message ||
          "An error occurred while fetching meeting reminders.",
      });
    }
  }
);

// Update meeting reminder status
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

// Get a client lead (admin/self scoping)
router.get("/client-leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const token = getTokenData(req, res);
    const searchParams = req.query;

    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT" &&
      !token.isSuperSales
    ) {
      searchParams.userId = token.id;
    }
    if (
      token.role !== "ADMIN" &&
      token.role !== "CONTACT_INITIATOR" &&
      token.role !== "SUPER_ADMIN" &&
      !token.isSuperSales
    ) {
      searchParams.checkConsult = true;
    }

    const clientLeadDetails =
      token.role === "ADMIN" ||
      token.role === "SUPER_ADMIN" ||
      token.isSuperSales ||
      token.role === "CONTACT_INITIATOR"
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

// Create call reminder
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

// Create meeting reminder
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

// Create meeting reminder (with token)
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

// Create price offer
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

// Upload file to a lead
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

// Add payments / extra-service payments
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

// Price offer change status
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

// Assign lead to user / convert to deal (admin/self)
router.put("/client-leads", async (req, res) => {
  try {
    const clientLead = req.body;
    const currentUser = await getCurrentUser(req);
    const isAdmin =
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPER_ADMIN" ||
      currentUser.isSuperSales;
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

// Move lead to converted list
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

// Update lead status / price
router.put("/client-leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatePrice } = req.body;
    const currentUser = await getCurrentUser(req);
    const isAdmin =
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPER_ADMIN" ||
      currentUser.isSuperSales;
    await updateClientLeadStatus({
      clientLeadId: Number(id),
      ...req.body,
      isAdmin,
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

/* ======================================================================================= */
/*                                            Updates                                      */
/* ======================================================================================= */

// List updates for a client lead
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

// Get shared settings for a specific update
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

// Create a new update
router.post("/client-leads/:clientLeadId/updates", async (req, res) => {
  try {
    const searchParams = { ...req.query };
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

// Authorize department to access an update
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

// Unauthorize department from a shared update
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

// Archive / unarchive update
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

// Archive / unarchive shared update
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

// Mark update as done (and optionally archive)
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

/* ======================================================================================= */
/*                                        Dashboard                                        */
/* ======================================================================================= */

router.get("/dashboard/key-metrics", async (req, res) => {
  try {
    const searchParams = req.query;
    const user = await getCurrentUser(req);
    const data = await getKeyMetrics(searchParams, user.role);
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
    const user = await getCurrentUser(req);
    const data = await getDashboardLeadStatusData(searchParams, user.role);
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

router.get("/dashboard/leads-monthly-overview", async (req, res) => {
  try {
    const data = await getLeadsMonthlyOverview(req.query);
    res.status(200).json({ data });
  } catch (error) {
    console.error("leads-monthly-overview error:", error);
    res.status(500).json({ message: error.message || "Server error" });
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
    const { user } = await getCurrentUser(req);
    const data = await getRecentActivities(searchParams, user.role);
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

// Get user role (by id)
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

// Designer dashboard metrics
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

/* ======================================================================================= */
/*                                         Projects                                        */
/* ======================================================================================= */

// Projects (designers) list
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

// Projects (designers) columns
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

// Lead details by project id
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

// Projects list (by clientLead / scoped by user unless admin)
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

// Archived projects (paginated)
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

// User profile projects
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

// Project details by id (scoped)
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

// Update project
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

// Assign designer to project
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

// Update project status (designers board)
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

// Unique project groups for a lead
router.get("/client-leads/:leadId/projects/groups", async (req, res) => {
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

/* ======================================================================================= */
/*                                          Utility                                        */
/* ======================================================================================= */

// Notifications (paginated)
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

// Fixed data
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

// User logs (get within time range)
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

// Submit user log
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

/* ======================================================================================= */
/*                                           Tasks                                         */
/* ======================================================================================= */

// List tasks
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

// Create task
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

// Task details
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

// Update task
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

/* ======================================================================================= */
/*                                           Notes                                         */
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

// Add note to a lead
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

/* ======================================================================================= */
/*                                       Image Session                                     */
/* ======================================================================================= */

// Get images (by patterns / spaces)
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

// Get image session model
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

// Admin users
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

/* ======================================================================================= */
/*                                         Calendar                                        */
/* ======================================================================================= */

// Create available day
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

// Update available day
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

// Create multiple available days
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

// Add custom availability to a day
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

// Delete a slot
router.delete("/calendar/slots/:slotId", async (req, res) => {
  try {
    const { slotId } = req.params;
    const data = await deleteASlot({ slotId });
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

// Delete a day
router.delete("/calendar/days/:dayId", async (req, res) => {
  try {
    const { dayId } = req.params;
    const data = await deleteADay({ dayId });
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

/* ======================================================================================= */
/*                                    Delivery Schedule                                    */
/* ======================================================================================= */

// Delivery schedules of a project
router.get("/projects/:projectId/delivery-schedules", async (req, res) => {
  try {
    const { projectId } = req.params;
    const deliverySchedule = await getDeliveryScheduleByProjectId({
      projectId,
    });
    res.status(200).json({ data: deliverySchedule });
  } catch (error) {
    console.error("Error fetching delivery schedule:", error);
    res.status(500).json({ message: "Failed to fetch delivery schedule." });
  }
});

// Create delivery schedule
router.post("/delivery-schedule", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newDelivery = await createNewDeliverySchedule({
      userId: user.id,
      ...req.body,
    });
    res.status(200).json({ data: newDelivery, message: "Added Successfully" });
  } catch (error) {
    console.error("Error creating delivery schedule:", error);
    res.status(500).json({ message: "Failed to create delivery schedule." });
  }
});

// Link delivery schedule to meeting
router.post("/delivery-schedule/:deliveryId/link-meeting", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { meetingReminderId } = req.body;
    console.log(req.body);
    const updatedDelivery = await linkADeliveryToMeeting({
      deliveryId,
      meetingReminderId: meetingReminderId,
    });
    res
      .status(200)
      .json({ data: updatedDelivery, message: "Linked Successfully" });
  } catch (error) {
    console.error("Error linking delivery to meeting:", error);
    res.status(500).json({ message: "Failed to link delivery to meeting." });
  }
});

// Delete delivery schedule
router.delete("/delivery-schedule/:deliveryId", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    await deleteDeliverySchedule({ deliveryId });
    res.status(200).json({ message: "Delivery deleted successfully" });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    res.status(500).json({ message: "Failed to delete delivery." });
  }
});

// Get meeting reminder by id
router.get("/meeting-reminders/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params;
    const deliveries = await getMeetingById({ meetingId });
    res.status(200).json({ data: deliveries });
  } catch (error) {
    console.error("Error fetching deliveries by meeting ID:", error);
    res.status(500).json({ message: "Failed to fetch deliveries." });
  }
});

/* ======================================================================================= */
/*                                       Sales Stages                                      */
/* ======================================================================================= */

// Get sales stages for a lead
router.get("/client-lead/:clientLeadId/sales-stages", async (req, res) => {
  try {
    const imageSesssions = await getSalesStages({
      clientLeadId: Number(req.params.clientLeadId),
    });
    res.status(200).json({ data: imageSesssions });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

// Edit sales stage
router.post("/client-lead/:clientLeadId/sales-stages", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newSession = await editSalesSage({
      clientLeadId: Number(req.params.clientLeadId),
      ...req.body,
    });
    res
      .status(200)
      .json({ data: newSession, message: "Stage updated succussfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

// Remind to pay
router.post(
  "/client-leads/:clientLeadId/payment-reminder",
  async (req, res) => {
    try {
      const newSession = await remindUserToPay({
        clientLeadId: Number(req.params.clientLeadId),
      });
      res.status(200).json({ data: newSession, message: "Reminder sent" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);

// Remind to complete register
router.post(
  "/client-leads/:clientLeadId/complete-register",
  async (req, res) => {
    try {
      const newSession = await remindUserToCompleteRegister({
        clientLeadId: Number(req.params.clientLeadId),
      });
      res.status(200).json({ data: newSession, message: "Reminder sent" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);

/* ======================================================================================= */
/*                                      Reviews OAuth                                      */
/* ======================================================================================= */

// OAuth callback
router.get("/oauth2callback", async (req, res) => {
  try {
    const token = await handleOAuthCallback(req.query.code);
    res.status(200).json({ data: token });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

// Locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await getLocations(req.query.code);
    res.status(200).json({ data: locations });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

// Reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await getReviews(req.query.accountId, req.query.locationId);
    res.status(200).json({ data: reviews });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching " });
  }
});

/* ======================================================================================= */
/*                                         IDs Helper                                      */
/* ======================================================================================= */

// get ids for a model with search params
router.get("/ids", async (req, res) => {
  try {
    const model = req.query.model;
    delete req.query.model;
    const data = await getModelIds({
      searchParams: req.query,
      model,
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces" });
  }
});
/*
 */
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

/* ======================================================================================= */
/*                                        Export Router                                    */
/* ======================================================================================= */

export default router;
