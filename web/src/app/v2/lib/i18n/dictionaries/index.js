// Dictionaries barrel — the COMPOSITION point for per-feature UI dictionaries.
//
// PURPOSE: let many agents fill ONE file each (./<feature>.js) with NO merge conflicts and NO
// edits here. Every stub exports `ar` and `en` (namespaced-key → string maps). This barrel imports
// them all and DEEP-MERGES every `ar` into a single ar object and every `en` into a single en
// object. uiDictionary.js then merges THESE on top of its core keys, so a filled stub's keys are
// picked up automatically by translate()/t() with zero further wiring.
//
// ADDING A NEW FEATURE STUB: create ./<feature>.js (export const ar = {}; export const en = {};),
// then add ONE import + ONE entry to the `modules` array below. That is the only edit needed.
//
// MERGE SEMANTICS: deepMerge is a recursive object merge (later wins on a leaf collision). Keys are
// namespaced by feature ("leads.*", "projects.*"), so cross-stub collisions should not occur; the
// merge is recursive only to tolerate nested-object key maps if a stub chooses that shape.

import * as shell from "./shell.js";
import * as common from "./common.js";
import * as leads from "./leads.js";
import * as leadsDetails from "./leadsDetails.js";
import * as projects from "./projects.js";
import * as projectsDetails from "./projectsDetails.js";
import * as tasks from "./tasks.js";
import * as accounting from "./accounting.js";
import * as users from "./users.js";
import * as usersDetails from "./usersDetails.js";
import * as contracts from "./contracts.js";
import * as imageSessions from "./imageSessions.js";
import * as dashboard from "./dashboard.js";
import * as chat from "./chat.js";
import * as calendar from "./calendar.js";
import * as notifications from "./notifications.js";
import * as questions from "./questions.js";
import * as salesStages from "./salesStages.js";
import * as siteUtility from "./siteUtility.js";
import * as utilities from "./utilities.js";
import * as adminResidual from "./adminResidual.js";
import * as auth from "./auth.js";

// The full registry of per-feature stubs. Order is irrelevant for correctness (keys are
// feature-namespaced); a new stub just appends here.
const modules = [
  shell,
  common,
  leads,
  leadsDetails,
  projects,
  projectsDetails,
  tasks,
  accounting,
  users,
  usersDetails,
  contracts,
  imageSessions,
  dashboard,
  chat,
  calendar,
  notifications,
  questions,
  salesStages,
  siteUtility,
  utilities,
  adminResidual,
  auth,
];

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Recursive deep-merge of source INTO target (mutates + returns target). Later wins on leaves. */
function deepMerge(target, source) {
  if (!isPlainObject(source)) return target;
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (isPlainObject(sv) && isPlainObject(target[key])) {
      deepMerge(target[key], sv);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

// Fold every stub's `ar` / `en` into a single merged map per language.
export const featureDictionaries = modules.reduce(
  (acc, mod) => {
    deepMerge(acc.ar, mod.ar ?? {});
    deepMerge(acc.en, mod.en ?? {});
    return acc;
  },
  { ar: {}, en: {} },
);

export { deepMerge };
export default featureDictionaries;
