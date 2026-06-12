// Message map for the app-shell nav (groups + items). Keeps visible strings OUT of the
// nav.config logic (labelKey → label here). Single source for the side-nav copy.
//
// BILINGUAL (Phase 1): the labels now live in the bilingual uiDictionary under "nav.group.*" /
// "nav.item.*". The resolvers take an optional `lang` (DEFAULT "ar") and translate via the
// dictionary, so an unqualified call resolves to the SAME Arabic label as before (the dictionary's
// ar side is copied verbatim from the old maps). Callers that know the current language
// (AppSidebar/breadcrumbs via useT) pass it to get the English labels.

import { translate } from "@/app/v2/lib/i18n/uiDictionary";

/** Resolve a nav group key to its label in `lang` (default "ar"). */
export const resolveNavGroup = (key, lang = "ar") =>
  translate(lang, `nav.group.${key}`, key);
/** Resolve a nav item labelKey to its label in `lang` (default "ar"). */
export const resolveNavItem = (key, lang = "ar") =>
  translate(lang, `nav.item.${key}`, key);
