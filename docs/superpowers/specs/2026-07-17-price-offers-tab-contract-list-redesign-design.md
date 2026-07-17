# Price-offers tab layout + contract-list UI/UX redesign

**Date:** 2026-07-17
**Branch:** `feat/workstage-flow-redesign`
**Status:** Design approved — implementing
**Scope:** Frontend only. No backend change, no API-contract change.

---

## 1. Problem

The lead-detail **Price offers** tab (`?tab=priceOffers`) renders two things stacked, in two
different design vocabularies:

1. A **hand-rolled bordered box** headed "Contracts" (34px icon tile, `subtitle1`) wrapping
   `LeadContractList` inside a `maxHeight: 320, overflowY: auto` scroller.
2. The **price offers** list, using the shared `TabSection` frame (42px icon tile, `h6`, count
   badge, action slot).

Concrete defects:

- **The contracts frame is an imitation of `TabSection`** with different dimensions, no count
  badge and no action slot → one tab, two visual systems.
- **The nested 320px scroller holds the *tall variable* content.** `ContractAccordion` sets
  `defaultExpanded={index === 0}`, so the first contract auto-expands a stages grid inside a
  320px window. This is also the only nested scroller in the whole lead detail, and it
  contradicts `LeadWorkspace.jsx:280-281`, which documents that the content pane "flows
  naturally; scrolling is owned by the dialog/page container so content can never be clipped
  out of reach."
- **Double padding.** `LeadContractList` applies its own `px:{xs:2,sm:3}` / `pb:3` /
  `minHeight:"100%"` inside a box that already has `p:2`. `minHeight:"100%"` inside a 320px
  scroller is meaningless.
- **The create button scrolls away** — it lives inside the scroller, whereas the price-offers
  Add button is pinned in the `TabSection` action slot.
- **Stage cards are large and nearly empty.** `ContractStage` renders an `lg:3` grid card
  (4 per row) carrying only three facts: the Arabic level name, the raw `LEVEL_3` string, and a
  status chip. `deliveryDays` / `startDate` / `endDate` are in the payload and never rendered.
  The stages are a linear `order`ed pipeline being drawn as a grid, which hides the sequence.
- **Raw enum leaks to the UI.** `ContractStage.jsx:102` prints `{stage.title}` — literally
  `LEVEL_3` — directly under the level's display name.
- **`ChipWithIcon` crashes on an unknown key.** `theme.palette[conf.pallete][conf.shade]` is
  unguarded; `ContractStage.title` is a free-text `String` column, so any off-convention title
  is a TypeError that takes down the whole accordion.
- **Dead code.** `ContractsList` threads `openEdit` / `handleEditOpen` through `ContractAccordion`
  into `ContractMenu`, which never destructures it — `openEdit` is permanently `false`. Plus a
  leftover `console.log(req, "data")`.

---

## 2. Decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Contracts stay inside the Price offers tab.** No dedicated tab. | User decision. The backend cockpit emits a `contracts` tabKey that the frontend aliases to `priceOffers`; that alias stays. |
| 2 | **Price offers on top, capped height, scrolls internally.** | Offer cards are small and uniform, so a `maxHeight` scroller suits them. |
| 3 | **Contracts below, bare — no container, no "Contracts" heading, no height cap.** | User decision ("لا شيء ابسط"). Contracts are the tab's main content and take the rest of the lead. |
| 4 | **Contract level names stay Arabic.** | User decision. These are master's own retained Arabic strings. `nameEn` stays unused; do **not** switch to English. See §5. |
| 5 | **Contract row = `RecordCard` + horizontal stage stepper.** Accordion retired. | The stages are an `order`ed pipeline; a stepper is the honest shape and is compact. |
| 6 | **No backend change.** `ViewContract` and `FinalizeModal` untouched. | Scope decision. |

### Why the scroller moved from contracts → price offers

This inverts the original design. The rule in `LeadWorkspace.jsx:280-281` exists so that *tall,
variable* content can never be clipped out of reach. Contract accordions are exactly that, which
is why the 320px box was hostile to them. Small uniform offer cards in a `maxHeight` box stay
fully reachable via their own scrollbar.

**Known, accepted tension:** this knowingly adds an inner scroller where the workspace comment
argues against them. Accepted because the constrained content is small, uniform, and fully
reachable.

---

## 3. Target design

```jsx
// PriceOffers.jsx
<Stack spacing={4}>
  {/* Price offers — labeled, capped, scrolls inside itself */}
  <TabSection icon={<FaMoneyBillWave/>} title="Price Offers" count={offers?.length || 0}
              action={canCreate ? <AddPriceOffers .../> : null}>
    <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
      <Stack spacing={1.5}>{/* RecordCards — unchanged */}</Stack>
    </Box>
  </TabSection>

  {/* Contracts — bare. No frame, no heading, no cap. */}
  <LeadContractList leadId={lead.id} lead={lead} />
</Stack>
```

