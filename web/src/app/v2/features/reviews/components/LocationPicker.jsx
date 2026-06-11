"use client";

// <LocationPicker /> — read-only Google Business location selector. The locations come from
// reviewsService.getLocations (review.view); selecting one drives the reviews list. No mutation,
// no create — this is a presentational picker over a fixed, BE-owned account. Single-language
// Arabic / RTL; all prose from reviewsUi.
//
// A Google location resource is keyed by `name` (e.g. "accounts/1/locations/2") and titled by
// `title` (falling back to `locationName` / `name`). We expose the bare locationId segment as
// the value the reviews read needs (`?locationId=`), but pass the picker the whole list.
//
// Props:
//   locations  array            — Google location resources.
//   value      string?          — selected location `name` (full resource name).
//   onChange   (name) => void   — selection handler (receives the full resource name).

import { TextField, MenuItem } from "@mui/material";
import { reviewsUi } from "../config/reviewsMessages.js";

function locationLabel(loc, i) {
  return loc?.title ?? loc?.locationName ?? loc?.name ?? `#${i + 1}`;
}

export function LocationPicker({ locations = [], value = "", onChange }) {
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={reviewsUi.locationPickerLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      sx={{ maxWidth: 420 }}
    >
      {locations.map((loc, i) => (
        <MenuItem key={loc?.name ?? i} value={loc?.name ?? ""}>
          {locationLabel(loc, i)}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default LocationPicker;
