import { Router } from "express";
import { getAndThrowError } from "../../services/main/utility.js";
import {
  changeContractSessionStatus,
  getContractSessionByToken,
} from "../../services/main/contract/clientContractServices.js";
const router = Router();

router.get(`/session`, async (req, res) => {
  try {
    const contractSession = await getContractSessionByToken({
      token: req.query.token,
    });
    res.status(200).json({ data: contractSession });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/session/status", async (req, res) => {
  try {
    const data = await changeContractSessionStatus({
      token: req.body.token && req.body.token !== "undefined" && req.body.token,
      id: req.body.id,
      sessionStatus: req.body.sessionStatus,
    });
    res.status(200).json({ data: data, message: "Data fetched" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
export default router;
