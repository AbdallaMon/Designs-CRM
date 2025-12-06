import { Router } from "express";
import {
  createClientImageSession,
  deleteInProgressSession,
  editSessionFileds,
  getClientImageSessions,
  regenerateSessionToken,
} from "../../services/main/image-session/imageSessionSevices.js";
import {
  getAndThrowError,
  getCurrentUser,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility/utility.js";
import { getModelIds } from "../../services/main/admin/adminServices.js";

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
router.put("/:clientLeadId/sessions/:sessionId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    await editSessionFileds({
      data: req.body,
      sessionId: Number(req.params.sessionId),
    });
    res.status(200).json({
      message: "Session updated succussfully",
    });
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
    const user = await getCurrentUser(req);
    await deleteInProgressSession(Number(req.params.sessionId), user);
    res.status(200).json({
      message: "Session deleted succussfully",
    });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/ids", async (req, res) => {
  try {
    const model = req.query.model;
    delete req.query.model;
    const data = await getModelIds({
      searchParams: req.query,
      model,
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces" });
  }
});
export default router;
