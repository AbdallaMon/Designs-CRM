import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { FiMessageSquare } from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

export function StartNewChat() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { loading: creating, setLoading: setCreating } = useToastContext();
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    const req = await getDataAndSet({
      setLoading: setUsersLoading,
      setData: setUsers,
      setError: setUsersError,
      url: "shared/all-chat-users",
    });
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  const handleCreateChat = async () => {
    if (!selectedUser) return;
    const res = await handleRequestSubmit(
      { participantId: selectedUser.id },
      setCreating,
      "shared/chat/rooms/create-chat",
      false,
      "Starting chat..."
    );

    if (res?.status === 200) {
      setOpen(false);
      setSelectedUser(null);
      const roomId = res?.id || res?.data?.id;
      // router.push(`/dashboard/chat?roomId=${roomId}&getChat=true`);
      // set searchParams to window
      window.history.replaceState(
        null,
        "",
        `/dashboard/chat?roomId=${roomId}&getChat=true`
      );
      window.location.reload();
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FiMessageSquare />}
        onClick={() => setOpen(true)}
      >
        Start a new chat
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          zIndex: 1302,
        }}
      >
        <DialogTitle>Select a user to chat with</DialogTitle>

        <DialogContent dividers>
          {usersLoading ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={28} />
            </Box>
          ) : usersError ? (
            <Typography color="error">{usersError}</Typography>
          ) : users.length === 0 ? (
            <Typography>No available users.</Typography>
          ) : (
            <List>
              {users.map((user) => (
                <ListItemButton
                  key={user.id}
                  selected={selectedUser?.id === user.id}
                  onClick={() => setSelectedUser(user)}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profilePicture}>
                      {user.name?.[0] || "U"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.name} secondary={user.email} />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Stack direction="row" spacing={1} alignItems="center">
            {creating && <CircularProgress size={18} />}
            <Button
              variant="contained"
              onClick={handleCreateChat}
              disabled={!selectedUser || creating}
            >
              Create chat
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
