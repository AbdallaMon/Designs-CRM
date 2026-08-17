# Public lead source and funnel compatibility implementation plan

Date: 2026-08-16

1. Add the Prisma field and generate an additive migration.
2. Extend public lead/booking validation, repositories, usecases, projections, and tests.
3. Send the browser origin from the CRM client form and render it in lead preview.
4. Update the external register request, token storage, upload, payment, and booking flows.
5. Add explicit public-funnel CSRF exemptions and tests.
6. Add conditional database claims for public completion and booking submit, with race tests.
7. Configure integration credential encryption secrets and synchronize safe examples.
8. Fix the named frontend runtime/hook/key issues and non-frozen upload/import error codes.
9. Replace vulnerable `xlsx`, apply the safe `uuid` override, then run audits.
10. Run targeted tests, the complete suite, Prisma validation/generation, both CRM builds, the
    external build/lint, env parity, endpoint parity, and diff review.

