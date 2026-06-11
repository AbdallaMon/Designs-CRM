"use client";

// "اختياراتك حتى الآن" — a live summary of the client's running selections in the public wizard.
// Reads what the session already has (color pattern / materials / style / picked images) and
// shows it compactly so the client always sees where they are. Presentational; data comes from
// the token-resolved `session`. Single-language Arabic / RTL.

import { Box, Chip, Stack, Typography } from "@mui/material";
import { SectionCard } from "@/app/v2/shared/components";
import { readPickListLabel, PICK_LIST_MODELS } from "../../config/imageSessionsConstants.js";

function labelOf(model, row) {
  return readPickListLabel(model, row) || (row?.id != null ? `#${row.id}` : "");
}

export function SelectionSummary({ session }) {
  if (!session) return null;

  const colorLabel = session.colorPattern
    ? labelOf(PICK_LIST_MODELS.COLOR_PATTERN, session.colorPattern)
    : null;
  const styleLabel = session.style ? labelOf(PICK_LIST_MODELS.STYLE, session.style) : null;
  const materials = Array.isArray(session.materials) ? session.materials : [];
  const imagesCount = Array.isArray(session.selectedImages) ? session.selectedImages.length : 0;
  const spaces = Array.isArray(session.selectedSpaces) ? session.selectedSpaces : [];

  const hasAny = colorLabel || styleLabel || materials.length || imagesCount || spaces.length;
  if (!hasAny) return null;

  return (
    <SectionCard title="اختياراتك حتى الآن">
      <Stack spacing={1.5}>
        {spaces.length > 0 && (
          <Row title="المساحات">
            {spaces.map((s, i) => (
              <Chip key={i} size="small" label={labelOf(PICK_LIST_MODELS.SPACE, s.space || s)} />
            ))}
          </Row>
        )}
        {colorLabel && (
          <Row title="الألوان">
            <Chip size="small" color="primary" label={colorLabel} />
          </Row>
        )}
        {materials.length > 0 && (
          <Row title="الخامات">
            {materials.map((m, i) => (
              <Chip key={i} size="small" label={labelOf(PICK_LIST_MODELS.MATERIAL, m.material || m)} />
            ))}
          </Row>
        )}
        {styleLabel && (
          <Row title="الطراز">
            <Chip size="small" color="primary" label={styleLabel} />
          </Row>
        )}
        {imagesCount > 0 && (
          <Row title="الصور">
            <Chip size="small" label={`${imagesCount} صورة مختارة`} />
          </Row>
        )}
      </Stack>
    </SectionCard>
  );
}

function Row({ title, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {children}
      </Stack>
    </Box>
  );
}

export default SelectionSummary;
