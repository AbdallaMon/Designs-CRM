"use client";

// Public-wizard SELECTION steps (SURFACE 3). Each step: fetch its reference grid (getColors /
// getMaterials / getStyles / getImages), let the client choose, then save token-authoritatively
// (saveColor / saveMaterials / saveStyle / saveImages) with `status: nextStatus` — the BE
// OVERRIDES session id/clientLeadId from the token. After a save the parent refetches the session
// (which advances sessionStatus). Single-language Arabic / RTL.
//
// Body shapes (mirror the legacy client-session + the v2 service):
//   saveColor    { session, selectedColor, customColors, status }
//   saveMaterials{ session, selectedMaterials, status }
//   saveStyle    { session, selectedStyle, status }
//   saveImages   { session, selectedImages, status }
// Images read needs styleId + spaceIds (from session.selectedSpaces[].space.id) — §5c #1 list
// is nested under res.data.

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import { MdArrowForward, MdArrowBack } from "react-icons/md";
import { LoadingState, EmptyState, ErrorState } from "@/app/v2/shared/components";
import imageSessionsService from "../../imageSessions.service.js";
import { runImageSessionMutation } from "../../imageSessions.mutations.js";
import { PICK_LIST_MODELS } from "../../config/imageSessionsConstants.js";
import { SelectionGrid } from "./SelectionGrid.jsx";

// Shared wizard footer: back (secondary) + next/save (primary). RTL: primary sits inline-end.
function WizardNav({ onBack, onNext, nextLabel = "التالي", nextDisabled, busy, backDisabled }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
      {onBack && (
        <Button variant="outlined" startIcon={<MdArrowForward />} onClick={onBack} disabled={busy || backDisabled}>
          السابق
        </Button>
      )}
      <Box sx={{ flexGrow: 1 }} />
      {onNext && (
        <Button variant="contained" endIcon={<MdArrowBack />} onClick={onNext} disabled={busy || nextDisabled}>
          {nextLabel}
        </Button>
      )}
    </Stack>
  );
}

// Generic single-/multi-select selection step (colors / materials / styles).
function useReferenceList(fetcher) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      // §5c #1: images list is nested under res.data; scalar lists are the array at res.data.
      const payload = res?.data;
      setItems(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

export function ColorsStep({ session, nextStatus, onBack, onUpdate, busy }) {
  const { items, loading, error, reload } = useReferenceList(
    useCallback(() => imageSessionsService.getColors({ lng: "ar" }), []),
  );
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selected) return;
    const res = await runImageSessionMutation(
      () =>
        imageSessionsService.saveColor({
          session,
          selectedColor: selected,
          customColors: selected.colors,
          status: nextStatus,
        }),
      { loading: "جاري حفظ اختيارك...", setLoading: setSaving },
    );
    if (res) await onUpdate?.();
  }

  if (loading) return <LoadingState variant="cards" count={6} columns={3} height={180} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!items.length) return <EmptyState title="لا توجد ألوان متاحة" />;

  return (
    <Box>
      <SelectionGrid items={items} model={PICK_LIST_MODELS.COLOR_PATTERN} selected={selected} onToggle={setSelected} />
      <WizardNav onBack={onBack} onNext={save} nextDisabled={!selected} busy={busy || saving} />
    </Box>
  );
}

export function MaterialsStep({ session, nextStatus, onBack, onUpdate, busy }) {
  const { items, loading, error, reload } = useReferenceList(
    useCallback(() => imageSessionsService.getMaterials({ lng: "ar" }), []),
  );
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (row) =>
    setSelected((prev) => (prev.some((s) => s.id === row.id) ? prev.filter((s) => s.id !== row.id) : [...prev, row]));

  async function save() {
    if (!selected.length) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.saveMaterials({ session, selectedMaterials: selected, status: nextStatus }),
      { loading: "جاري حفظ اختيارك...", setLoading: setSaving },
    );
    if (res) await onUpdate?.();
  }

  if (loading) return <LoadingState variant="cards" count={6} columns={3} height={180} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!items.length) return <EmptyState title="لا توجد خامات متاحة" />;

  return (
    <Box>
      <SelectionGrid items={items} model={PICK_LIST_MODELS.MATERIAL} multi selected={selected} onToggle={toggle} />
      <WizardNav onBack={onBack} onNext={save} nextDisabled={!selected.length} busy={busy || saving} />
    </Box>
  );
}

export function StylesStep({ session, nextStatus, onBack, onUpdate, busy }) {
  const { items, loading, error, reload } = useReferenceList(
    useCallback(() => imageSessionsService.getStyles({ lng: "ar" }), []),
  );
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selected) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.saveStyle({ session, selectedStyle: selected, status: nextStatus }),
      { loading: "جاري حفظ اختيارك...", setLoading: setSaving },
    );
    if (res) await onUpdate?.();
  }

  if (loading) return <LoadingState variant="cards" count={6} columns={3} height={180} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!items.length) return <EmptyState title="لا توجد طرز متاحة" />;

  return (
    <Box>
      <SelectionGrid items={items} model={PICK_LIST_MODELS.STYLE} selected={selected} onToggle={setSelected} />
      <WizardNav onBack={onBack} onNext={save} nextDisabled={!selected} busy={busy || saving} />
    </Box>
  );
}

// Images step — reference grid scoped to the session's selected spaces + chosen style.
function spaceIdsOf(session) {
  const spaces = Array.isArray(session?.selectedSpaces) ? session.selectedSpaces : [];
  return spaces.map((s) => s?.space?.id ?? s?.id).filter(Boolean);
}

export function ImagesStep({ session, nextStatus, onBack, onUpdate, busy }) {
  const spaceIds = spaceIdsOf(session);
  const styleId = session?.styleId;
  const { items, loading, error, reload } = useReferenceList(
    useCallback(
      () => imageSessionsService.getImages({ spaceIds: spaceIds.join(","), styleId }),
      [spaceIds.join(","), styleId],
    ),
  );
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (row) =>
    setSelected((prev) => (prev.some((s) => s.id === row.id) ? prev.filter((s) => s.id !== row.id) : [...prev, row]));

  async function save() {
    if (!selected.length) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.saveImages({ session, selectedImages: selected, status: nextStatus }),
      { loading: "جاري حفظ اختيارك...", setLoading: setSaving },
    );
    if (res) await onUpdate?.();
  }

  if (loading) return <LoadingState variant="cards" count={6} columns={3} height={180} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!items.length) return <EmptyState title="لا توجد صور متاحة" description="لم نعثر على صور للمساحات والطراز المختار." />;

  return (
    <Box>
      <SelectionGrid items={items} model={PICK_LIST_MODELS.DESIGN_IMAGE} multi selected={selected} onToggle={toggle} />
      <WizardNav onBack={onBack} onNext={save} nextLabel="حفظ والمتابعة" nextDisabled={!selected.length} busy={busy || saving} />
    </Box>
  );
}

export { WizardNav };
