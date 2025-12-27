import { Router } from "express";
import { getCurrentUser } from "../../services/main/utility/utility.js";
import {
  getKeyMetrics,
  getDashboardLeadStatusData,
  getMonthlyPerformanceData,
  getEmiratesAnalytics,
  getLeadsMonthlyOverview,
  getPerformanceMetrics,
  getLatestNewLeads,
  getRecentActivities,
  getDesignerMetrics,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                        Dashboard                                        */
/* ======================================================================================= */

// Key metrics
router.get("/key-metrics", async (req, res) => {
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

// Lead status data
router.get("/leads-status", async (req, res) => {
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

// Monthly performance
router.get("/monthly-performance", async (req, res) => {
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

// Emirates analytics
router.get("/emirates-analytics", async (req, res) => {
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

// Leads monthly overview
router.get("/leads-monthly-overview", async (req, res) => {
  try {
    const data = await getLeadsMonthlyOverview(req.query);
    res.status(200).json({ data });
  } catch (error) {
    console.error("leads-monthly-overview error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Week performance
router.get("/week-performance", async (req, res) => {
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

// Latest leads
router.get("/latest-leads", async (req, res) => {
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

// Recent activities
router.get("/recent-activities", async (req, res) => {
  try {
    const searchParams = req.query;
    const user = await getCurrentUser(req);
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

// Designer metrics
router.get("/designer-metrics", async (req, res) => {
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

export default router;
