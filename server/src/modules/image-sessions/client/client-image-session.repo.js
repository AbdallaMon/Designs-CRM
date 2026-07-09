// image-sessions/client repository — Prisma I/O ONLY (no business rules, no AppError, no
// legacy-service calls). Its sole job is the OBJECT-SCOPE RESOLUTION the public DELETE
// /images/:imageId path was missing: given a ClientSelectedImage id, resolve the row's
// owning `imageSessionId` (the direct FK to ClientImageSession — schema.prisma model
// ClientSelectedImage l.1712-1720) so the usecase can confirm the image BELONGS to the
// token-resolved session BEFORE invoking the frozen `deleteImage` service.
//
// All the heavy delete logic (note cleanup + clientSelectedImage.delete) stays in the
// FROZEN `imageSessionSevices.js` service and is invoked from the usecase via the lazy
// adapter — it is NOT duplicated here. The read below is a minimal scope lookup only.
import prisma from "../../../infra/prisma/prisma.js";

class ClientImageSessionRepository {
  // Resolve a ClientSelectedImage → its owning imageSessionId (the scope key). Selects ONLY
  // that field. Returns null if the image does not exist (the usecase maps that to NOT_FOUND).
  async findSelectedImageOwnerSessionId({ imageId }) {
    const row = await prisma.clientSelectedImage.findUnique({
      where: { id: Number(imageId) },
      select: { imageSessionId: true },
    });
    return row;
  }
}

export const clientImageSessionRepository = new ClientImageSessionRepository();
