"use client";

import React from "react";
import {
  Stack,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
} from "@mui/material";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/app/helpers/constants";
import { SectionHeader, EditorCard, EmptyState } from "./formKit";

export default function PaymentsRulesEditor({ payments, rules, setRules }) {
  const theme = useTheme();
  const warning = theme.palette.warning.main;

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
      <SectionHeader
        icon={<FaClipboardList />}
        title="Payment Conditions"
        subtitle="Link each payment to a project and its due condition"
        count={payments.length}
        color={warning}
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={<FaClipboardList />}
          color={warning}
          text="No payments added. Go back to the previous step to add payments."
        />
      ) : (
        <Stack spacing={1.5}>
          {payments.map((p, idx) => {
            const row = rules[idx] || {};
            const disabled = idx === 0;
            const conds = PROJECT_STATUSES[row.projectName] || [];

            return (
              <EditorCard
                key={idx}
                accent={warning}
                index={idx + 1}
                label={`Payment #${idx + 1} — Amount: ${Number(
                  p.amount || 0
                ).toFixed(2)}`}
              >
                <Stack spacing={1.5}>
                  {disabled && (
                    <Alert severity="error" icon={<FaCheckCircle />}>
                      This payment will be due after the client signs the
                      contract
                    </Alert>
                  )}

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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

                    <Grid size={{ xs: 12, sm: 6 }}>
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
              </EditorCard>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
