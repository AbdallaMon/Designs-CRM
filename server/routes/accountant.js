import { Router } from "express";
import { verifyTokenAndHandleAuthorization } from "../services/utility.js";
import { getPayments, processPayment } from "../services/accountantServices.js";
import dayjs from "dayjs";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "ACCOUNTANT");
});

router.get("/payments", async (req, res) => {
  try {
    let { month, clientId, paymentId, status, type, range } = req.query;
    const startOfMonth = dayjs(month).startOf("month").toDate();
    const endOfMonth = dayjs(month).endOf("month").toDate();
    console.log(range, "range");
    if (range) {
      range = JSON.parse(range);
    }
    const payments = await getPayments({
      status,
      startOfMonth,
      endOfMonth,
      paymentId,
      clientId,
      type,
      range,
    });
    res.status(200).json({ message: "", data: payments });
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
export default router;
