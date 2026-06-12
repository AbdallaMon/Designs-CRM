"use client";

// Files tab — lists the lead's files and exposes the Add-file dialog (chunk upload +
// POST /:id/files). Gated on canAddFile.

import { Link as MuiLink, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AddFileDialog } from "../dialogs/AddFileDialog.jsx";

export function FilesTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const files = Array.isArray(lead?.files) ? lead.files : [];

  return (
    <Stack spacing={2}>
      <AddFileDialog lead={lead} canAdd={caps.canAddFile} onCreated={onChanged} />
      {files.length === 0 ? (
        <Typography color="text.secondary">لا توجد ملفات</Typography>
      ) : (
        <List>
          {files.map((f) => (
            <ListItem key={f.id} divider>
              <ListItemText
                primary={
                  f.url ? (
                    <MuiLink href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.name || f.url}
                    </MuiLink>
                  ) : (
                    f.name || "—"
                  )
                }
                secondary={
                  <>
                    {f.description ? `${f.description} · ` : ""}
                    {f.createdAt ? dayjs(f.createdAt).format("YYYY-MM-DD") : ""}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
