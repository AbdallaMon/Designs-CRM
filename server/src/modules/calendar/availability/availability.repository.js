// calendar/availability repository — Prisma I/O ONLY (no business rules, no AppError).
//
// The heavy availability/slot generation + month-view logic lives in the (not-yet-
// migrated) legacy services and is invoked from the usecase via lazy adapters — the
// behavior-preserving pattern used across the migration. The ONLY direct Prisma here is
// the inline availability deletes that the LEGACY route handlers
// (routes/calendar/calendar.js DELETE /days/:id and DELETE /slots/:id) performed inline
// against a global `prisma` reference. Those queries are moved here verbatim (same
// semantics) so the v2 module keeps all Prisma in a *.repository.js file.
//
// NOTE on the legacy DELETE /days/:id behavior preserved 1:1: it first deletes the day's
// slots (deleteMany by availableDayId) and then the day itself — it does NOT guard against
// booked slots (unlike the richer service-level `deleteADay`). To preserve OBSERVABLE
// behavior of the mounted legacy route exactly, this repo reproduces that two-step delete
// with no booked-slot guard.
import prisma from "../../../infra/prisma/prisma.js";

class AvailabilityRepository {
  model = prisma.availableDay;

  // Legacy DELETE /days/:id — delete the day's slots, then the day. No booked-slot guard
  // (matching the legacy route handler, not the service-level deleteADay).
  async deleteDayWithSlots({ dayId }) {
    const id = Number(dayId);
    await prisma.availableSlot.deleteMany({ where: { availableDayId: id } });
    await prisma.availableDay.delete({ where: { id } });
    return true;
  }

  // Legacy DELETE /slots/:id — hard delete a single slot by id (no guard, matching legacy).
  async deleteSlot({ slotId }) {
    await prisma.availableSlot.delete({ where: { id: Number(slotId) } });
    return true;
  }
}

export const availabilityRepository = new AvailabilityRepository();
export { AvailabilityRepository };
