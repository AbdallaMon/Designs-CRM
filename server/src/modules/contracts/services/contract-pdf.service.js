import { buildAndUploadContractPdf } from "./generate-contract-pdf.js";
import {
  getContractForCancellation,
  setContractCancelled,
} from "../contract/contract.workflow.repo.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { contractsMessagesCodes } from "@dms/shared";

// PDF rendering is logic-frozen. This service only orchestrates the existing renderer
// around repository reads/writes; the renderer, fonts, arguments, and output are unchanged.
export async function markContractAsCancelled({ contractId }) {
  const contract = await getContractForCancellation({ contractId });
  if (!contract) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
  }
  await buildAndUploadContractPdf({
    token: contract.arToken,
    id: contract.id,
    signatureUrl: contract.signatureUrl,
    lng: "ar",
    canceled: true,
  });
  return setContractCancelled({ contractId });
}
