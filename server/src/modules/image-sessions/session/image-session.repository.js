// image-sessions/session repository — Prisma I/O ONLY (no business rules, no AppError, no
// legacy-service calls). Its job is the OBJECT-SCOPE RESOLUTION the legacy SHARED routes
// were missing: given a `:sessionId`, resolve the row's parent `clientLeadId` so the
// usecase can run the leads-module scope checker BEFORE touching the heavy legacy
// image-session service. (The `:clientLeadId` routes are scoped directly — no lookup.)
//
// All the heavy session CRUD logic (create/edit/regenerate/delete + reads) stays in the
// legacy `imageSessionSevices.js` service and is invoked from the usecase via lazy adapters
// — it is NOT duplicated here. The read below is a minimal id-resolution lookup only.
import prisma from "../../../infra/prisma/prisma.js";

class ImageSessionRepository {
  // Resolve a ClientImageSession → its parent clientLeadId (the scope key). Returns null if
  // the session does not exist (the usecase maps that to NOT_FOUND / denial).
  async getSessionClientLeadId({ sessionId }) {
    const row = await prisma.clientImageSession.findUnique({
      where: { id: Number(sessionId) },
      select: { id: true, clientLeadId: true },
    });
    return row;
  }
}

export const imageSessionRepository = new ImageSessionRepository();
