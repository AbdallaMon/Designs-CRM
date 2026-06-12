"use client";

// ★ Pros-&-cons reorderable list (SURFACE 1, admin). A reference item (a material/style/page
// type) owns an ordered list of PRO and CON bullet points. This panel lists them and lets the
// admin reorder each list with up/down buttons (a lightweight, dependency-free reorder — the
// repo carries NO dnd library, so we don't add one), then persists the new order via
// reorderProsCons (POST /pros-and-cons/order, body { itemType, data }) with an OPTIMISTIC
// reorder that REVERTS on error. Add/edit/delete round out the CRUD; delete carries { itemType }
// in the body (§5c — routed through the service's body-capable DELETE).
//
// Data contract (mirrors the legacy admin ProsAndCons + the v2 service):
//   getProsAndCons({ type, id, isClient:false }) → res.data === { pros:[{id,item,order}], cons:[...] }
//   createProCon({ type, id, item, itemType })
//   updateProCon(id, { id, item, itemType })
//   deleteProCon(id, { itemType })          // token-less; body carries itemType
//   reorderProsCons({ itemType, data })     // data = the reordered list (PRO or CON)
//
// Props:
//   type   string  — the owning reference type the pros/cons belong to (e.g. "MATERIAL").
//   id     number  — the owning record id.

import { useCallback, useEffect, useState } from "react";
import {
  Box, Stack, Typography, IconButton, TextField, Button, Divider, Tooltip,
} from "@mui/material";
import { MdArrowUpward, MdArrowDownward, MdDelete, MdAdd, MdSave } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard } from "@/app/v2/shared/components";
import { LoadingState, EmptyState, ErrorState } from "@/app/v2/shared/components";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";

// `title` is the Arabic fallback; `titleKey` resolves the localized section title via t().
const KINDS = [
  { itemType: "PRO", title: "المزايا", titleKey: "imageSessions.prosCons.pros" },
  { itemType: "CON", title: "العيوب", titleKey: "imageSessions.prosCons.cons" },
];

export function ProsConsReorder({ type, id }) {
  const { t } = useT();
  const [pros, setPros] = useState([]);
  const [cons, setCons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id || !type) return;
    setLoading(true);
    setError(null);
    try {
      const res = await imageSessionsService.getProsAndCons({ type, id, isClient: false });
      setPros(Array.isArray(res?.data?.pros) ? res.data.pros : []);
      setCons(Array.isArray(res?.data?.cons) ? res.data.cons : []);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setPros([]);
      setCons([]);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    load();
  }, [load]);

  const listFor = (itemType) => (itemType === "PRO" ? pros : cons);
  const setListFor = (itemType, next) => (itemType === "PRO" ? setPros(next) : setCons(next));

  // Optimistic reorder + revert-on-error. `dir` = -1 (up) | +1 (down).
  async function move(itemType, index, dir) {
    const list = listFor(itemType);
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const prev = list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    setListFor(itemType, next); // optimistic
    const res = await runImageSessionMutation(
      () => imageSessionsService.reorderProsCons({ itemType, data: next }),
      { loading: t("imageSessions.prosCons.reorderLoading", "جاري حفظ الترتيب...") },
    );
    if (!res) setListFor(itemType, prev); // revert on error
  }

  async function add(itemType, text) {
    if (!text?.trim()) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.createProCon({ type, id, item: text.trim(), itemType }),
      { loading: t("imageSessions.form.addingLoading", "جاري الإضافة...") },
    );
    if (res) await load();
  }

  async function save(itemType, rowId, text) {
    const res = await runImageSessionMutation(
      () => imageSessionsService.updateProCon(rowId, { id: rowId, item: text, itemType }),
      { loading: t("imageSessions.lead.savingLoading", "جاري الحفظ...") },
    );
    if (res) await load();
  }

  async function remove(itemType, rowId) {
    const res = await runImageSessionMutation(
      () => imageSessionsService.deleteProCon(rowId, { itemType }),
      { loading: t("imageSessions.prosCons.deleteLoading", "جاري الحذف...") },
    );
    if (res) await load();
  }

  if (loading) return <LoadingState variant="form" fields={4} />;
  if (error) return <ErrorState error={error} onRetry={load} resolver={undefined} />;

  return (
    <Stack spacing={2}>
      {KINDS.map(({ itemType, title, titleKey }) => (
        <SectionCard key={itemType} title={t(titleKey, title)}>
          <ProsConsColumn
            itemType={itemType}
            items={listFor(itemType)}
            onMove={(i, dir) => move(itemType, i, dir)}
            onAdd={(text) => add(itemType, text)}
            onSave={(rowId, text) => save(itemType, rowId, text)}
            onDelete={(rowId) => remove(itemType, rowId)}
          />
        </SectionCard>
      ))}
    </Stack>
  );
}

function ProsConsColumn({ itemType, items, onMove, onAdd, onSave, onDelete }) {
  const { t } = useT();
  const [draft, setDraft] = useState("");
  return (
    <Box>
      {items.length === 0 ? (
        <EmptyState title={t("imageSessions.prosCons.empty", "لا توجد عناصر")} description={t("imageSessions.prosCons.emptyDescription", "أضف أول عنصر من الحقل بالأسفل.")} />
      ) : (
        <Stack divider={<Divider flexItem />} spacing={1}>
          {items.map((row, i) => (
            <ProsConsRow
              key={row.id}
              row={row}
              isFirst={i === 0}
              isLast={i === items.length - 1}
              onUp={() => onMove(i, -1)}
              onDown={() => onMove(i, +1)}
              onSave={(text) => onSave(row.id, text)}
              onDelete={() => onDelete(row.id)}
            />
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t("imageSessions.prosCons.newItemPlaceholder", "عنصر جديد")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<MdAdd />}
          disabled={!draft.trim()}
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          {t("imageSessions.prosCons.add", "إضافة")}
        </Button>
      </Stack>
    </Box>
  );
}

function ProsConsRow({ row, isFirst, isLast, onUp, onDown, onSave, onDelete }) {
  const { t } = useT();
  const [text, setText] = useState(row.item ?? "");
  const dirty = text !== (row.item ?? "");
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Stack>
        <Tooltip title={t("imageSessions.prosCons.moveUp", "تحريك لأعلى")}>
          <span>
            <IconButton size="small" onClick={onUp} disabled={isFirst} aria-label={t("imageSessions.prosCons.moveUp", "تحريك لأعلى")}>
              <MdArrowUpward />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("imageSessions.prosCons.moveDown", "تحريك لأسفل")}>
          <span>
            <IconButton size="small" onClick={onDown} disabled={isLast} aria-label={t("imageSessions.prosCons.moveDown", "تحريك لأسفل")}>
              <MdArrowDownward />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <TextField size="small" fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Tooltip title={t("imageSessions.prosCons.saveEdit", "حفظ التعديل")}>
        <span>
          <IconButton size="small" color="primary" onClick={() => onSave(text)} disabled={!dirty} aria-label={t("imageSessions.prosCons.save", "حفظ")}>
            <MdSave />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t("imageSessions.prosCons.delete", "حذف")}>
        <IconButton size="small" color="error" onClick={onDelete} aria-label={t("imageSessions.prosCons.delete", "حذف")}>
          <MdDelete />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default ProsConsReorder;
