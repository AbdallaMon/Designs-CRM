import { Router } from "express";
import {
  getPagination,
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility.js";
import {
  addNote,
  changePaymentLevel,
  createARent,
  createBaseSalary,
  createOperationalExpense,
  editBaseSalary,
  generateMonthlySalary,
  getIncomeOutcomeSummary,
  getListOfPaymentInvoices,
  getNotes,
  getOperationalExpenses,
  getOutcomes,
  getPayments,
  getRents,
  getSalaryData,
  getUsersWithSalaries,
  markPaymentAsOverdue,
  processPayment,
  renewRentAndMakeOutCome,
} from "../../services/main/accountantServices.js";
import { getUserLogs } from "../../services/main/adminServices.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "ACCOUNTANT");
});

router.get("/payments", async (req, res) => {
  try {
    let { clientId, paymentId, status, type, filters, level } = req.query;

    if (JSON.parse(filters).status) {
      status = JSON.parse(filters).status;
    }
    if (JSON.parse(filters).level) {
      level = JSON.parse(filters).level;
    }
    const { limit, skip } = getPagination(req);
    const payments = await getPayments({
      status,
      paymentId,
      clientId,
      type,
      level,
      limit: Number(limit),
      skip: Number(skip),
      filters: JSON.parse(filters),
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/payments/:paymentId/invoices", async (req, res) => {
  const { paymentId } = req.params;
  try {
    const invoices = await getListOfPaymentInvoices(Number(paymentId));

    return res.status(200).json({
      data: invoices,
    });
  } catch (error) {
    console.error("Error getting payment:", error);
    return res.status(500).json({ message: error.message });
  }
});
router.post("/payments/pay/:paymentId", async (req, res) => {
  const { paymentId } = req.params;
  const { amount, issuedDate, file } = req.body;

  try {
    const user = getTokenData(req, res);

    const payment = await processPayment(
      Number(paymentId),
      +amount,
      new Date(issuedDate),
      file,
      user.id
    );

    return res.status(200).json({
      message: "Paid succussfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: error.message });
  }
});
router.post("/payments/overdue/:paymentId", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await markPaymentAsOverdue(paymentId);

    return res.status(200).json({
      message: "Payment marked as overdue",
      data: payment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: error.message });
  }
});
router.put("/payments/status/:paymentId", async (req, res) => {
  const { paymentId } = req.params;
  const { newPaymentLevel, oldPaymentLevel } = req.body;

  try {
    const user = getTokenData(req, res);

    const payment = await changePaymentLevel(
      paymentId,
      newPaymentLevel,
      oldPaymentLevel
    );

    return res.status(200).json({
      message: "Payment level changed succussfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/notes", async (req, res) => {
  try {
    const searchParams = req.query;
    const notes = await getNotes(searchParams);
    res.status(200).json({ data: notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/notes", async (req, res) => {
  try {
    const newNote = await addNote({
      ...req.body,
      userId: req.user.id,
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/operational-expenses", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const operationalExpenses = await getOperationalExpenses({
      limit: Number(limit),
      skip: Number(skip),
    });
    res.status(200).json(operationalExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/operational-expenses", async (req, res) => {
  try {
    const newExpense = await createOperationalExpense(req.body);
    res.status(200).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/rents", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const operationalExpenses = await getRents({
      limit: Number(limit),
      skip: Number(skip),
    });
    res.status(200).json(operationalExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/rents", async (req, res) => {
  try {
    const newExpense = await createARent(req.body);
    res.status(200).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put("/rents/:rentId", async (req, res) => {
  const { rentId } = req.params;
  let { amount, startDate, endDate, paymentDate, name } = req.body;
  try {
    const updatedRent = await renewRentAndMakeOutCome({
      rentId: Number(rentId),
      amount,
      startDate,
      endDate,
      paymentDate,
      name,
    });
    return res.status(200).json({
      message: "Rent updated successfully",
      data: updatedRent,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/outcome", async (req, res) => {
  try {
    const { filters } = req.query;
    const { limit, skip } = getPagination(req);
    const outcome = await getOutcomes({
      limit: Number(limit),
      skip: Number(skip),
      filters: JSON.parse(filters),
    });
    return res.status(200).json(outcome);
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  const searchParams = req.query;
  const { limit, skip } = getPagination(req);

  try {
    const { users, total } = await getUsersWithSalaries(
      searchParams,
      limit,
      skip
    );
    const totalPages = Math.ceil(total / limit);

    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ data: users, totalPages, total });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
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

router.get("/salaries/data", async (req, res) => {
  const searchParams = req.query;
  try {
    const userData = await getSalaryData(searchParams);
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
  }
});
router.post("/salaries/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    req.body.userId = userId;

    const newSalary = await createBaseSalary(req.body);
    res.status(200).json(newSalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put("/salaries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    req.body.id = id;
    const newSalary = await editBaseSalary(req.body);
    res.status(200).json(newSalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/salaries/monthly/pay", async (req, res) => {
  try {
    const newMonthlySalary = await generateMonthlySalary(req.body);
    res.status(200).json(newMonthlySalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const summary = await getIncomeOutcomeSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching supervisors" });
  }
});
export default router;
