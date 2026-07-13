// client-portal/notes repository — Prisma I/O ONLY. Its job is the OBJECT-SCOPE resolution the
// public notes surface needs: given the caller's per-session token, prove that the note target
// (an image session, or a selected image within it) actually BELONGS to that token's session —
// exactly the IDOR close already applied to DELETE /images/:imageId. No business rules here.
import prisma from "../../../infra/prisma/prisma.js";

class ClientNotesRepository {
  // Resolve a ClientImageSession token → its id (the scope key). Selects ONLY the id.
  // Returns null when the token matches no session.
  async findSessionIdByToken(token) {
    if (!token) return null;
    return prisma.clientImageSession.findUnique({
      where: { token },
      select: { id: true },
    });
  }

  // Resolve a ClientSelectedImage id → its owning imageSessionId. Returns null if missing.
  async findSelectedImageOwnerSessionId(imageId) {
    return prisma.clientSelectedImage.findUnique({
      where: { id: Number(imageId) },
      select: { imageSessionId: true },
    });
  }
}

export const clientNotesRepository = new ClientNotesRepository();
