import { Router } from "express";
import {
  getPagination,
  verifyTokenAndHandleAuthorization,
} from "../services/utility.js";
import {
  addNote,
  createARent,
  createOperationalExpense,
  getNotes,
  getOperationalExpenses,
  getOutcomes,
  getPayments,
  getRents,
  markPaymentAsOverdue,
  processPayment,
  renewRentAndMakeOutCome,
} from "../services/accountantServices.js";
import dayjs from "dayjs";

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
    console.log(error, "error in payments");
    res.status(500).json({ message: error.message });
  }
});

router.put("/payments/pay/:paymentId", async (req, res) => {
  const { paymentId } = req.params;
  const { amount, issuedDate } = req.body;

  try {
    const payment = await processPayment(
      Number(paymentId),
      +amount,
      new Date(issuedDate)
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

router.get("/notes", async (req, res) => {
  try {
    const searchParams = req.query;
    const notes = await getNotes(searchParams);
    res.status(200).json({ data: notes });
  } catch (error) {
    console.log(error, "error in notes");
    res.status(500).json({ message: error.message });
  }
});
router.post("/notes", async (req, res) => {
  try {
    console.log(req.user, "req");
    const newNote = await addNote({
      ...req.body,
      userId: req.user.id,
    });
    res.status(200).json(newNote);
  } catch (error) {
    console.log(error, "error in creating note");
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
    console.log(error, "error in operational expenses");
    res.status(500).json({ message: error.message });
  }
});
router.post("/operational-expenses", async (req, res) => {
  try {
    console.log(req.body, "req");
    const newExpense = await createOperationalExpense(req.body);
    res.status(200).json(newExpense);
  } catch (error) {
    console.log(error, "error in creating operational expenses");
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
    console.log(error, "error in operational expenses");
    res.status(500).json({ message: error.message });
  }
});
router.post("/rents", async (req, res) => {
  try {
    const newExpense = await createARent(req.body);
    res.status(200).json(newExpense);
  } catch (error) {
    console.log(error, "error in creating operational expenses");
    res.status(500).json({ message: error.message });
  }
});
router.put("/rents/:rentId", async (req, res) => {
  const { rentId } = req.params;
  let { amount, startDate, endDate, paymentDate } = req.body;
  try {
    const updatedRent = await renewRentAndMakeOutCome({
      rentId: Number(rentId),
      amount,
      startDate,
      endDate,
      paymentDate,
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
    console.log(req.query, "query");
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
export default router;
