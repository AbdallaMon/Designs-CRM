# Server Copilot Instructions (Team Standard)

This file defines how the coding agent must work in this repository.

## Operating Modes (Two Switch Cases)

The agent must always work in one of these two modes:

1. Feature Implementation Mode
2. Refactor Review Mode

If user intent is unclear, default to Feature Implementation Mode.

---

## Mode 1: Feature Implementation Mode

Use this mode when the user asks to build/modify a feature.

### Core Rules

- Implement the request end-to-end, not partial edits.
- Agent has permission to update any required file in this project.
- Follow current project conventions and folder layout.
- Keep routes thin and move business logic to services/usecases.
- Do not stop at analysis only; complete implementation when possible.

### Mandatory Change Report File

After finishing implementation, create a report file named by feature:

- Path: feature-reports/<feature-name>.md
- Example: feature-reports/chat-room-assignment.md

The report must include:

1. Summary of what was requested
2. Files created/updated/deleted
3. API changes (endpoints, request/response changes)
4. Data/model changes
5. Validation/security changes
6. Migration details (if any)
7. Manual test checklist
8. Risks/known limitations

### Prisma Schema and Migration Policy (Strict)

If schema.prisma is changed, migration is required.

Before changing schema, agent must:

1. Check affected models/relations/enums used in routes/services
2. Check existing migrations for related tables/columns
3. Confirm naming and structure follow existing conventions

After schema changes, agent must:

1. Create a migration with clear name in prisma/migrations
2. Ensure migration SQL matches schema changes
3. Document migration impact in the feature report
4. Avoid schema edits without migration, except if user explicitly asks for schema draft only

If migration generation cannot run in environment, agent must still:

- Add the schema changes
- Add a migration placeholder SQL/file with clear TODO notes
- State exactly what command should be run by team

---

## Mode 2: Refactor Review Mode

Use this mode when user asks to review new structure and compare old vs new.

### Review Goal

Compare legacy implementation with refactored implementation and report:

1. Missing behavior/features
2. Logic regressions
3. Validation/security gaps
4. Clean code and naming issues
5. Folder/module boundary violations
6. Performance/optimization opportunities

### Required Review Output Format

Agent should provide:

1. Overall verdict: OK / Needs changes / Blocker
2. Missing items list (what is forgotten)
3. Incorrect items list (what is wrong)
4. Improvement list (clean code, optimization, validation)
5. Exact files and locations to update
6. Reason for each required change

When requested, agent should apply fixes directly after review.

---

## Big Picture Architecture (Required)

Project is split into:

1. modules (or features)
2. infra
3. middlewares
4. shared

### 1) modules/

Contains domain/product features only (chat, auth, users, etc).

Each feature should own:

- routes
- controller
- usecase
- validation
- repository
- gateway (if needed)
- feature-specific middleware (if needed)

Do not place global app setup, DB client setup, or generic middleware here.

### 2) infra/

Contains setup/integrations only:

- prisma client instance
- redis client
- socket init/helpers
- logger setup
- providers (email/sms/external integrations)

No business rules in infra.

### 3) middlewares/

Contains express pipeline middleware:

- auth middleware
- validation middleware
- error middleware
- async handler
- rate limit middleware

Keep middleware focused on check/prepare/pass.

### 4) shared/

Contains common reusable code across modules:

- AppError
- constants
- common utilities
- shared validators/helpers

Do not place feature-specific business logic in shared.

---

## Inside a Module: Responsibilities

### feature.routes.js

- Define endpoints and middleware chain only
- No business logic or DB queries

### feature.controller.js

- Handle req/params/query/body
- Call usecase
- Return HTTP response
- Keep thin

### feature.usecase.js

- Contains business rules and workflows
- Orchestrates repository + gateway + providers
- No express req/res usage

### feature.repository.js

- Data access layer only (Prisma queries)
- No business decisions

### feature.gateway.js

- Adapter for legacy services or external APIs
- Not for DB access

### feature.validation.js

- Input shape/schema validation only
- No DB existence checks or permissions logic

### feature.middleware.js

- Module-specific middleware (membership checks, etc.)
- No large workflow logic

---

## Quick Rule of Thumb

- req/res: routes, controller, middleware
- business rules: usecase
- DB queries: repository
- external/legacy calls: gateway or infra providers
- setup clients: infra
- common helpers/errors: shared

---

## Recommended Target Template

src/
app.js
routes.js

    infra/
    	prisma.js
    	socket.js
    	redis.js

    middlewares/
    	auth.middleware.js
    	error.middleware.js
    	asyncHandler.js
    	validate.middleware.js

    shared/
    	errors/AppError.js
    	utils/pagination.js

    modules/
    	chat/
    		chat.routes.js
    		chat.controller.js
    		chat.usecase.js
    		chat.repository.js
    		chat.gateway.js
    		chat.validation.js
    		chat.middleware.js

---

## Existing Server Notes

- Stack: Node 18+ ESM, Express, Prisma + MySQL, BullMQ + Redis, Socket.IO, Telegram client.
- Keep route files thin; move business logic to services/usecases.
- Auth uses token cookie and shared authorization utilities.
- Respect current env keys and origins behavior.
- For long jobs (PDF/Telegram), prefer queues instead of blocking HTTP.
