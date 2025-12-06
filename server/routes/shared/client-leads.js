import { Router } from "express";
import {
  getAndThrowError,
  getCurrentUser,
  getPagination,
  getTokenData,
} from "../../services/main/utility/utility.js";
import {
  addNote,
  assignLeadToAUser,
  deleteAModel,
  editContract,
  deleteContract,
  markAsCurrent,
  markAsCompleted,
  updateClientLeadStatus,
  markClientLeadAsConverted,
  getClientLeads,
  getClientLeadsByDateRange,
  getClientLeadsColumnStatus,
  getClientLeadDetails,
  getNextCalls,
  getNextMeetings,
  getAllMeetingRemindersByClientLeadId,
  getMeetingById,
  checkIfUserAllowedToTakeALead,
  remindUserToPay,
  remindUserToCompleteRegister,
} from "../../services/main/shared/index.js";
import {
  getAdminClientLeadDetails,
  updateLeadField,
} from "../../services/main/admin/adminServices.js";
import {
  createCallReminder,
  createMeetingReminder,
  createMeetingReminderWithToken,
  createFile,
  createPriceOffer,
  updateCallReminderStatus,
  updateMeetingReminderStatus,
  createNote,
} from "../../services/main/staff/staffServices.js";
import {
  makePayments,
  makeExtraServicePayments,
  editPriceOfferStatus,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                   Client Leads List                                     */
/* ======================================================================================= */

// List client leads (+ pagination)
router.get("/", async (req, res) => {
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
router.get("/deals", async (req, res) => {
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
router.get("/columns", async (req, res) => {
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

/* ======================================================================================= */
/*                                   Client Lead Details                                   */
/* ======================================================================================= */

// Get a client lead (admin/self scoping)
router.get("/:id", async (req, res) => {
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

/* ======================================================================================= */
/*                                   Contracts Management                                  */
/* ======================================================================================= */

// Update single contract by id
router.put("/contract/:id", async (req, res) => {
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
router.put("/contract/:id/current", async (req, res) => {
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
router.put("/contract/:id/completed", async (req, res) => {
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
router.delete("/contract/:id", async (req, res) => {
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

/* ======================================================================================= */
/*                                      Lead Status                                        */
/* ======================================================================================= */

// Update lead field (admin)
router.put("/update/:id", async (req, res) => {
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
router.post("/:userId/countries", async (req, res) => {
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

// Assign lead to user / convert to deal (admin/self)
router.put("/", async (req, res) => {
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
router.put("/convert", async (req, res) => {
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
router.put("/:id/status", async (req, res) => {
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
      userId: Number(currentUser.id),
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
/*                                  Call Reminders                                         */
/* ======================================================================================= */

// Next calls (reminders)
router.get("/calls", async (req, res) => {
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
router.put("/call-reminders/:id", async (req, res) => {
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

// Create call reminder
router.post("/:id/call-reminders", async (req, res) => {
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

/* ======================================================================================= */
/*                                  Meeting Reminders                                      */
/* ======================================================================================= */

// Next meetings (reminders)
router.get("/meetings", async (req, res) => {
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
router.get("/:clientLeadId/meeting-reminders", async (req, res) => {
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
        error.message || "An error occurred while fetching meeting reminders.",
    });
  }
});

// Get specific meeting reminder by ID
router.get("/meeting-reminders/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await getMeetingById({ meetingId });
    res.status(200).json({ data: meeting });
  } catch (error) {
    console.error("Error fetching meeting reminder:", error);
    res.status(500).json({ message: "Failed to fetch meeting reminder." });
  }
});

// Update meeting reminder status
router.put("/meeting-reminders/:id", async (req, res) => {
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

// Create meeting reminder
router.post("/:id/meeting-reminders", async (req, res) => {
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
router.post("/:id/meeting-reminders/token", async (req, res) => {
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

/* ======================================================================================= */
/*                                  Price Offers & Payments                                */
/* ======================================================================================= */

// Create price offer
router.post("/:id/price-offers", async (req, res) => {
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

// Price offer change status
router.post("/price-offers/change-status", async (req, res) => {
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

// Add payments / extra-service payments
router.post("/:id/payments", async (req, res) => {
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

/* ======================================================================================= */
/*                              Files & Notes for Lead                                     */
/* ======================================================================================= */

// Upload file to a lead
router.post("/:id/files", async (req, res) => {
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

// Add note to a lead
router.post("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await createNote({ clientLeadId: Number(id), ...req.body });
    res.status(200).json({ data: note, message: "Note added successfully" });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note." });
  }
});
router.post("/:clientLeadId/payment-reminder", async (req, res) => {
  try {
    const newSession = await remindUserToPay({
      clientLeadId: Number(req.params.clientLeadId),
    });
    res.status(200).json({ data: newSession, message: "Reminder sent" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post("/:clientLeadId/complete-register", async (req, res) => {
  try {
    const newSession = await remindUserToCompleteRegister({
      clientLeadId: Number(req.params.clientLeadId),
    });
    res.status(200).json({ data: newSession, message: "Reminder sent" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

export default router;
