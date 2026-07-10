"use client";

import React from "react";
import {
  Stack,
  Typography,
  Chip,
  TextField,
  Grid,
  alpha,
  useTheme,
  Box,
} from "@mui/material";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { CONTRACT_LEVELSENUM, contractLevel } from "@/app/helpers/constants";
import { SectionHeader, EmptyState } from "@/features/contracts/shared/formKit.jsx";

export default function StagesSelector({
  selected,
  onChange,
  perStageMeta,
  setPerStageMeta,
}) {
  const theme = useTheme();
  const toggleStage = (stg) => {
    const exists = selected.find((s) => s.enum === stg.enum);
    if (exists) {
      onChange(selected.filter((s) => s.enum !== stg.enum));
      const { [stg.enum]: _, ...rest } = perStageMeta || {};
      setPerStageMeta(rest);
    } else {
      onChange([...selected, stg]);
      setPerStageMeta({
        ...perStageMeta,
        [stg.enum]: {
          deliveryDays: "",
          deptDeliveryDays: "",
        },
      });
    }
  };

  return (
    <Stack spacing={2}>
      <SectionHeader
        icon={<FaClipboardList />}
        title="Select Stages"
        subtitle="Select the stages included in the contract and enter delivery times for each stage"
        count={selected.length}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(CONTRACT_LEVELSENUM || []).map((item) => {
          const active = !!selected.find((s) => s.enum === item.enum);
          return (
            <Chip
              key={item.enum}
              label={`${item.label} (${item.enum})`}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => toggleStage(item)}
              icon={active ? <FaCheckCircle /> : undefined}
              sx={{
                borderRadius: 2,
                fontWeight: active ? 700 : 500,
                py: 0.25,
              }}
            />
          );
        })}
      </Stack>

      {selected.length === 0 ? (
        <EmptyState
          icon={<FaClipboardList />}
          text="No stage selected yet — select at least one stage above."
        />
      ) : (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Stage Details
          </Typography>
          <Grid container spacing={2}>
            {selected.map((s, idx) => (
              <Grid key={s.enum} size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    borderInlineStart: `3px solid ${theme.palette.primary.main}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    p: 2,
                    height: "100%",
                    transition: "box-shadow .2s ease",
                    "&:hover": { boxShadow: theme.shadows[2] },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {s.enum}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {contractLevel[s.label]?.name ||
                          contractLevel[s.enum]?.name}
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        type="number"
                        label="Delivery Days *"
                        value={perStageMeta?.[s.enum]?.deliveryDays ?? ""}
                        onChange={(e) =>
                          setPerStageMeta({
                            ...perStageMeta,
                            [s.enum]: {
                              ...perStageMeta?.[s.enum],
                              deliveryDays: e.target.value,
                            },
                          })
                        }
                        fullWidth
                        required
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        type="number"
                        label="Department Days *"
                        value={perStageMeta?.[s.enum]?.deptDeliveryDays ?? ""}
                        onChange={(e) =>
                          setPerStageMeta({
                            ...perStageMeta,
                            [s.enum]: {
                              ...perStageMeta?.[s.enum],
                              deptDeliveryDays: e.target.value,
                            },
                          })
                        }
                        fullWidth
                        required
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
