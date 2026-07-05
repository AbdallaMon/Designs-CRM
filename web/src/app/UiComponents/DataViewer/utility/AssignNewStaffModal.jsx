"use client";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useLeadDetails } from "../leads/context/LeadDetailsContext";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useEffect, useState } from "react";

export function AssignNewStaffModal({ lead, onUpdate }) {
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const details = useLeadDetails();
  const { setLoading: setToastLoading } = useToastContext();
  const [, setLoading] = useState(true);
  const { hasPermission } = usePermission();
  // admin-tier lead operator = holds lead.assign.other (== checkIfAdminOrSuperSales); honors subRoles per the profiles model
  const isAdmin = hasPermission(LEAD_CODES.ASSIGN_OTHER);
  useEffect(() => {
    async function getUsers() {
      const usersRequest = await getData({
        url: `admin/all-users?role=STAFF&`,
        setLoading,
      });
      if (usersRequest && usersRequest.status === 200) {
        setUsers(usersRequest.data);
      }
    }
    if (open && isAdmin) {
      getUsers();
    }
  }, [open, lead]);

  const handleChange = (event) => {
    setUserId(event.target.value);
  };

  const handleSubmit = async () => {
    const requestData = {
      userId,
      id: lead.id,
    };
    const newAssign = await handleRequestSubmit(
      requestData,
      setToastLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (newAssign.status === 200) {
      if (onUpdate) {
        onUpdate(newAssign.data);
      } else if (details?.refetchCore) {
        // No local setter wired in — reconcile the lead in place instead of a hard reload.
        details.refetchCore();
        details.refreshKanban?.();
      }
      setUserId(false);
      setOpen(false);
    }
  };
  if (!isAdmin || !lead.userId) return <Box></Box>;

  return (
    <Box>
      <Button variant="contained" fullWidth onClick={() => setOpen(true)}>
        Convert lead
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: "400px", maxWidth: "100%" } }}
      >
        <DialogTitle>Convert lead to new staff</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="designer-label">Select Staff</InputLabel>
            <Select
              labelId="designer-label"
              value={userId}
              label="Select Designer"
              onChange={handleChange}
            >
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color={"primary"}>
            Convert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
