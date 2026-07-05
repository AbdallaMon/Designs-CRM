export function ok(res, data, message = "OK", translationKey) {
  return res
    .status(200)
    .json({ success: true, message, data, translationKey });
}

// NOTE: returns HTTP 200 (not 201) ON PURPOSE. The entire frontend data layer checks
// `response.status === 200` after a create (notes, files, price-offers, payments, reminders,
// …). master returned 200 for these creates; the migration's earlier 201 silently broke every
// "add then show without refresh" flow. Keep 200 to preserve that observable contract.
export function created(res, data, message = "Created", translationKey) {
  return res
    .status(200)
    .json({ success: true, message, data, translationKey });
}
export function updated(res, data, message = "Updated", translationKey) {
  return res
    .status(200)
    .json({ success: true, message, data, translationKey });
}
export function deleted(res, message = "Deleted", translationKey) {
  return res.status(200).json({ success: true, message, translationKey });
}
export function noContent(res) {
  return res.status(204).send();
}
export function badRequest(res, message = "Bad Request", details = null) {
  return res.status(400).json({ success: false, message, details });
}
export function unauthorized(res, message = "Unauthorized", details = null) {
  return res.status(401).json({ success: false, message, details });
}
export function forbidden(res, message = "Forbidden", details = null) {
  return res.status(403).json({ success: false, message, details });
}
export function notFound(res, message = "Not Found", details = null) {
  return res.status(404).json({ success: false, message, details });
}
export function conflict(res, message = "Conflict", details = null) {
  return res.status(409).json({ success: false, message, details });
}
export function internalServerError(
  res,
  message = "Internal Server Error",
  details = null,
) {
  return res.status(500).json({ success: false, message, details });
}

// ✅ Usage in controller:
// import { ok, created } from "../../shared/http/response.js";

// export async function login(req, res) {
//   const result = await authUseCase.login(req.body);
//   return ok(res, result, "Logged in");
// }
// Response: { success: true, message: "Logged in", data: { user, token } }

// ❌ Bad: different format in every controller
// Controller A: res.json({ data: user })
// Controller B: res.json({ result: user, status: "ok" })
// Controller C: res.json({ user, token })
