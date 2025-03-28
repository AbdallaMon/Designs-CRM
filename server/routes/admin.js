import { Router } from "express";
import {
  getPagination,
  handlePrismaError,
  verifyTokenAndHandleAuthorization,
} from "../services/utility.js";
import {
  changeUserStatus,
  createAFixedData,
  createLeadFromExcelData,
  createStaffUser,
  deleteAFixedData,
  editAFixedData,
  editStaffUser,
  generateExcelReport,
  generateLeadReport,
  generatePDFReport,
  generateStaffExcelReport,
  generateStaffPDFReport,
  generateStaffReport,
  getNotAllowedCountries,
  getNotificationForTodayByStaffId,
  getUser,
  getUserById,
  getUserLogs,
  updateNotAllowedCountries,
  updateUserMaxLeads,
  updateUserRoles,
} from "../services/adminServices.js";
import multer from "multer";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "ADMIN");
});

router.get("/users", async (req, res) => {
  const searchParams = req.query;
  const { limit, skip } = getPagination(req);

  try {
    const { users, total } = await getUser(searchParams, limit, skip);
    const totalPages = Math.ceil(total / limit);
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ data: users, totalPages, total });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors", error });
  }
});
router.get("/users/:userId/last-seen", async (req, res) => {
  const { userId } = req.params;
  const searchParams = req.query;

  try {
    const userData = await getUserLogs(
      userId,
      searchParams.month,
      searchParams.year
    );
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
  }
});
router.get("/users/:userId/restricted-countries", async (req, res) => {
  const { userId } = req.params;

  try {
    const countries = await getNotAllowedCountries(userId);
    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
  }
});

router.post("/users/:userId/restricted-countries", async (req, res) => {
  try {
    const { userId } = req.params;

    const newUser = await updateNotAllowedCountries(userId, req.body.countries);
    res.status(200).json({
      data: newUser,
      message: "Restricted countries updated successfully",
    });
  } catch (error) {
    console.error("Error fetching personal info:", error);
    handlePrismaError(res, error);
  }
});

router.post("/users", async (req, res) => {
  const user = req.body;
  try {
    if (!user) {
      return res.status(404).json({ message: "No data was sent" });
    }
    const newUser = await createStaffUser(user);
    res
      .status(200)
      .json({ data: newUser, message: "Account created successfully" });
  } catch (error) {
    console.error("Error fetching personal info:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      res
        .status(400)
        .json({ status: 400, message: "This email is already registered" });
    } else {
      handlePrismaError(res, error);
    }
  }
});
router.put("/users/:userId/roles", async (req, res) => {
  const { userId } = req.params;
  try {
    console.log(req.body, "body");
    const update = await updateUserRoles(userId, req.body);
    return res
      .status(200)
      .json({ data: update, message: "Roles updated succussfully" });
  } catch (e) {
    handlePrismaError(res, e);
  }
});
router.put("/users/max-leads/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const update = await updateUserMaxLeads(userId, req.body.maxLeadsCounts);
    return res
      .status(200)
      .json({ data: update, message: "Max leads counts updated successfully" });
  } catch (e) {
    handlePrismaError(res, e);
  }
});
router.get("/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    return res.status(200).json({ data: user });
  } catch (error) {
    handlePrismaError(res, error);
  }
});
router.get("/users/:userId/logs", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getNotificationForTodayByStaffId(userId);
    return res.status(200).json({ data: user });
  } catch (error) {
    handlePrismaError(res, error);
  }
});
router.put("/users/:userId", async (req, res) => {
  const user = req.body;
  const { userId } = req.params;

  try {
    if (!user || !userId) {
      return res
        .status(404)
        .json({ message: "No supervisor found with this ID" });
    }
    const updatedUser = await editStaffUser(user, userId);
    res
      .status(200)
      .json({ data: updatedUser, message: "Account updated successfully" });
  } catch (error) {
    console.error("Error fetching personal info:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      res
        .status(400)
        .json({ status: 400, message: "This email is already registered" });
    } else {
      handlePrismaError(res, error);
    }
  }
});

router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { user } = req.body;

  try {
    if (!userId || !user) {
      return res.status(404).json({ message: "No user found with this ID" });
    }
    const studentPersonalInfo = await changeUserStatus(user, userId);
    res.status(200).json({
      data: studentPersonalInfo,
      message: "Operation completed successfully",
    });
  } catch (error) {
    console.error("Error fetching personal info:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating user data" });
  }
});

// Get report data
router.post("/reports/lead-report", async (req, res) => {
  try {
    await generateLeadReport(req, res);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Generate Excel report
router.post("/reports/lead-report/excel", async (req, res) => {
  try {
    await generateExcelReport(req, res);
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

// Generate PDF report
router.post("/reports/lead-report/pdf", async (req, res) => {
  try {
    await generatePDFReport(req, res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});
router.post("/reports/staff-report", async (req, res) => {
  try {
    await generateStaffReport(req, res);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Generate Excel report
router.post("/reports/staff-report/excel", async (req, res) => {
  try {
    await generateStaffExcelReport(req, res);
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

// Generate PDF report
router.post("/reports/staff-report/pdf", async (req, res) => {
  try {
    await generateStaffPDFReport(req, res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});
const upload = multer({ storage: multer.memoryStorage() });

router.post("/leads/excel", upload.single("file"), async (req, res) => {
  await createLeadFromExcelData(req, res);
});

router.post("/fixed-data", async (req, res) => {
  try {
    const createdData = await createAFixedData({ data: req.body });
    res
      .status(200)
      .json({ data: createdData, message: "Created successfully" });
  } catch (error) {
    console.error("Error updating client lead status:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/fixed-data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = await editAFixedData({ data: req.body, id: Number(id) });
    res.status(200).json({ data: updateData, message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating client lead status:", error);
    res.status(500).json({ message: error.message });
  }
});
router.delete("/fixed-data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await deleteAFixedData({ id: Number(id) });
    res
      .status(200)
      .json({ data: deletedData, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error updating client lead status:", error);
    res.status(500).json({ message: error.message });
  }
});
export default router;