`maxHeight` (not fixed `height`) so a single offer does not reserve 300px of emptiness; ~300px
leaves a third card peeking as the affordance that there is more.

`LeadContractList` renders **`[+ Create contract]` then the cards** — nothing else. That is where
the create button lives, since there is no header to hold it.

### Component changes

| File | Change |
|---|---|
| `web/src/features/leads/tabs/PriceOffers.jsx` | Offers first in a `TabSection` + `maxHeight:300` scroller. Delete the hand-rolled contracts box. Render `<LeadContractList/>` bare below. |
| `web/src/features/contracts/ContractsList.jsx` | Drop `px`/`pb`/`minHeight:"100%"` (keep `100vh` for `finalModal`). Delete dead `openEdit`/`handleEditOpen` and the `console.log`. Swap the bespoke dashed-Paper empty state for the shared `EmptyState`. Render `ContractCard`. |
| `ContractAccordion.jsx` → **`ContractCard.jsx`** | `RecordCard`: accent + `StatusPill` from `contractStatus[status]`, body = stepper, meta = level chip · amount · stage count, actions = `ContractMenu` (already carries View). |
| `ContractStage.jsx` → **`ContractStageStepper.jsx`** | Takes the whole `stages[]` instead of one stage. Icon-per-node using each level's own icon from the constants map, coloured by `stageStatus`, Arabic name in a tooltip. Unknown title → neutral node, no crash. Raw `LEVEL_3` never renders. |
| `web/src/shared/components/common/ChipWithIcon.jsx` | Null-guard `conf` and the palette lookup (defensive — it has other consumers). |

### Stepper node semantics

| `stageStatus` | Node |
|---|---|
| `COMPLETED` | filled, `success.main`, check icon |
| `IN_PROGRESS` | ring, `primary.main`, the level's own icon, emphasised |
| `NOT_STARTED` | hollow, `text.disabled`, the level's own icon, muted |

Deliberately **not** reusing `contractLevelStatus`, which maps `NOT_STARTED → error` (red). A
not-yet-started stage is not an error. The active-stage *name* is carried by the card's meta chip
(`contractLevel[contract.level]`, which handles the `null` → "لا يوجد مرحلة حاليا" case), so the
stepper stays a pure icon row and no per-node labels can misalign the connectors.

---

## 4. Bug found while designing: `Decimal` amounts arrive as strings

`Contract.amount` / `Contract.totalAmount` (and `PriceOffers.minPrice` / `maxPrice`) are Prisma
`Decimal?`, which serialise to **strings** over JSON. The existing
`offer.minPrice.toLocaleString()` pattern in `PriceOffers.jsx:147` therefore resolves to
`String.prototype.toLocaleString`, which is a **no-op** — it returns the string unchanged, with no
thousands separators.

`ContractCard` will `Number()` before formatting and guard `NaN`/null.

---

## 5. Field-naming trap (do not "fix" this)

`contract.level` and `contract.contractLevel` are **two different things**:

- **`contractLevel`** — a real `ContractLevel` enum **column** (`LEVEL_1`..`LEVEL_7`). Shown on the
  Kanban card and the lead header via the Arabic-only `CONTRACT_LEVELS` map.
- **`level`** — a **computed** field the service attaches: the `title` of the currently
  `IN_PROGRESS` stage, or `null` (`contract-services.js:44-48`). This is what the contract list
  shows.

`ContractStage.title` is a free-text `String` column that holds `LEVEL_N` keys **by convention
only** — which is why the crash guard matters.

There are **three** duplicate representations of the level list: `CONTRACT_LEVELS` (Arabic-only),
`contractLevel` (`{name(ar), nameAr, nameEn, icon, pallete, shade}`), and `CONTRACT_LEVELSENUM`
(`[{enum, label(ar), labelAr, labelEn}]`). Consolidating them is **out of scope** here and would
also touch the Kanban and lead header. Noted for later.

---

## 6. Out of scope

- `ViewContract.jsx` (the editor dialog) — its own pass.
- `FinalizeModal.jsx` — untouched. `LeadContractList` is shared with it as a *contract picker*
  (rendered only when no in-progress contract exists); the `finalModal` flag keeps its `100vh`
  behaviour intact.
- Backend / `getLeadContractList` payload — no payments in the list response, so no payment
  progress on the row.
- Consolidating the three level maps; switching level names to English.
- The dead `minPrice`/`maxPrice` write path (no repo writer exists) — a separate product question.

---

## 7. Verification

`web/` eslint config is broken; verify with `cd web && npx next build`.
