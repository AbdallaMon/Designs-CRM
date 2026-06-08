"use client";

// Generic selectable reference grid for the public wizard (colors / materials / styles). Renders
// a responsive card grid of reference rows; cards are single- or multi-select. A color row carries
// a `background` + a swatch list (`colors`); material/style rows show their Arabic title (and a
// preview image when present). Pure presentational — the parent owns the fetch + the save. RTL.
//
// Props:
//   items     reference rows ({ id, title:[{text}], background?, colors?, imageUrl? }).
//   model     the pick-list model (for readPickListLabel).
//   multi     bool — allow multiple selection (materials) vs single (color/style).
//   selected  selected row(s): an array (multi) or a single row/id.
//   onToggle  (row) => void.

import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography } from "@mui/material";
import { MdCheckCircle } from "react-icons/md";
import { readPickListLabel } from "../../config/imageSessionsConstants.js";

function isSelected(selected, row, multi) {
  if (multi) return Array.isArray(selected) && selected.some((s) => (s.id ?? s) === row.id);
  if (Array.isArray(selected)) return selected.some((s) => (s.id ?? s) === row.id);
  return (selected?.id ?? selected) === row.id;
}

export function SelectionGrid({ items = [], model, multi = false, selected, onToggle }) {
  return (
    <Grid container spacing={2}>
      {items.map((row) => {
        const sel = isSelected(selected, row, multi);
        const label = readPickListLabel(model, row) || `#${row.id}`;
        const swatches = Array.isArray(row.colors) ? row.colors : [];
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={row.id}>
            <Card
              variant="outlined"
              sx={{
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? "primary.main" : "divider",
                position: "relative",
                height: "100%",
              }}
            >
              {sel && (
                <Box sx={{ position: "absolute", top: 8, insetInlineStart: 8, color: "primary.main", zIndex: 1 }}>
                  <MdCheckCircle size={22} />
                </Box>
              )}
              <CardActionArea onClick={() => onToggle?.(row)} sx={{ height: "100%" }}>
                {row.background && (
                  <Box sx={{ height: 80, backgroundColor: row.background }} />
                )}
                {row.imageUrl && !row.background && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.imageUrl} alt={label} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                )}
                <CardContent>
                  <Typography variant="subtitle1">{label}</Typography>
                  {swatches.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      {swatches.map((c, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 22, height: 22, borderRadius: "50%",
                            backgroundColor: c.hex || c.color || c.background || c,
                            border: "1px solid", borderColor: "divider",
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default SelectionGrid;
