# Scoped search, project visibility, and durable attachments design

**Date:** 2026-08-18  
**Baseline:** deployed `master` plus the approved permission/profile model  
**Schema/PDF impact:** none

## Lead search

The shared lead autocomplete must never be a second, wider lead-list endpoint. Normal and
primary sales search only their own leads; `SUPER_SALES` and admin-tier profiles retain their
existing full lead scope, designers retain assignment-derived scope, and the existing explicit
accountant/contact-initiator scope is unchanged. Results are unique by lead id and expose both
the seven-digit lead id and lead code using the same identity pattern as lead details.

The client discards stale autocomplete responses, deduplicates by id defensively, and uses id
equality rather than the rendered label. This prevents repeated-looking options when one client
has multiple leads or when multiple requests complete out of order.

## Project reads used by contracts

`master` rendered the Projects section for primary sales/admin-tier users and its project-list
service returned every project group for the selected lead. The unauthenticated legacy group
route is not restored. Instead, client-lead-keyed project reads use the existing lead scope for
sales profiles and the existing project-assignment scope for design/execution profiles.

This lets normal/primary sales read project groups for a lead they may access when creating a
contract or changing a contract's project group. It does not change project mutation scope:
project field/status edits still require project assignment or full project scope, while contract
changes still require lead mutation scope. `SUPER_SALES` keeps its already-approved full project
scope.

## Durable Telegram attachment links

Telegram messages store a stable authenticated record URL, not a signed content URL. Two record
kinds are initially supported because they are the records sent by the current Telegram worker:

- `note/:noteId`
- `lead-file/:fileId`

Opening the stable route requires an authenticated session and `lead.view`, resolves the record's
parent lead, applies the existing lead object-scope checker, and only then redirects to a freshly
signed short-lived `/v2/files/content/*` URL. Canonical storage references remain private, the
existing signed-content route remains unchanged, and external legacy URLs keep their existing
Telegram behavior rather than becoming an open redirect.

## File presentation

A shared file presenter determines type from the URL pathname after removing query/hash data and
falls back to the supplied filename. Images render inline. PDFs and other documents render as a
named open/download link; raw signed URLs are not displayed. Lead attachments, contract drawings,
contract PDF links, and PDF utility fields use the same presenter.

## Verification

- utility search scope and validation tests;
- project lead-scope allow/deny tests for primary sales, designers, and super sales;
- durable attachment authorization/redirect and Telegram-message tests;
- shared file-type/presentation helper tests;
- focused server/web tests, production web build, contract audit, and diff checks.
