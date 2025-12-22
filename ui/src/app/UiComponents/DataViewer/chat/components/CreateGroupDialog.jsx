"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_ROOM_TYPES } from "../utils/chatConstants";

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function CreateGroupDialog({
  open,
  onClose,
  projectId = null,
  clientLeadId = null,
  isAdmin = false,
  createRoom, // from useChatRooms
  fetchRooms, // from useChatRooms
  onCreated, // (room) => void
  title = "Create New Group Chat",
}) {
  const [roomName, setRoomName] = useState("");
  const [search, setSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const selectedUsers = useMemo(() => {
    const map = new Map(availableUsers.map((u) => [u.id, u]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [availableUsers, selectedIds]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableUsers;

    return availableUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [availableUsers, search]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      let url = isAdmin
        ? `admin/all-users?`
        : `shared/chat/all-related-chat-users?`;
      if (projectId) url += `projectId=${projectId}&`;

      const response = await getData({
        url,
        setLoading: () => {},
      });

      if (response?.status === 200) {
        setAvailableUsers(response.data || []);
      } else {
        setAvailableUsers([]);
      }
    } catch (e) {
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadAvailableUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, isAdmin]);

  const resetAndClose = () => {
    setRoomName("");
    setSearch("");
    setSelectedIds([]);
    setAvailableUsers([]);
    onClose?.();
  };

  const toggleUser = (userId) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(userId);
      if (exists) return prev.filter((id) => id !== userId);

      return [...prev, userId];
    });
  };

  const removeSelected = (userId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleCreate = async () => {
    if (!roomName.trim()) return;

    setCreating(true);

    const roomData = {
      name: roomName.trim(),
      type: CHAT_ROOM_TYPES.GROUP,
      projectId,
      clientLeadId,
      userIds: selectedIds,
    };

    try {
      const result = await createRoom(roomData);
      if (result) {
        // refresh rooms
        fetchRooms?.(false);

        // notify parent to select the new room, etc.
        onCreated?.(result);

        resetAndClose();
      }
    } finally {
      setCreating(false);
    }
  };

  const membersHint = `${selectedIds.length} selected`;

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a name, then pick members from the list.
            </Typography>
          </Box>

          <IconButton onClick={resetAndClose} size="small" aria-label="close">
            <FaTimes />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Group Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Design Team"
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <TextField
              fullWidth
              label="Search members"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              disabled={loadingUsers}
            />
            <Box sx={{ minWidth: 140, textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" color="text.secondary">
                {membersHint}
              </Typography>
            </Box>
          </Stack>

          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "grey.50",
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedUsers.map((u) => (
                  <Chip
                    key={u.id}
                    label={u.name || u.email}
                    onDelete={() => removeSelected(u.id)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Members list */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "grey.50",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Members
              </Typography>
              {loadingUsers && <CircularProgress size={18} />}
            </Box>

            <Divider />

            <Box
              sx={{
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {loadingUsers ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading users...
                  </Typography>
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredUsers.map((u) => {
                    const checked = selectedIds.includes(u.id);

                    return (
                      <ListItemButton
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        sx={{
                          py: 1,
                          "&.Mui-disabled": { opacity: 0.6 },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 36, height: 36 }}>
                            {getInitials(u.name || u.email)}
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 800 }} noWrap>
                              {u.name || "No name"}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {u.email}
                            </Typography>
                          }
                        />

                        <Checkbox
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          onChange={() => toggleUser(u.id)}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={resetAndClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!roomName.trim() || creating}
          sx={{
            transition: "all 0.2s ease",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
