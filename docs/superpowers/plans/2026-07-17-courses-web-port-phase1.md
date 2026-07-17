# courses-web Port & API-Fix (Phase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the standalone `Design-courses` LMS frontend into this monorepo as a new `courses-web/` npm workspace and make every screen work against the current `/v2` backend, with zero internal reorg (that is Phase 2).

**Architecture:** Copy all 95 source files verbatim into `courses-web/`, then swap the app's home-grown data layer for byte-identical copies of `web/`'s proven `/v2` layer (`apiClient` + `apiPathMap` + `getData`/`handleRequestSubmit` + `resolveMessage`). Two path-prefix rules (`admin/courses`→`courses`, `shared/courses`→`staff-courses`) plus a handful of real contract fixes (lesson-complete action, v2 reset shape, envelope/pagination normalization, message-code toasts) cover the whole API surface. Auth is delegated to the lead site (`web/`): login happens there, a button opens `courses-web`, the session cookie is shared; unauthenticated loads redirect back to `web/`'s login.

**Tech Stack:** Next 16 (App Router, Turbopack) · React 19 · MUI 7 · react-hook-form 7 · react-toastify 11 · socket.io-client 4.8. Same stack as `web/`.

## Global Constraints

- **Phase 1 only** — NO folder/feature reorganization. Files keep their original `UiComponents/…` locations. Reorg is Phase 2.
- **Do not modify `web/` internals** — the only allowed `web/` change is adding one launch button + one env var (Task 6). `web/`'s data-layer files are *copied from*, never edited.
- **No backend changes** — the `/v2` courses/auth API already exists and is frozen for master-parity.
- **JavaScript only, ESM** (`"type": "module"` semantics via Next). No TypeScript in source.
- **Message `message` field is always a language-neutral CODE** — never toast it raw; resolve via `resolveMessage` to English.
- **Verification is build + screen-smoke, not unit tests.** This is a port of already-working screens; there is no new business logic to unit-test. Each task ends with a concrete build/grep/smoke check. `web/`'s eslint is known-broken (same stack), so **`next build` is the source of truth**, never `next lint`.
- **Backend origin envs:** `NEXT_PUBLIC_API` = backend origin (e.g. `http://localhost:4001`); `NEXT_PUBLIC_URL` = same origin (sockets/files + fallback); `NEXT_PUBLIC_WEB_URL` = lead-site origin (e.g. `http://localhost:3001`) for the login redirect.
- **Ports:** `courses-web` dev = `4011`, start = `4010` (original start port). Must not collide with `web/` (3001/3010) or `server`.
- **Source of the port:** the Design-courses clone lives at
  `C:/Users/ABDALL~1/AppData/Local/Temp/claude/c--coding-design-managment-system/1337cd81-68f8-42ba-9dfe-7390414e2360/scratchpad/Design-courses`
  (referred to below as `$SRC`). If absent, re-clone: `git clone --depth 1 https://github.com/AbdallaMon/Design-courses "$SRC"`.

---

## Endpoint remap reference (authoritative for this plan)

Backend confirmed to preserve every course sub-path 1:1 (including the `attampts` misspelling). So the entire remap is:

**Path-prefix rules (added to `apiPathMap`):**
| Legacy prefix (courses site) | `/v2` target |
|---|---|
| `admin/courses` | `courses` |
| `shared/courses` | `staff-courses` |
| `auth/status` | `auth/me` |
| `auth/reset/<token>` | `auth/reset-password` *(also body change — see below)* |
| `auth/reset` | `auth/request-password-reset` *(also body change)* |

