You are tasked with creating one combined frontend refactoring plan for the Dream Studio Next.js 15 app, tightly linked to the backend refactor plan.

Your output must be a single markdown file only:

ui/.github/combined-refactor-plan.md

Do not create a separate frontend-only plan.
Do not create HTML or CSS files.
The goal is to build a clear bridge between:

the existing old frontend code
the new proposed frontend v2 structure
the backend refactor plan, including its routes, TODOs, and enhancements
Mandatory Pre-Work

Before writing the plan, you must read and understand all of the following:

server/.github/refactor-plan.md
Read every module, every TODO, every route enhancement, and every dependency note.
Treat this file as the source of truth for backend modules, routes, and planned enhancements.
All frontend files under ui/src/app/
Read all files recursively
Include:
pages
layouts
route groups
components
hooks
helpers
providers
service files
validation files
constants
types
the full v2/ structure
Do not skip legacy code.
ui/.github/copilot-instructions.md
Follow all project conventions and patterns from this file.
Main Objective

Create one combined migration plan that links:

Old frontend file/location
New frontend target location in v2
Related backend module
Related backend routes
Related backend enhancements / TODOs
Frontend changes required because of backend changes

This is not a generic plan.

It must clearly answer:

Where is this feature in the old frontend code?
Where should it move in the new frontend structure?
Which backend module and routes does it depend on?
What backend enhancements will affect it?
What must change on the frontend when backend routes / DTOs / validation / socket events change?
Core Rules
Do not create two plans. Only generate:
ui/.github/combined-refactor-plan.md
Do not generate HTML or CSS.
Do not invent existing files.
If proposing new files/folders, mark them clearly as proposed.
Do not describe only the new architecture; always link it back to the old code location.
Do not describe only frontend migration; always connect it to the backend refactor plan.
Every important backend module/TODO should have a matching frontend migration section.
Every major frontend feature found in the old code should show:
current location
new target location
backend dependency
migration notes
Required Output File

Create exactly this file:

ui/.github/combined-refactor-plan.md

Required Structure of combined-refactor-plan.md

1. Title and Purpose

Explain that this file is the master migration plan linking:

legacy frontend code
new frontend v2 structure
backend refactor modules, routes, and enhancements 2. Table of Contents

Include a clear table of contents.

3. Progress Dashboard

Add a dashboard with status indicators / checkboxes for:

backend module reviewed
old frontend files identified
frontend consumers identified
target v2 location defined
route/enhancement linkage completed
migration notes completed

Use tables and checkboxes.

4. Audit Summary

Summarize what was reviewed:

backend refactor file
old frontend structure
current v2/ structure
hooks/helpers/providers/services
route consumers

Also summarize the main architectural findings, such as:

duplicated logic
scattered API calls
legacy folder sprawl
weak shared-vs-feature separation
missing validation
inconsistent loading/error handling
client/server boundary issues
route organization issues
provider overuse
old code not clearly mapped to backend modules 5. Shared Migration Principles

Define the guiding principles, such as:

shared once, import everywhere
mirror backend module names where possible
use v2/module/auth/ as the canonical frontend pattern
keep shared code in:
v2/shared/
v2/shared/hooks/
v2/shared/form/
v2/lib/
v2/providers/
keep feature logic in:
v2/module/{feature}/
do not duplicate shared UI/hooks/services per module
every backend route must have a frontend consumer or an explicit note that no current consumer was found 6. Backend Route / Enhancement → Frontend Consumer Mapping

This section is mandatory.

Include a table with columns like:

Backend TODO / Module
Backend Route or Enhancement
Old Frontend File(s)
Current Hook / Fetch / Service Consumer
Proposed New v2 Location
Frontend Change Needed
Migration Risk / Notes

This section must connect backend changes directly to the frontend old and new locations.

7. Module-by-Module Combined Migration Sections

For every major backend module / TODO in server/.github/refactor-plan.md, create a matching section.

Use this structure:

Backend TODO X: {module} Module
Brief summary of backend work
Key routes involved
Key enhancements involved
Frontend Legacy Location

List the actual old frontend files currently related to this module, such as:

page files
components
hooks
helpers
providers
services
Frontend Current Consumption

Explain:

which backend endpoints are currently consumed
where raw fetch / helper / custom hooks are used
where response data is rendered
where forms, tables, modals, sockets, uploads, or filters are handled
Frontend Target v2 Mapping

Show clearly:

old file/folder → new target file/folder

For example:

ui/src/app/UiComponents/DataViewer/leads/...
→ ui/src/app/v2/module/leads/...
ui/src/app/helpers/...
→ ui/src/app/v2/lib/...
ui/src/app/providers/...
→ ui/src/app/v2/providers/...

This section must explicitly map old → new, not just describe the new structure.

Shared vs Feature-Specific Split

Clarify:

what moves into shared
what stays inside the feature module
Frontend Changes Required بسبب Backend Changes

For this module, document:

endpoint path updates
response shape / DTO changes
form validation alignment
loading/error/empty state updates
socket event updates
upload flow changes
pagination/filter/search handling changes
permissions / auth / role-based rendering changes
File-by-File TODO Checklist

Add actionable TODOs with checkboxes.
Each TODO should mention:

affected old file(s)
target new file(s)
related backend route or enhancement
exact frontend change needed
reason / benefit 8. Shared Cross-Cutting Migration Work

Group shared tasks once here instead of repeating them in every module, for example:

standardize API client
replace scattered raw fetch calls
centralize config/env handling
centralize toast handling
centralize upload utilities
unify form validation patterns
unify table/list patterns
unify loading/error/empty states
provider cleanup
socket abstraction improvements
shared RTL/i18n handling

For each shared task, mention:

old code locations
target new location
which backend enhancements make this necessary 9. Old Frontend → New v2 Mapping Index

This section is mandatory.

Provide a mapping index/table showing:

Old frontend file/folder
New v2 target file/folder
Related backend module
Related backend routes / enhancements
Notes

This should act like a migration reference so a developer can quickly see where each old piece belongs in the new structure.

10. Breaking Changes and Coordination Notes

Document:

backend changes that require simultaneous frontend updates
risky response-shape changes
route renames
validation contract changes
auth/session changes
socket event contract changes
places where a compatibility layer may be needed temporarily 11. Phased Roadmap

Use phases such as:

Phase 0: review existing v2 foundation
Phase 1: shared infrastructure and shared abstractions
Phase 2: low-risk module migrations
Phase 3: complex feature modules
Phase 4: backend-coupled migrations that need coordination
Phase 5: cleanup and legacy removal

The roadmap must reflect dependencies between:

backend readiness
shared frontend infrastructure
feature migration order 12. Dependency Notes

Show which frontend modules depend on:

auth
API client
shared form system
shared table system
providers
socket layer
upload utilities
language/RTL handling

Also reference related backend module dependencies where relevant.

13. Final Migration Checklist

End with a master checklist that can be used to track execution.

Required Quality Rules

The generated file must be:

project-specific
file-aware
route-aware
backend-linked
old-to-new mapped

Avoid vague statements like:

“move feature to a better structure”
“improve organization”
“use reusable components”

Instead, always say:

which old files
which new location
which backend route/module
which concrete change
why it matters
Key Principle

This file must function as a migration bridge between:

old frontend
new frontend v2
backend refactor plan

If a section does not connect all three where relevant, it is incomplete.
