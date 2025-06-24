import { Router } from "express";
import {
  getCurrentUser,
  getPagination,
  getTokenData,
  handlePrismaError,
  verifyTokenAndHandleAuthorization,
} from "../services/main/utility.js";
import {
  changeUserStatus,
  createAFixedData,
  createCommissionByAdmin,
  createLeadFromExcelData,
  createNewImage,
  createSesssionItem,
  createStaffUser,
  deleteAFixedData,
  deleteALead,
  deleteAnImage,
  deleteSessionItem,
  editAFixedData,
  editAnImage,
  editSessionItem,
  editStaffUser,
  generateExcelReport,
  generateLeadReport,
  generatePDFReport,
  generateStaffExcelReport,
  generateStaffPDFReport,
  generateStaffReport,
  getAdminProjects,
  getAllUsers,
  getCommissionByUserId,
  getNotAllowedCountries,
  getNotificationForTodayByStaffId,
  getUser,
  getUserById,
  getUserLogs,
  updateClientField,
  updateCommission,
  updateLeadField,
  updateNotAllowedCountries,
  updateUserMaxLeads,
  updateUserRoles,
} from "../services/main/adminServices.js";
import multer from "multer";
import prisma from "../prisma/prisma.js";
import { newLeadNotification } from "../services/notification.js";
import { createGroupProjects } from "../services/main/sharedServices.js";
import {
  addCutsomDate,
  createAvailableDatesForMoreThanOneDay,
  createAvailableDay,
  deleteASlot,
  updateAvailableDay,
} from "../services/main/calendarServices.js";

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
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors", error });
  }
});
router.get("/all-users", async (req, res) => {
  const searchParams = req.query;

  try {
    const users = await getAllUsers(searchParams);

    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
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

// random

router.post("/leads/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLead = await updateLeadField({ data: req.body, leadId: id });
    if (req.body.initialConsult) {
      const lead = await prisma.clientLead.findUnique({
        where: {
          id: Number(id),
        },
        select: {
          client: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });
      await newLeadNotification(Number(id), lead.client);
    }
    res.status(200).json({
      data: updatedLead,
      message: "Lead updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});
router.put("/client/update/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const updatedLead = await updateClientField({
      data: req.body,
      clientId: clientId,
    });

    res.status(200).json({
      data: updatedLead,
      message: "Lead updated successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});
router.delete("/client-leads/:id", async (req, res) => {
  try {
    const token = await getTokenData(req, res);
    const { id } = req.params;
    if (token.role !== "ADMIN") {
      throw new Error("Not allowed");
    }
    const deletedLead = await deleteALead(id);

    res.status(200).json({
      data: deletedLead,
      message: "Lead Deleted successfully",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: e.message });
  }
});
// commission routes
router.get("/commissions", async (req, res) => {
  try {
    const commission = await getCommissionByUserId(req.query.userId);
    res.status(200).json({ data: commission });
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});
router.post("/commissions", async (req, res) => {
  try {
    const { userId, amount, leadId, commissionReason } = req.body;
    const createdCommision = await createCommissionByAdmin({
      amount: amount,
      userId: userId,
      leadId: leadId,
      commissionReason: commissionReason,
    });
    res
      .status(200)
      .json({ data: createdCommision, message: "Created successfully" });
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});
router.put("/commissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const updatedCommission = await updateCommission({
      amount,
      commissionId: id,
    });
    res
      .status(200)
      .json({ data: updatedCommission, message: "Updated successfully" });
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});
router.get("/projects", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const searchParams = req.query;

    const data = await getAdminProjects(searchParams, limit, skip);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});
router.post("/projects/create-group", async (req, res) => {
  try {
    const projects = await createGroupProjects({
      clientleadId: req.body.clientLeadId,
      title: req.body.title,
    });
    res
      .status(200)
      .json({ data: projects, message: "Projects created successfully" });
  } catch (error) {
    console.error("Error fetching commission:", error);
    res.status(500).json({ message: error.message });
  }
});

// images sesssions ///
router.post("/images", async (req, res) => {
  try {
    const image = createNewImage(req.body);
    res.status(200).json({ data: image, message: "Created succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});
router.put("/images/:id", async (req, res) => {
  try {
    const image = editAnImage({ data: req.body, id: req.params.id });
    res.status(200).json({ data: image, message: "Image edited succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});
router.delete("/images/:id", async (req, res) => {
  try {
    const image = deleteAnImage(req.params.id);
    res.status(200).json({ data: image, message: "Deleted succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});

router.post("/image-session", async (req, res) => {
  try {
    console.log("is creating");

    const item = createSesssionItem({ data: req.body, model: req.query.model });
    res.status(200).json({ data: item, message: "Created succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});
router.put("/image-session/:id", async (req, res) => {
  try {
    console.log("is editing");
    const item = editSessionItem({
      data: req.body,
      model: req.query.model,
      id: req.params.id,
    });
    res.status(200).json({ data: item, message: "Edited succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});
router.delete("/image-session/:id", async (req, res) => {
  try {
    const item = deleteSessionItem({
      data: req.body,
      model: req.query.model,
      id: req.params.id,
    });
    res.status(200).json({ data: item, message: "Deleted succussfully" });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ message: "Error creating image" });
  }
});

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
    });
    res.status(200).json({
      message: "Available day created successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error creating available day",
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
    });
    res.status(200).json({
      message: "Custom available day created successfully",
      data: "",
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
export default router;
