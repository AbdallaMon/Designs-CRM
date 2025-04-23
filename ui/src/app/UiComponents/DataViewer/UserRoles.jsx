"use client";

import { getData } from "@/app/helpers/functions/getData";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdOutlineSwitchAccount } from "react-icons/md";

export default function SignInWithDifferentUserRole() {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRoles() {
      const rolesReq = await getData({ url: "shared/roles", setLoading });

      if (rolesReq && rolesReq.status === 200) setRoles(rolesReq.data);
    }
    getUserRoles();
  }, []);

  return (
    <>
      <Button
        startIcon={<MdOutlineSwitchAccount />}
        onClick={() => setOpen(true)}
      >
        Switch Role
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Select Role</DialogTitle>
        <DialogContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <List>
              {roles.map((role) => (
                <ListItem
                  key={role}
                  button
                  onClick={() => {
                    setUser({ ...user, role });
                    localStorage.setItem("role", role);
                    setOpen(false);
                  }}
                >
                  <ListItemText primary={role} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
