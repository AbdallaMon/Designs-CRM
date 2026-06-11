"use client";

import { useState } from "react";
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
import { LastSeenAt, OnlineStatus } from "../members/LastSeenAt.jsx";
import { ConfirmDialog } from "./ConfirmDialog.jsx";
import chatService from "../../chat.service.js";
import { runChatMutation } from "../../chat.mutations.js";

const getAvatarSrc = (e) =>
  e?.profilePicture || e?.avatar || e?.user?.profilePicture || e?.user?.avatar || null;

const roleLabel = (m) =>
  m.role === "ADMIN" ? "مشرف" : m.role === "MODERATOR" ? "مدير" : m.client ? "عميل" : "عضو";
const roleColor = (m) =>
  m.role === "ADMIN" ? "primary" : m.role === "MODERATOR" ? "secondary" : m.client ? "info" : "default";

/**
 * Members management. The whole add/remove/role section is gated on `canManageMembers`
 * (hasPermission(MEMBER_MANAGE) × room.capabilities.canManageMembers — computed by the
 * parent). Writes go through chatService members endpoints.
 */
export function AddMembersDialog({
  open,
  onClose,
  roomId,
  members,
  availableUsers,
  selectedUsers,
  loadingUsers,
  canManageMembers,
  onToggleSelectUser,
  onAddMembers,
  onRemoveMember,
  reFetchMembers,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ zIndex: 1302 }}>
      <DialogTitle>أعضاء المحادثة</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {members.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                الأعضاء الحاليون ({members.length})
              </Typography>
              <Stack spacing={1.5}>
                {members.map((m) => (
                  <Stack
                    key={m.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ position: "relative", p: 1, borderRadius: 1, bgcolor: "action.hover" }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <OnlineStatus lastSeenAt={m.user?.lastSeenAt || m.client?.lastSeenAt} />
                      <Avatar src={getAvatarSrc(m.user || m.client)} sx={{ position: "relative" }}>
                        {(m.user?.name || m.client?.name || "?").charAt(0)}
                      </Avatar>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600} noWrap>
                        {m.user?.name || m.client?.name || "غير معروف"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {m.user?.email || m.client?.email || ""}
                      </Typography>
                      <LastSeenAt lastSeenAt={m.user?.lastSeenAt || m.client?.lastSeenAt} />
                    </Box>
                    {canManageMembers && !m.clientId && m.role !== "ADMIN" && (
                      <MarkAsModerator member={m} onMark={reFetchMembers} roomId={roomId} />
                    )}
                    {m.role !== "ADMIN" && !m.clientId && canManageMembers && (
                      <IconButton size="small" onClick={() => onRemoveMember(m)} color="error">
                        <MdDelete />
                      </IconButton>
                    )}
                    <Chip label={roleLabel(m)} color={roleColor(m)} size="small" />
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {canManageMembers && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                إضافة أعضاء جدد
              </Typography>
              {loadingUsers ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : availableUsers.length === 0 ? (
                <Typography color="textSecondary" sx={{ p: 2 }}>
                  لا يوجد أعضاء متاحون للإضافة
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                  <Stack spacing={1}>
                    {availableUsers.map((u) => {
                      const isSelected = selectedUsers.some((s) => s.id === u.id);
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
                            borderColor: isSelected ? "primary.main" : "divider",
                            bgcolor: isSelected ? "primary.lighter" : "background.paper",
                          }}
                          onClick={() => onToggleSelectUser(u)}
                        >
                          <Avatar src={getAvatarSrc(u)}>{(u.name || "?").charAt(0)}</Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={600} noWrap>{u.name || "غير معروف"}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{u.email || ""}</Typography>
                          </Box>
                          <Chip
                            label={isSelected ? "محدد" : "تحديد"}
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
              {selectedUsers.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    محددون للإضافة ({selectedUsers.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {selectedUsers.map((u) => (
                      <Chip
                        key={u.id}
                        avatar={<Avatar src={getAvatarSrc(u)}>{(u.name || "?").charAt(0)}</Avatar>}
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
        <Button onClick={onClose}>إغلاق</Button>
        {canManageMembers && (
          <Button onClick={onAddMembers} variant="contained" disabled={selectedUsers.length === 0 || loadingUsers}>
            إضافة الأعضاء ({selectedUsers.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function MarkAsModerator({ member, onMark, roomId }) {
  const [openConfirm, setConfirmOpen] = useState(false);
  async function handleConfirm() {
    const res = await runChatMutation(
      () =>
        chatService.updateMember(roomId, member.id, {
          role: member.role === "MODERATOR" ? "MEMBER" : "MODERATOR",
        }),
      { loading: "تحديث الدور..." },
    );
    if (res) {
      onMark?.();
      setConfirmOpen(false);
    }
  }
  return (
    <>
      <Button variant="outlined" onClick={() => setConfirmOpen(true)}>
        تعيين كـ {member.role === "MODERATOR" ? "عضو" : "مدير"}
      </Button>
      <ConfirmDialog
        title={`تعيين ${member.user?.name || "المستخدم"} كـ ${member.role === "MODERATOR" ? "عضو" : "مدير"}`}
        description="هل أنت متأكد من تغيير دور هذا العضو؟"
        open={openConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        confirmButtonText="نعم، تأكيد"
        confirmButtonColor="primary"
      />
    </>
  );
}
