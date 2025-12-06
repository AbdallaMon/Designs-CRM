"use client";

import React from "react";
import {
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/app/helpers/constants";

export default function PaymentsRulesEditor({ payments, rules, setRules }) {
  const theme = useTheme();

  const ensureRow = (idx) => {
    if (!rules[idx]) {
      const copy = rules.slice();
      copy[idx] = { projectName: "", condition: "", activateOnSigning: false };
      setRules(copy);
    }
  };

  const setField = (idx, key, value) => {
    ensureRow(idx);
    const copy = rules.slice();
    copy[idx] = { ...copy[idx], [key]: value };

    if (key === "activateOnSigning" && value) {
      copy[idx].projectName = "";
      copy[idx].condition = "";
    }

    if (key === "projectName") {
      const allowed = PROJECT_STATUSES[value] || [];
      if (!allowed.includes(copy[idx].condition)) copy[idx].condition = "";
    }

    setRules(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaClipboardList
          style={{ color: theme.palette.warning.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Payment Conditions
        </Typography>
      </Stack>

      {payments.length === 0 && (
        <Alert severity="info">
          No payments added. Go back to the previous step to add payments.
        </Alert>
      )}

      <Grid container spacing={2}>
        {payments.map((p, idx) => {
          const row = rules[idx] || {};
          const disabled = idx === 0;
          const conds = PROJECT_STATUSES[row.projectName] || [];

          return (
            <Grid size={12} key={idx}>
              <Card
                variant="outlined"
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  borderRadius: 2,
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                  transition: "all 0.3s ease",
                }}
              >
                <CardHeader
                  title={`Payment #${idx + 1}`}
                  subheader={`Amount: ${Number(p.amount || 0).toFixed(2)}`}
                  avatar={
                    <Avatar sx={{ bgcolor: "warning.main" }}>{idx + 1}</Avatar>
                  }
                  titleTypographyProps={{ fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {disabled && (
                      <Alert severity="error" icon={<FaCheckCircle />}>
                        This payment will be due after the client signs the
                        contract
                      </Alert>
                    )}

                    <Grid container spacing={2}>
                      <Grid size={{ sm: 6 }}>
                        <FormControl fullWidth disabled={disabled} size="small">
                          <InputLabel id={`proj-${idx}`}>Project</InputLabel>
                          <Select
                            labelId={`proj-${idx}`}
                            label="Project"
                            value={row.projectName || ""}
                            onChange={(e) =>
                              setField(idx, "projectName", e.target.value)
                            }
                          >
                            {(PROJECT_TYPES || []).map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ sm: 6 }}>
                        <FormControl
                          fullWidth
                          disabled={
                            disabled || !row.projectName || conds.length === 0
                          }
                          size="small"
                        >
                          <InputLabel id={`cond-${idx}`}>
                            Payment Condition
                          </InputLabel>
                          <Select
                            labelId={`cond-${idx}`}
                            label="Payment Condition"
                            value={row.condition || ""}
                            onChange={(e) =>
                              setField(idx, "condition", e.target.value)
                            }
                          >
                            {conds.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
