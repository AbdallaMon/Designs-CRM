import { Router } from "express";
import {
  getCurrentUser,
  getNotifications,
  getPagination,
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../services/utility.js";
import {
  assignLeadToAUser,
  assignWorkStageLeadToAUser,
  getAllFixedData,
  getClientLeadDetails,
  getClientLeads,
  getClientLeadsByDateRange,
  getDashboardLeadStatusData,
  getEmiratesAnalytics,
  getKeyMetrics,
  getLatestNewLeads,
  getMonthlyPerformanceData,
  getNewWorkStagesLeads,
  getNextCalls,
  getNextCallsForDesigners,
  getOtherRoles,
  getPerformanceMetrics,
  getRecentActivities,
  getWorkStageLeadDetails,
  getWorkStagesLeadsByDateRange,
  makeExtraServicePayments,
  makePayments,
  markClientLeadAsConverted,
  updateClientLeadStatus,
  updateLeadWorkStage,
} from "../services/sharedServices.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.get("/client-leads", async (req, res) => {
  try {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);
    const result = await getClientLeads({
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
router.get("/client-leads/deals", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (token.role === "STAFF") {
      searchParams.userId = token.id;
    }
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN" &&
      token.role !== "ACCOUNTANT"
    ) {
      searchParams.selfId = token.id;
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
    const clientLeadDetails = await getClientLeadDetails(
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

router.put("/client-leads", async (req, res) => {
  try {
    const clientLead = req.body;
    const currentUser = await getCurrentUser(req);
    const result = await assignLeadToAUser(
      Number(clientLead.id),
      Number(currentUser.id),
      clientLead.overdue
    );

    res
      .status(200)
      .json({ data: result, message: "Deal assigned to you successfully" });
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

/////////////////// Work stages routes ///////////////////

router.get("/work-stages/new", async (req, res) => {
  try {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);
    const result = await getNewWorkStagesLeads({
      limit: Number(limit),
      skip: Number(skip),
      searchParams,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});
router.get("/work-stages", async (req, res) => {
  try {
    const searchParams = req.query;
    const token = getTokenData(req, res);
    if (
      token.role === "THREE_D_DESIGNER" ||
      token.role === "TWO_D_DESIGNER" ||
      token.role === "TWO_D_EXECUTOR"
    ) {
      searchParams.userId = token.id;
    }
    const clientLeads = await getWorkStagesLeadsByDateRange({ searchParams });
    res.status(200).json({ data: clientLeads });
  } catch (error) {
    console.error("Error fetching work stages leads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching work stages leads" });
  }
});

router.get("/work-stage-leads/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const clientLeadDetails = await getWorkStageLeadDetails(Number(id));
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
router.put("/work-stages/:leadId/status", async (req, res) => {
  try {
    const { leadId } = req.params;
    await updateLeadWorkStage({
      clientLeadId: Number(leadId),
      ...req.body,
    });

    res.status(200).json({
      message: "Status changed successfully",
    });
  } catch (error) {
    console.error("Error updating work stage status:", error);
    res.status(500).json({ message: error.message });
  }
});
router.put("/work-stages/assign", async (req, res) => {
  try {
    const clientLead = req.body;
    const currentUser = await getCurrentUser(req);
    const result = await assignWorkStageLeadToAUser(
      Number(clientLead.id),
      Number(currentUser.id),
      req.query.type
    );

    res
      .status(200)
      .json({ data: result, message: "Lead assigned to you successfully" });
  } catch (error) {
    console.error("Error assigning client leads:", error);
    res.status(500).json({ message: error.message });
  }
});
router.get("/work-stages/calls", async (req, res) => {
  try {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);
    const token = getTokenData(req, res);
    if (token.role === "THREE_D_DESIGNER") {
      searchParams.userId = token.id;
    }
    const result = await getNextCallsForDesigners({
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
export default router;
