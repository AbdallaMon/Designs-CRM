"use client";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
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
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function BulkConvertLeadsModal({
  leads,
  open,
  onClose,
  onSuccess,
}) {
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { setLoading: setToastLoading } = useToastContext();

  useEffect(() => {
    async function getUsers() {
      const usersRequest = await getData({
        url: `admin/all-users?role=STAFF&`,
        setLoading: setLoadingUsers,
      });
      if (usersRequest && usersRequest.status === 200) {
        setUsers(usersRequest.data);
      }
    }
    if (open) {
      getUsers();
      setUserId("");
    }
  }, [open]);

  const handleChange = (event) => {
    setUserId(event.target.value);
  };

  const handleSubmit = async () => {
    const requestData = {
      userId,
      ids: leads,
    };
    const bulkConvert = await handleRequestSubmit(
      requestData,
      setToastLoading,
      `shared/client-leads/bulk-convert`,
      false,
      "Converting",
      false,
      "PUT"
    );
    if (bulkConvert.status === 200) {
      setUserId("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: "400px", maxWidth: "100%" } }}
    >
      <DialogTitle>Convert {leads.length} Leads to New Staff</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a staff member to assign these leads to:
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="staff-label">Select Staff</InputLabel>
            <Select
              labelId="staff-label"
              value={userId}
              label="Select Staff"
              onChange={handleChange}
              disabled={loadingUsers}
            >
              {loadingUsers ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading staff...
                </MenuItem>
              ) : (
                users?.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!userId || loadingUsers}
        >
          Convert ({leads.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
