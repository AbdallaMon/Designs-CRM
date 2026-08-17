import { canonicalizeAssetReferences } from "../../infra/upload/upload-reference.js";

export function normalizeAssetReferencesInBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = canonicalizeAssetReferences(req.body);
  }
  next();
}

