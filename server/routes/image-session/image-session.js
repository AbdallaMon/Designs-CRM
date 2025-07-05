import { Router } from "express";
import {
  createClientImageSession,
  deleteInProgressSession,
  getClientImageSessions,
  regenerateSessionToken,
} from "../../services/main/image-session/imageSessionSevices.js";
import {
  getAndThrowError,
  getCurrentUser,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility.js";

const router = Router();
router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.get("/:clientLeadId/sessions", async (req, res) => {
  try {
    const imageSesssions = await getClientImageSessions(
      Number(req.params.clientLeadId)
    );

    res.status(200).json({ data: imageSesssions });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post("/:clientLeadId/sessions", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const newSession = await createClientImageSession({
      clientLeadId: Number(req.params.clientLeadId),
      userId: Number(user.id),
      selectedSpaceIds: req.body.spaces,
    });
    res
      .status(200)
      .json({ data: newSession, message: "New session created succussfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put(
  "/:clientLeadId/sessions/:sessionId/re-generate",
  async (req, res) => {
    try {
      const newSession = await regenerateSessionToken(
        Number(req.params.sessionId)
      );
      res.status(200).json({
        data: newSession,
        message: "Session link regenerated please copy it",
      });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.delete("/:clientLeadId/sessions/:sessionId", async (req, res) => {
  try {
    await deleteInProgressSession(Number(req.params.sessionId));
    res.status(200).json({
      message: "Session deleted succussfully",
    });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
export default router;
