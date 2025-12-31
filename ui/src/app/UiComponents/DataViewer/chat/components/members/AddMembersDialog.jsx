"use client";

import React, { useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Paper,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import { LastSeenAt, OnlineStatus } from "./LastSeenAt";
import { AddOrRemoveClient } from "../chat/utility/AddOrRemoveClient";
import ChatAccessLinkBox from "../chat/utility/ChatAccessLinkBox";
const getAvatarSrc = (entity) => {
  return (
    entity?.profilePicture ||
    entity?.avatar ||
    entity?.user?.profilePicture ||
    entity?.user?.avatar ||
    null
  );
};

export function AddMembersDialog({
  open,
  onClose,
  members,
  availableUsers,
  selectedUsers,
  loadingUsers,
  canManageMembers,
  onToggleSelectUser,
  onAddMembers,
  onRemoveMember,
  reFetchMembers,
  roomId,
  clientLeadId,
  reFetchRoom,
  accessToken,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        zIndex: 1302,
      }}
    >
      <DialogTitle>Add Members to Chat</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <AddOrRemoveClient
            clientLeadId={clientLeadId}
            roomId={roomId}
            reFetchMembers={reFetchMembers}
            handleClose={onClose}
            isAdded={members?.some((m) => m.client)}
            reFetchRoom={reFetchRoom}
          />
          <ChatAccessLinkBox
            roomId={roomId}
            accessToken={accessToken}
            reFetchRoom={reFetchRoom}
            disabled={!canManageMembers}
            clientLeadId={clientLeadId}
          />
        </Box>
        <Stack spacing={2}>
          {/* Current Members Section */}
          {members.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Current Members ({members.length})
              </Typography>
              <Stack spacing={1.5}>
                {members.map((m) => (
                  <Stack
                    key={m.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      position: "relative",
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                    }}
                  >
                    {/* Avatar with online status */}
                    <Box
                      sx={{
                        position: "relative",
                      }}
                    >
                      <OnlineStatus
                        lastSeenAt={m.user?.lastSeenAt || m.client?.lastSeenAt}
                      />
                      <Avatar
                        src={getAvatarSrc(m.user || m.client)}
                        sx={{
                          position: "relative",
                        }}
                      >
                        {(m.user?.name || m.client?.name || "?").charAt(0)}
                      </Avatar>
                    </Box>

                    {/* User info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600} noWrap>
                        {m.user?.name || m.client?.name || "Unknown"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {m.user?.email || m.client?.email || ""}
                      </Typography>
                      <LastSeenAt
                        lastSeenAt={m.user?.lastSeenAt || m.client?.lastSeenAt}
                      />
                    </Box>

                    {/* Role badge */}
                    <Box>
                      <Chip
                        label={
                          m.role === "ADMIN"
                            ? "Admin"
                            : m.role === "MODERATOR"
                            ? "Moderator"
                            : m.client
                            ? "Client"
                            : "Member"
                        }
                        color={
                          m.role === "ADMIN"
                            ? "primary"
                            : m.role === "MODERATOR"
                            ? "secondary"
                            : m.client
                            ? "info"
                            : "default"
                        }
                        size="small"
                      />
                    </Box>

                    {/* Remove button */}
                    {m.role !== "ADMIN" && canManageMembers && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => onRemoveMember(m)}
                          color="error"
                        >
                          <MdDelete />
                        </IconButton>
                      </Box>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* Add New Members Section */}
          {canManageMembers && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                Add New Members
              </Typography>

              {loadingUsers ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : availableUsers.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="textSecondary">
                    No new members available
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                  <Stack spacing={1}>
                    {availableUsers.map((u) => {
                      const isSelected = selectedUsers.some(
                        (s) => s.id === u.id
                      );
                      return (
                        <Paper
                          key={u.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            cursor: "pointer",
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            bgcolor: isSelected
                              ? "primary.lighter"
                              : "background.paper",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              boxShadow: 1,
                            },
                          }}
                          onClick={() => onToggleSelectUser(u)}
                        >
                          <Avatar src={getAvatarSrc(u)}>
                            {(u.name || "?").charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={600} noWrap>
                              {u.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {u.email || ""}
                            </Typography>
                          </Box>
                          <Chip
                            label={isSelected ? "Selected" : "Select"}
                            color={isSelected ? "primary" : "default"}
                            size="small"
                            variant={isSelected ? "filled" : "outlined"}
                          />
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Selected users chips */}
              {selectedUsers.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Selected to add ({selectedUsers.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {selectedUsers.map((u) => (
                      <Chip
                        key={u.id}
                        avatar={
                          <Avatar src={getAvatarSrc(u)}>
                            {(u.name || "?").charAt(0)}
                          </Avatar>
                        }
                        label={u.name}
                        onDelete={() => onToggleSelectUser(u)}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {canManageMembers && (
          <Button
            onClick={onAddMembers}
            variant="contained"
            disabled={selectedUsers.length === 0 || loadingUsers}
          >
            Add Members ({selectedUsers.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