**Call-site contract fixes (NOT path-map):**
| Concern | Old call | `/v2` |
|---|---|---|
| Mark lesson complete | `PATCH shared/courses/:courseId/lessons/:lessonId` | `POST staff-courses/:courseId/lessons/:lessonId/actions/complete` |
| Chunk upload | `client/upload` / `utility/upload-chunk` | `files/client/chunks` / `files/chunks` (web/'s `uploadAsChunk`, verbatim) |
| Login payload | reads `response.user` | reads `response.data.user` (v2 wraps in `data`) |
| Envelope + pagination | flat | normalized back to flat by `apiClient` (transparent) |
| Toast text | raw `response.message` | resolved CODE→English by web/'s `handleRequestSubmit` (transparent) |
| Role switcher | `getData("shared/roles")` | **hide the switcher in Phase 1** (no 1:1 v2 path; concept became profiles). See Task 5. |

---

## Task 1: Scaffold the `courses-web` workspace (verbatim copy + config)

**Files:**
- Create dir: `courses-web/` (copy of `$SRC/src`, `$SRC/public`, `$SRC/favicon.ico`)
- Create: `courses-web/package.json`, `courses-web/next.config.mjs`, `courses-web/jsconfig.json`, `courses-web/.env.example`, `courses-web/.gitignore`
- Modify: `package.json` (root) — add `"courses-web"` to `workspaces`

**Interfaces:**
- Produces: an installable workspace whose tree mirrors `$SRC/src` under `courses-web/src`, with `@/*` → `src/*` path alias. Later tasks edit files *inside* this tree.

- [ ] **Step 1: Copy the source tree verbatim**

```bash
cd c:/coding/design-managment-system
SRC="C:/Users/ABDALL~1/AppData/Local/Temp/claude/c--coding-design-managment-system/1337cd81-68f8-42ba-9dfe-7390414e2360/scratchpad/Design-courses"
mkdir -p courses-web
cp -r "$SRC/src" courses-web/src
cp -r "$SRC/public" courses-web/public
cp "$SRC/favicon.ico" courses-web/favicon.ico 2>/dev/null || true
cp "$SRC/next.config.mjs" courses-web/next.config.mjs
cp "$SRC/jsconfig.json" courses-web/jsconfig.json
```

- [ ] **Step 2: Write `courses-web/package.json`** (align shared deps to `web/`'s versions; drop `eslint` config churn — build is the gate)

```json
{
  "name": "courses-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 4011",
    "build": "next build",
    "start": "next start -p 4010"
  },
  "dependencies": {
    "@dms/shared": "*",
    "@emotion/cache": "^11.14.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/material": "^7.2.0",
    "@mui/x-charts": "^8.9.0",
    "@mui/x-date-pickers": "^8.8.0",
    "date-fns": "^4.1.0",
    "dayjs": "^1.11.13",
    "html-react-parser": "^5.2.5",
    "mui-tel-input": "^9.0.1",
    "next": "^16.0.7",
    "react": "19.2.1",
    "react-dom": "19.2.1",
    "react-hook-form": "^7.60.0",
    "react-icons": "^5.5.0",
    "react-toastify": "^11.0.5",
    "recharts": "^3.1.0",
    "socket.io-client": "^4.8.1"
  }
}
```

- [ ] **Step 3: Write `courses-web/.env.example`**

```bash
# Backend origin (API mounted at /v2 by apiClient). No trailing slash, no version suffix.
NEXT_PUBLIC_API=http://localhost:4001
# Same origin — used for sockets, file links, and as apiClient's fallback base.
NEXT_PUBLIC_URL=http://localhost:4001
# Lead-site (web/) origin — unauthenticated loads redirect here to log in.
NEXT_PUBLIC_WEB_URL=http://localhost:3001
```

- [ ] **Step 4: Write `courses-web/.gitignore`**

```
/node_modules
/.next
/out
.env
.env.local
```

- [ ] **Step 5: Register the workspace** — edit root `package.json` `workspaces` array from `["packages/*", "server", "web"]` to `["packages/*", "server", "web", "courses-web"]`.

- [ ] **Step 6: Install**

```bash
cd c:/coding/design-managment-system && npm install
```
Expected: installs without peer-dep errors; `courses-web/node_modules` symlinked via workspace hoisting.

- [ ] **Step 7: Commit**

```bash
git add courses-web package.json package-lock.json
git commit -m "feat(courses-web): scaffold workspace as verbatim port of Design-courses"
```

---

## Task 2: Replace the data layer with web/'s proven `/v2` client

Copies six data-layer files + the message-resolution layer from `web/` into `courses-web`, fixing import paths to courses-web's tree, and adds the course/auth path rules. `useDataFetcher` and `getData`/`handleRequestSubmit` **call signatures are already identical** between the two apps, so consumers need no change.

**Files:**
- Overwrite: `courses-web/src/app/helpers/functions/getData.js`, `getDataAndSet.js`, `handleSubmit.js`, `uploadAsChunk.js` (from `web/` equivalents)
- Create: `courses-web/src/app/helpers/functions/apiClient.js`, `apiPathMap.js`, `richError.js` (from `web/`)
- Create: `courses-web/src/app/helpers/messages/resolveMessage.js` + `courses-web/src/app/helpers/messages/maps/{coursesMessages,authMessages,coreMessages,…}.js` (only the maps `resolveMessage` imports)
- Modify: the copied `apiPathMap.js` — replace `web/`'s rule set with the minimal courses set

**Interfaces:**
- Produces: `getData({url,setLoading,page,limit,filters,search,sort,others})` → `{ status, data, total, totalPages, page, extraData, message, error? }`; `handleRequestSubmit(data,setLoading,path,isFileUpload,toastMessage,setRedirect,method,header)` → parsed v2 envelope with `.status` and `.data`; `mapLegacyPathToV2(path)`; `uploadInChunks(file,setProgress,setOverlay,isClient)`.

- [ ] **Step 1: Copy the client + list/submit helpers from web/**

```bash
cd c:/coding/design-managment-system
W=web/src/app/helpers/functions
C=courses-web/src/app/helpers/functions
cp $W/apiClient.js       $C/apiClient.js
cp $W/apiPathMap.js      $C/apiPathMap.js
cp $W/richError.js       $C/richError.js
cp $W/getData.js         $C/getData.js
cp $W/getDataAndSet.js   $C/getDataAndSet.js
cp $W/handleSubmit.js    $C/handleSubmit.js
cp $W/uploadAsChunk.js   $C/uploadAsChunk.js
```

- [ ] **Step 2: Copy the message-resolution layer from web/**

```bash
cd c:/coding/design-managment-system
mkdir -p courses-web/src/app/helpers/messages/maps
cp web/src/app/helpers/messages/resolveMessage.js courses-web/src/app/helpers/messages/resolveMessage.js
cp -r web/src/app/helpers/messages/maps/. courses-web/src/app/helpers/messages/maps/
cp web/src/app/helpers/messages/authMessages.js courses-web/src/app/helpers/messages/authMessages.js 2>/dev/null || true
```
Then open `courses-web/src/app/helpers/messages/resolveMessage.js` and confirm every `import … from "./maps/X"` file now exists under `courses-web/.../maps/`. Any map that imports from `@dms/shared` is fine — that package is a workspace dep resolved by hoisting (add `"@dms/shared"` to `courses-web/package.json` dependencies as `"*"` if the build reports it missing).

- [ ] **Step 3: Fix `handleSubmit.js` imports for courses-web's tree.** `web/`'s version imports:
  - `@/shared/components/feedback/loaders/toast/ToastUpdate` → change to courses-web's existing toast: `@/app/UiComponents/feedback/loaders/taost/toast/ToastUpdate` (note the `taost` folder spelling — keep it, it's the real path).
  - `@/app/helpers/messages/resolveMessage` → already correct for courses-web.

  Verify `ToastUpdate` exports `Success` and `Failed` in courses-web (it does — same file the app already used).

- [ ] **Step 4: Replace the rule set in the copied `apiPathMap.js`.** Delete `web/`'s large `RULES` array body and replace with the courses set (keep the exported `mapLegacyPathToV2` function wrapper unchanged):

```js
const RULES = [
  // Courses — admin management surface (legacy admin/courses) → /v2/courses
  [/^admin\/courses\b/, "courses"],
  // Courses — staff consumption surface (legacy shared/courses) → /v2/staff-courses
  [/^shared\/courses\b/, "staff-courses"],
  // Auth "who am I": legacy auth/status → /v2 auth/me
  [/^auth\/status\b/, "auth/me"],
  // utility search used by a couple of pickers
  [/^utility\/search\b/, "utilities/search"],
  // Password reset — token form MUST precede the base form (order matters).
  // NOTE: body shape also changes; handled at the call site (Task 3), not here.
  [/^auth\/reset\/[^/?]+/, "auth/reset-password"],
  [/^auth\/reset\b/, "auth/request-password-reset"],
];
```
Keep `web/`'s `mapLegacyPathToV2` implementation (first-match-wins loop) below the array.

- [ ] **Step 5: Verify no consumer import broke**

```bash
cd c:/coding/design-managment-system
grep -rn "helpers/functions/getData\|helpers/functions/handleSubmit\|uploadInChunks\|useDataFetcher" courses-web/src | head
```
Expected: import specifiers already match (`@/app/helpers/functions/...`) — no edits needed in consumers because signatures are unchanged.

- [ ] **Step 6: Commit**

```bash
git add courses-web/src/app/helpers
git commit -m "feat(courses-web): adopt web/'s /v2 data layer (apiClient, path map, message codes)"
```

---

## Task 3: Rewire auth — AuthProvider, login, reset, logout

Delegates login to the lead site and repoints the auth calls to v2 shapes. `auth/me` returns `{ data: { user } }`; login returns `{ data: { user } }`.

**Files:**
- Modify: `courses-web/src/app/providers/AuthProvider.jsx`
- Modify: `courses-web/src/app/(auth)/(auth-group)/login/page.jsx`
- Modify: `courses-web/src/app/(auth)/(auth-group)/reset/ResetPage.jsx`
- Modify: `courses-web/src/app/UiComponents/buttons/Logout.jsx`

**Interfaces:**
- Consumes: `getData` (Task 2), `handleRequestSubmit` (Task 2).
- Produces: `useAuth()` → `{ user, isLoggedIn, validatingAuth, setUser, setIsLoggedIn, setValidatingAuth }` (unchanged shape).

- [ ] **Step 1: Rewrite `AuthProvider.jsx`** to use `getData("auth/status")` (→ `auth/me` via path map, auto-refresh on 401) and redirect to the lead site when unauthenticated. Replace the `useEffect` body:

```jsx
useEffect(() => {
  async function fetchData() {
    setValidatingAuth(true);
    const res = await getData({ url: "auth/status", setLoading: () => {} });
    const me = res && res.status === 200 ? res.data?.user : null;
    if (me) {
      setUser(me);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUser({ role: null, emailConfirmed: null, accountStatus: null });
      // Session lives on the lead site; send unauthenticated users there to log in.
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WEB_URL) {
        window.location.href = `${process.env.NEXT_PUBLIC_WEB_URL}/login`;
      }
    }
    setValidatingAuth(false);
  }
  fetchData();
}, []);
```
Add `import { getData } from "@/app/helpers/functions/getData";` at the top. Remove the old `localStorage.role` role-override block (the role switcher is retired in Phase 1 — Task 5).

- [ ] **Step 2: Fix login `response.user` → `response.data.user`** in `login/page.jsx`:

```jsx
const response = await handleRequestSubmit(data, setToastLoading, "auth/login", false, "Logging");
if (response.status === 200) {
  setIsLoggedIn(true);
  setUser(response.data?.user);
}
```

- [ ] **Step 3: Fix the reset flow body shapes** in `ResetPage.jsx`. v2 wants `{ email }` for request and `{ token, password }` for reset (path carries no token). Replace `handleReset`:

```jsx
async function handleReset(data) {
  try {
    if (!token) {
      await handleRequestSubmit({ email: data.email }, setToastLoading,
        "auth/reset", false, "Email is being reviewed");
    } else {
      await handleRequestSubmit({ token, password: data.password }, setToastLoading,
        `auth/reset/${token}`, false, "Resetting the password");
      router.push("/login");
    }
  } catch (e) {
    console.log(e);
  }
}
```
(The path map turns `auth/reset` → `auth/request-password-reset` and `auth/reset/<token>` → `auth/reset-password`; the body carries the token for the latter.)

Confirm the v2 `reset-password` body field names against `server/src/modules/auth/auth.validation.js` before finalizing (adjust `token`/`password` keys if the schema differs).

- [ ] **Step 4: Repoint `Logout.jsx`** — ensure it calls `handleRequestSubmit(..., "auth/logout", ...)` (path unchanged, exists in v2) and redirects to `${NEXT_PUBLIC_WEB_URL}/login` after. Inspect the file and adjust the post-logout redirect target.

- [ ] **Step 5: Verify no leftover raw auth fetches**

```bash
cd c:/coding/design-managment-system
grep -rn "auth/status\|process.env.NEXT_PUBLIC_URL}/auth\|response.user" courses-web/src/app
```
Expected: no direct `fetch(...auth/status)`, no `response.user` (all via helpers / `.data.user`).

- [ ] **Step 6: Commit**

```bash
git add courses-web/src/app/providers/AuthProvider.jsx "courses-web/src/app/(auth)" courses-web/src/app/UiComponents/buttons/Logout.jsx
git commit -m "feat(courses-web): delegate auth to lead site, repoint login/reset/logout to /v2"
```

---

## Task 4: Profile alignment + call-site contract fixes

**Profiles are the sole source of truth — no `user.role`/`subRoles` for the current user's tier.** The original site read `user.role` for (a) dashboard admin/staff routing, (b) `isAdmin`/`isDesigner` helpers, and (c) the `?role=` course content-filter. All three must derive from the **active profile's base role** via `@dms/shared`'s `PROFILE_META`. `/auth/me` returns `user.profile` (the active profile key); `PROFILE_META[profile].baseRole` maps it to a `CourseRole` enum value (ADMIN/STAFF/THREE_D_DESIGNER/TWO_D_DESIGNER/TWO_D_EXECUTOR/ACCOUNTANT/SUPER_ADMIN), which is exactly what the frozen content-filter expects. Display of *other* entities' roles the backend returns (`course.roles` tags, `access.user.role`, `attempt.role`) is left untouched — it's data, not the current user's identity.

**Files:**
- Modify: `courses-web/src/app/helpers/functions/utility.js` (add `baseRoleOf`; rewrite `isAdmin`/`isDesigner`)
- Modify: `courses-web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (route on base role, not `user.role`)
- Modify: `courses-web/src/app/UiComponents/DataViewer/courses/staff/Courses.jsx`, `lessons/staff/Lesson.jsx`, `lessons/staff/Lessons.jsx` (`?role=` → base role)
- Modify: `courses-web/src/app/UiComponents/DataViewer/lessons/staff/Lesson.jsx` (mark-complete)
- Audit + fix (if raw `response.message` toasted without resolution): any file under `courses-web/src/app/UiComponents/DataViewer` that toasts a message outside `handleRequestSubmit`
- `uploadAsChunk.js` already correct (copied from web/ in Task 2)

**Interfaces:**
- Consumes: `handleRequestSubmit` (Task 2); `PROFILE_META` from `@dms/shared`.
- Produces: `baseRoleOf(user)` → CourseRole string | null; `isAdmin(user)`, `isDesigner(user)` (profile-derived).

- [ ] **Step 1: Add the profile→base-role helper in `utility.js`** and rewrite the two role helpers. Add at the top of `courses-web/src/app/helpers/functions/utility.js`:

```js
import { PROFILE_META } from "@dms/shared";

// Profiles are the source of truth (decision §2.8): the current user's base role is
// derived from the ACTIVE profile, never from the legacy `user.role` column. Maps the
// active profile key (from /auth/me `user.profile`) to a CourseRole enum value.
export function baseRoleOf(user) {
  return user?.profile ? PROFILE_META[user.profile]?.baseRole ?? null : null;
}
```
Then replace the two existing helpers (originally `user.role === …`):

```js
export function isAdmin(user) {
  const base = baseRoleOf(user);
  return base === "ADMIN" || base === "SUPER_ADMIN";
}
export function isDesigner(user) {
  const base = baseRoleOf(user);
  return base === "TWO_D_DESIGNER" || base === "THREE_D_DESIGNER";
}
```
(Keep the original function names/exports so callers are unchanged. If `utility.js` currently reads `user.role` in any other current-user check, switch it to `baseRoleOf(user)` too — grep below.)

- [ ] **Step 2: Route the dashboard on base role.** In `courses-web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, replace `const role = user?.role;` with `const role = baseRoleOf(user);` and the guard `if (!user || !user.role) return null;` with `if (!user || !baseRoleOf(user)) return null;`. Add `import { baseRoleOf } from "@/app/helpers/functions/utility";`. The `role === "ADMIN" | "STAFF" | …` branch values are CourseRole/base-role strings and stay as-is.

- [ ] **Step 3: Repoint the `?role=` content filters to base role.** In the three staff files, change `?role=${user.role}&` → `?role=${baseRoleOf(user)}&` and import `baseRoleOf`:
  - `courses/staff/Courses.jsx:49`
  - `lessons/staff/Lesson.jsx:67`
  - `lessons/staff/Lessons.jsx:229` and `:234`

- [ ] **Step 4: Verify no current-user role read remains**

```bash
cd c:/coding/design-managment-system
grep -rn "user\.role\|user?.role\|localStorage.*role\|\.subRole" courses-web/src/app --include=*.jsx --include=*.js \
  | grep -viE "access\.user\.role|attempt\.role|course\.roles|option\.role|r\.role|\.roles\.map|UserRoles\.jsx"
```
Expected: no hits (all current-user role reads now go through `baseRoleOf`). Any remaining hit that is genuinely the *current* user's identity must be converted; a hit that is another entity's role from backend data is fine (the filter above excludes the known ones).

- [ ] **Step 5: Find the mark-complete call**

```bash
cd c:/coding/design-managment-system
grep -rn "lessons/\${lessonId}\|mark.*complete\|/complete\|PATCH" courses-web/src/app/UiComponents/DataViewer/lessons/staff
```

- [ ] **Step 6: Change mark-complete to the v2 action endpoint.** Wherever the staff lesson marks completion via `PATCH shared/courses/${courseId}/lessons/${lessonId}` (or similar), change to:

```jsx
await handleRequestSubmit(
  {}, setLoading,
  `shared/courses/${courseId}/lessons/${lessonId}/actions/complete`,
  false, "Saving progress", setRender, "POST"
);
```
The path map rewrites `shared/courses` → `staff-courses`, yielding `POST /v2/staff-courses/:courseId/lessons/:lessonId/actions/complete`. Keep whatever `setRender`/refresh the original used.

- [ ] **Step 7: Audit for raw message toasts.** Any `toast.*(response.message)` or `toast.*(res.message)` where `message` is a v2 CODE must be wrapped:

```bash
cd c:/coding/design-managment-system
grep -rn "toast.*\.message\|Success(res\|Failed(res\|Success(response.message\|Failed(response.message" courses-web/src/app
```
For each hit **outside** `handleSubmit.js`, wrap with `resolveMessage(theMessage, { fallback: "…" })` (import from `@/app/helpers/messages/resolveMessage`). Inside `handleRequestSubmit` it's already resolved.

- [ ] **Step 8: Verify no legacy upload paths remain**

```bash
cd c:/coding/design-managment-system
grep -rn "client/upload\|utility/upload-chunk" courses-web/src
```
Expected: none (web/'s `uploadAsChunk` uses `files/chunks` / `files/client/chunks`).

- [ ] **Step 9: Commit**

```bash
git add courses-web/src/app/helpers/functions/utility.js "courses-web/src/app/(auth)/dashboard" courses-web/src/app/UiComponents/DataViewer
git commit -m "feat(courses-web): profile-derived base role (no user.role); fix lesson-complete + message-code toasts"
```

---

## Task 5: Retire the `shared/roles` switcher (Phase 1 handling)

`UiComponents/buttons/UserRoles.jsx` calls `shared/roles`, which has no 1:1 v2 path (the concept became profiles). Per spec §6, hide it in Phase 1.

**Files:**
- Modify: `courses-web/src/app/UiComponents/buttons/UserRoles.jsx`
- Modify: wherever it's rendered (likely `courses-web/src/app/UiComponents/utility/Navbar.jsx`)

- [ ] **Step 1: Find where the switcher renders**

```bash
cd c:/coding/design-managment-system
grep -rn "UserRoles\|SignInWithDifferentUserRole" courses-web/src
```

- [ ] **Step 2: Neutralize the component** — make `SignInWithDifferentUserRole` return `null` (early), so it renders nothing and never calls `shared/roles`. Keep the file (Phase 2 may wire it to profiles):

```jsx
export default function SignInWithDifferentUserRole() {
  // Phase 1: the legacy `shared/roles` sub-role switcher has no /v2 equivalent
  // (the concept moved to profiles: auth/profile/switch). Hidden until Phase 2.
  return null;
  // eslint-disable-next-line no-unreachable
  /* original implementation retained below for Phase 2 reference */
}
```
(Or simply remove its render site in `Navbar.jsx` and leave the file untouched — either is acceptable; returning `null` keeps imports valid.)

- [ ] **Step 3: Verify the call is gone at runtime**

```bash
cd c:/coding/design-managment-system
grep -rn "shared/roles" courses-web/src
```
Expected: the only hit is inside the now-unreachable original body (never executed), or none.

- [ ] **Step 4: Commit**

```bash
git add courses-web/src/app/UiComponents/buttons/UserRoles.jsx courses-web/src/app/UiComponents/utility/Navbar.jsx
git commit -m "feat(courses-web): hide legacy role switcher (no /v2 equivalent, Phase 2)"
```

---

## Task 6: Lead-site launch button + full build + screen verification

**Files:**
- Create: `web/src/…` one small launch button/link component (place next to the app's nav; exact location chosen during the task)
- Modify: `web/.env.example` — add `NEXT_PUBLIC_COURSES_URL`
- Verify: `courses-web` builds and screens load

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Add the courses env var to web/** — append to `web/.env.example`:

```bash
# courses-web (LMS) origin — target of the "Courses" launch button in the nav.
NEXT_PUBLIC_COURSES_URL=http://localhost:4010
```

- [ ] **Step 2: Add a launch button in web/'s nav.** Locate web/'s primary nav/header component and add a permission-appropriate link that opens courses-web in the same tab (cookie shared):

```jsx
{process.env.NEXT_PUBLIC_COURSES_URL && (
  <Button component="a" href={process.env.NEXT_PUBLIC_COURSES_URL} color="inherit">
    Courses
  </Button>
)}
```
Find the nav file first: `grep -rln "AppBar\|Toolbar\|Navbar\|Sidebar" web/src/app | head`. Add the link where other top-level nav items live. Keep it minimal — this is the only sanctioned `web/` change.

- [ ] **Step 3: Build courses-web (source of truth)**

```bash
cd c:/coding/design-managment-system
export NEXT_PUBLIC_API=http://localhost:4001
export NEXT_PUBLIC_URL=http://localhost:4001
export NEXT_PUBLIC_WEB_URL=http://localhost:3001
npm run build -w courses-web
```
Expected: `✓ Compiled successfully`. Fix any import/path errors surfaced (most likely a missing message-map file from Task 2 Step 2, or a bad import path).

- [ ] **Step 4: Build web/ to prove the button change is clean**

```bash
cd c:/coding/design-managment-system && npm run build -w web
```
Expected: builds (baseline was green).

- [ ] **Step 5: Screen smoke (manual, per spec §9).** With `server` running and a valid lead-site session cookie present, start `npm run dev -w courses-web` and confirm each surface loads real `/v2` data with no 404 on a legacy path and no raw CODE in a toast:
  - Admin: courses list/create/edit; lessons (+ videos/pdfs/links); homeworks; tests + questions (create/reorder/edit/delete); attempts (summary, per-user review, increase/decrease, answer approve); dashboard.
  - Staff: courses list; course detail + progress; lesson view + **mark-complete** (hits `/actions/complete`); homework submit; tests (take/submit/end attempt, view attempts).
  - Unauthenticated load → redirects to `${NEXT_PUBLIC_WEB_URL}/login`.
  - Open courses-web via the new `web/` button → session intact.

  Capture the network panel / server logs; record any endpoint that 404s or any unresolved CODE and fix (add the missing path rule or message-map entry).

- [ ] **Step 6: Update PROJECT_STATE.md** — add a line under in-progress/done noting "courses-web Phase 1 (port + /v2 API fix) complete; Phase 2 = features/components reorg pending."

- [ ] **Step 7: Commit**

```bash
git add web/.env.example web/src PROJECT_STATE.md
git commit -m "feat(web): add Courses launch button to lead site; courses-web Phase 1 done"
```

---

## Self-Review

**Spec coverage:**
- §2 approach (verbatim copy + web/ data layer) → Tasks 1–2. ✓
- §3 architecture / workspace / ports → Task 1. ✓
- §4 API remap (path rules + contract fixes) → Tasks 2 (rules) + 4 (call sites). ✓
- §5 auth (delegate to web/, redirect, keep login as fallback) → Task 3. ✓
- §6 `shared/roles` gap → Task 5. ✓
- §7 data flow / uploads → Tasks 2 + 4 (uploadAsChunk verbatim). ✓
- §8 error handling (resolveMessage, 401 refresh, redirect) → Tasks 2 + 3. ✓
- §9 verification → Task 6. ✓
- §10 risks (cookie domain, message-code coverage, route order) → covered in Task 6 smoke + Task 2 map ordering note. ✓

**Placeholder scan:** No TBD/TODO left as deliverables. Two spots require reading a file before editing (v2 reset body field names in Task 3 Step 3; nav location in Task 6 Step 2) — these are explicit "inspect then adjust" instructions with the grep to find them, not hand-waves.

**Type/name consistency:** `getData`/`handleRequestSubmit`/`mapLegacyPathToV2`/`uploadInChunks` signatures are quoted from the real files and used consistently across Tasks 2–6. `useAuth()` shape preserved in Task 3. `auth/status`→`auth/me` and `response.data.user` consistent between AuthProvider and login.

**Open item carried to execution:** confirm the v2 `reset-password` request body field names (`token`/`password`) against `auth.validation.js` (Task 3 Step 3) — flagged inline, not blocking.
