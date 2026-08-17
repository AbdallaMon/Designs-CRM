# Private document storage implementation plan

**Date:** 2026-08-17  
**Design:** `docs/superpowers/specs/2026-08-17-private-document-storage-design.md`

1. Add external-root environment resolution and upload-reference normalization helpers.
2. Add signed access URL creation/verification and secure the content delivery route.
3. Remove the Express static mount and public content behavior.
4. Expose signed asset references in successful HTTP and chat socket payloads while
   normalizing signed/legacy URLs on writes.
5. Route generated-PDF storage and PDF upload-image reads through the local storage
   provider without changing renderer logic.
6. Sign document links used by email and Telegram delivery.
7. Require a session token or admin permission for image-session reference reads and
   update the client wizard queries.
8. Purge/retire the unsafe service-worker upload cache and remove the frontend upload
   rewrite.
9. Add dry-run-first database normalization and verified file-copy scripts to root
   `package.json`.
10. Update environment examples and write the production cutover runbook.
11. Add focused security, normalization, storage, and authorization tests; run the
    existing PDF smoke tests, relevant server suites, and both frontend builds.
12. Review the final working-tree diff without disturbing unrelated agent changes and
    update `PROJECT_STATE.md`.

