# Contract stage-chain hardening implementation plan

Date: 2026-08-18  
Design: `docs/superpowers/specs/2026-08-18-contract-stage-chain-hardening-design.md`

1. Add focused failing regression tests for ordered advancement, missing levels, terminal completion, signature idempotency, schedule recalculation, and cancelled schedule visibility.
2. Replace project-id-driven stage mutation with a transactional ordered-stage transition shared by signature and project-completion triggers.
3. Gate the project hook on a real transition into `Completed` and preserve the existing project-to-level mapping.
4. Add the `contract.stage.override_status` permission, strict validation schema, dedicated action route/controller/usecase, workflow operation, audit action, and message codes.
5. Add the permission-gated contract-stage repair dialog with mandatory status and reason inputs.
6. Run focused contract/project/delivery tests, permission and validation tests, the server suite, frontend tests/build, and inspect the final diff for unrelated-file overlap.
7. Record the completed behavior and verification evidence in `PROJECT_STATE.md`.
