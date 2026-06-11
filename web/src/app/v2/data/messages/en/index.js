// English aggregator for the FE message-code maps — the EN counterpart of ../index.js.
//
// BILINGUAL Phase 1: covers the high-traffic namespaces returned on EVERY request
// (general, auth) plus leads. The remaining namespaces are intentionally NOT translated yet —
// when lang=en and a code isn't found here, resolveMessageCode falls back to the Arabic map, so
// nothing breaks and no raw CODE leaks. To add a namespace later: create ./en/<ns>.js mirroring
// the Arabic map's keys, import it here, and register it in BOTH objects below — same shape as the
// Arabic aggregator, so it's a mechanical fill.

import { generalMessagesEn } from "./general.js";
import { authMessagesEn } from "./auth.js";
import { leadsMessagesEn } from "./leads.js";

// (a) Per-namespace registry — keys MUST match packages/shared/messages-names.js (the value the
// envelope carries in `translationKey`), identical to the Arabic registry's keys.
export const MESSAGES_BY_NAMESPACE_EN = {
  generalMessages: generalMessagesEn,
  authMessages: authMessagesEn,
  leadsMessages: leadsMessagesEn,
};

// (b) FLAT map — every translated code → English, namespace-agnostic. Domain maps first; the
// universal auth + general maps LAST so shared CODE_STRINGs (FORBIDDEN, UNAUTHORIZED, …) resolve
// to the universal wording (matches the Arabic aggregator's precedence).
export const ALL_MESSAGE_CODES_EN = {
  ...leadsMessagesEn,
  ...authMessagesEn,
  ...generalMessagesEn,
};
