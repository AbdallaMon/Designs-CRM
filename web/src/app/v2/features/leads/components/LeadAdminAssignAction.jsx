"use client";

// <LeadAdminAssignAction> — the admin "إسناد لموظف" action on the lead detail header.
// Visible ONLY when lead.capabilities.canAssignToOther (admin-tier; the server independently
// re-enforces ASSIGN_OTHER + scope). Opens a dialog with a STAFF autocomplete sourced from
// the users directory (GET /v2/users/all-users → role-grouped sales/staff pick-list) and
// assigns the lead via the OVERLOADED assign endpoint: PUT /v2/leads { id, userId }. The same
// endpoint claims-to-self when no userId is sent (LeadAssignActions) — here we always send an
// explicit userId, so the server treats it as assign-to-other.
//
// Writes go through leadsService + runLeadMutation (backend CODE → Arabic toast). Reads go
// through usersService (the only place that talks to the users API). Single Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdPersonAddAlt } from "react-icons/md";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";

export function LeadAdminAssignAction({ lead, onChanged, size = "medium" }) {
  const { setLoading } = useToastContext();
  const caps = lead?.capabilities ?? {};

  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  // Load the staff/sales directory once the dialog opens (admin → all sales staff).
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoadingStaff(true);
    (async () => {
      try {
        const res = await usersService.getAllUsers({ role: "STAFF" });
        if (!alive) return;
        const items = Array.isArray(res?.data) ? res.data : res?.data?.items ?? [];
        setStaff(items);
      } catch {
        if (alive) setStaff([]);
      } finally {
        if (alive) setLoadingStaff(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  if (!caps.canAssignToOther) return null;

  function reset() {
    setSelected(null);
  }

  async function handleAssign() {
    if (!selected?.id) return;
    setBusy(true);
    const res = await runLeadMutation(
      () => leadsService.assignLead({ id: lead.id, userId: Number(selected.id) }),
      { setLoading, loading: "جاري الإسناد للموظف..." },
    );
    setBusy(false);
    if (res) {
      reset();
      setOpen(false);
      onChanged?.(res.data);
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size={size}
        startIcon={<MdPersonAddAlt />}
        onClick={() => setOpen(true)}
      >
        إسناد لموظف
      </Button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        maxWidth="xs"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>إسناد العميل لموظف</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              العميل: {lead?.client?.name ?? `#${lead?.id ?? ""}`}
            </Typography>
            <Autocomplete
              options={staff}
              loading={loadingStaff}
              loadingText="جاري التحميل..."
              noOptionsText="لا يوجد موظفون"
              value={selected}
              onChange={(_e, val) => setSelected(val)}
              getOptionLabel={(opt) =>
                opt?.name ? `${opt.name}${opt.email ? ` — ${opt.email}` : ""}` : ""
              }
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="اختر الموظف"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStaff ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setOpen(false)} variant="outlined" disabled={busy}>
            إلغاء
          </Button>
          <Button onClick={handleAssign} variant="contained" disabled={busy || !selected?.id}>
            إسناد
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LeadAdminAssignAction;
