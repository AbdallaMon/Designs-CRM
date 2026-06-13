"use client";

import React from "react";
import {
  Stack,
  Typography,
  Chip,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  TextField,
  Grid,
  alpha,
  useTheme,
  Box,
  Switch,
  FormControl,
  FormLabel,
} from "@mui/material";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { CONTRACT_LEVELSENUM, contractLevel } from "@/app/helpers/constants";

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
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaClipboardList
          style={{ color: theme.palette.primary.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Select Stages
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
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
              sx={{ mb: 1 }}
            />
          );
        })}
      </Stack>

      {selected.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Stage Details
          </Typography>
          <Grid container spacing={2}>
            {selected.map((s, idx) => (
              <Grid key={s.enum} size={{ xs: 12, md: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                    borderRadius: 2,
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                    transition: "all 0.3s ease",
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          color: theme.palette.primary.contrastText,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </Avatar>
                    }
                    title={s.enum}
                    subheader={
                      contractLevel[s.label]?.name ||
                      contractLevel[s.enum]?.name
                    }
                    // action={
                    //   <Box>
                    //     {s.enum === "LEVEL_1" && (
                    //       <>
                    //         <FormControl>
                    //           <FormLabel
                    //             component="legend"
                    //             sx={{ fontSize: 12 }}
                    //           >
                    //             Active before client sign
                    //           </FormLabel>
                    //           <Switch
                    //             checked={
                    //               perStageMeta?.[s.enum]?.isActive || false
                    //             }
                    //             id="active-status"
                    //             onChange={(e) =>
                    //               setPerStageMeta({
                    //                 ...perStageMeta,
                    //                 [s.enum]: {
                    //                   ...perStageMeta?.[s.enum],
                    //                   isActive: e.target.checked,
                    //                 },
                    //               })
                    //             }
                    //           />
                    //         </FormControl>
                    //       </>
                    //     )}
                    //   </Box>
                    // }
                    titleTypographyProps={{ fontWeight: 600 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
