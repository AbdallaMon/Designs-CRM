# PDF assets from SiteUtility (intro + company signature + full background)

**Date:** 2026-07-12
**Branch:** feat/audit-log-sales-admin (Phase 1 of a two-phase effort)
**Status:** Approved — implementing Phase 1

## Problem

The two PDF subsystems hardcode their branding assets and diverge in how they draw them:

| asset | contract PDF (`generate-contract-pdf.js`) | image-session PDF (`image-sessions/legacy/client-services.js`) |
|---|---|---|
| full-page background | ✅ `siteUtility.pdfFrame` via `drawFullBackgroundImage` | ❌ none — draws a **banner** header (`https://dreamstudiio.com/pdf-banner.jpg`) per page |
| intro image | ✅ `siteUtility.introPage` | ❌ hardcoded `https://dreamstudiio.com/Pdf-intro.png` |
| company signature/stamp | ❌ hardcoded `${env.COOKIE_DOMAIN}/dream-signature.png` | ❌ hardcoded `https://dreamstudiio.com/dream-signature.png` |

Goal: both PDFs source **intro + company signature + full background** from the `SiteUtility`
singleton; the image-session drops the banner and uses a full-page background like the contract;
and the uploaded company signature is validated (PNG + cropped) at save time.

> This intentionally **changes frozen PDF behavior** (CLAUDE.md §4). The user explicitly requested
> it, which overrides the freeze. Phase 2 (the separate legacy cleanup) is behavior-preserving and
> runs only after this ships.

## Source of truth

`SiteUtility` singleton (`packages/db/prisma/schema.prisma`, id=1 — FROZEN schema, no changes):
- `pdfFrame` → full-page background
- `introPage` → intro-page image
- `pdfSignaturePart` → company signature/stamp (first party)

## Default fallbacks

When a `SiteUtility` field is empty, fall back to these **root-relative** paths so
`toAbsoluteAssetUrl` (in `infra/pdf/pdf-helpers.js`) prepends `CRM_DOMAIN`:

- intro: `/Pdf-intro.png`
- signature: `/dream-signature.png`
- background: `/uploads/19439a10-00f6-4c2a-81b9-1a3680f9089f.jpg`

Defined once as `PDF_ASSET_DEFAULTS` in a shared server module (`infra/pdf/pdf-asset-defaults.js`)
so both generators and the validator agree.

**Resolution:** each generator resolves `const url = siteUtility?.<field> || PDF_ASSET_DEFAULTS.<field>`,
then `fetchImageBuffer(url)` → `toAbsoluteAssetUrl` prepends `CRM_DOMAIN` for `/…` paths.

**⚠️ Behavior-change risk to verify:** intro/signature are currently fetched from
`https://dreamstudiio.com/…` and `${env.COOKIE_DOMAIN}/…`. Switching to `CRM_DOMAIN`-relative
changes the host. Must confirm `CRM_DOMAIN` serves `/Pdf-intro.png` and `/dream-signature.png` at
root (or that those assets exist there). Verify with a real generated PDF before considering done.

## Changes

### 1. `PDF_ASSET_DEFAULTS` constant
New `server/src/infra/pdf/pdf-asset-defaults.js` exporting `{ introPage, pdfSignaturePart, pdfFrame }`.

### 2. Contract PDF (`generate-contract-pdf.js`, stays in `legacy/` for Phase 1)
- Add fallbacks to the existing `pdfFrame`/`introPage` reads in `buildAndUploadContractPdf`.
- Resolve `signaturePartUrl = siteUtility?.pdfSignaturePart || PDF_ASSET_DEFAULTS.pdfSignaturePart`,
  thread it down like `introImageUrl`, and replace the hardcoded
  `${env.COOKIE_DOMAIN}/dream-signature.png` fetch with it.

### 3. Image-session PDF (`client-services.js`, stays in `legacy/` for Phase 1)
- Fetch the `SiteUtility` singleton inside `generateImageSessionPdf` (file already imports prisma).
- **Remove banner:** `drawFixedHeader()` (fetches `pdf-banner.jpg`) → replace its role with
  `drawFullBackgroundImage(page, pdfDoc, bgUrl)` (ported/shared with the contract helper), drawn
  first on every added page. Keep the existing border + footer drawn on top of the background;
  fine-tune spacing visually against a generated PDF.
- **Intro:** `introPage || default` instead of the hardcoded `Pdf-intro.png`.
- **Company stamp:** `pdfSignaturePart || default` instead of the hardcoded `dream-signature.png`.
- The client (second-party) `signatureUrl` passed in is unchanged.

### 4. Signature validation at save (`site-utility.usecase.js → updatePdfConfig`)
When `input.pdfSignaturePart` is present, fetch the **raw** image (plain fetch, **no**
`compressImageBuffer` resize) and assert via `sharp`:
- `metadata.format === "png"` else throw `AppError(SIGNATURE_MUST_BE_PNG, 422)`
- cropped: run `sharp(buf).trim()` → if the trimmed dimensions differ from the original (beyond a
  small tolerance) throw `AppError(SIGNATURE_MUST_BE_CROPPED, 422)`

New codes `SIGNATURE_MUST_BE_PNG`, `SIGNATURE_MUST_BE_CROPPED` in
`packages/shared/messages-codes/site-utility/site-utility.js`, and their English strings in
`web/src/app/helpers/messages/maps/siteUtilityMessages.js` (small, feature-required exception to
"leave web").

## Testing / verification

- Unit tests for the validator: non-PNG rejected, non-cropped rejected, valid PNG accepted.
- Generate a real contract PDF and a real image-session PDF; visually confirm intro, company
  signature, and full background all come from `SiteUtility`, and the image-session banner is gone.
- Server build + related test suites (`site-utility`, `image-sessions`, `contracts`).

## Out of scope (Phase 2, later)

Legacy cleanup/reorg (behavior-preserving): relocate/split the `legacy/` files into their proper
module homes, delete anything unused, drop the "legacy" naming. Runs only after Phase 1 is verified.
