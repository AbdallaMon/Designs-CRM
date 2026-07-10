import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from "@mui/material";

import { AddFiles } from "@/app/UiComponents/DataViewer/leads/dialogs/AddFilesDialog";

import DeleteModelButton from "@/app/UiComponents/common/DeleteModelButton.jsx";
import {
  getFileTypeIcon,
  renderFilePreview,
} from "@/app/UiComponents/utility/Files";
import { FaEye } from "react-icons/fa";
import { MdFolderOpen } from "react-icons/md";
import { GoPaperclip } from "react-icons/go";
import { EmptyState } from "@/app/UiComponents/DataViewer/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/app/UiComponents/DataViewer/leads/shared/TabLoading.jsx";
import { useLeadTab } from "@/app/UiComponents/DataViewer/leads/context/LeadDetailsContext.jsx";
import { TabSection, RecordCard } from "@/app/UiComponents/DataViewer/leads/shared/tabKit.jsx";

export function FileList({ lead, admin, notUser }) {
  const theme = useTheme();
  const [scope, setScope] = useState("user");
  const {
    data: files,
    onMutated: setFiles,
    showLoading,
    error,
    refetch,
  } = useLeadTab("files", {
    fallback: lead?.files,
  });
  const { userFiles, clientFiles } = useMemo(
    () => ({
      userFiles: files?.filter((file) => file.isUserFile) || [],
      clientFiles: files?.filter((file) => !file.isUserFile) || [],
    }),
    [files]
  );

  if (showLoading) return <TabLoading />;

  if (error) {
    return (
      <TabSection icon={<GoPaperclip />} title="Attachments">
        <EmptyState
          icon={<MdFolderOpen />}
          title="Couldn't load attachments"
          description="Something went wrong while loading the attachments. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={() => refetch()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        />
      </TabSection>
    );
  }

  const list = scope === "user" ? userFiles : clientFiles;

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddFile)
    : !notUser;

  const renderGrid = (items, emptyTitle, emptyDescription) =>
    items.length === 0 ? (
      <EmptyState icon={<MdFolderOpen />} title={emptyTitle} description={emptyDescription} />
    ) : (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 1.5,
        }}
      >
        {items.map((file) => (
          <RecordCard
            key={file.id}
            leading={getFileTypeIcon(file.url, theme)}
            title={file.name}
            subtitle={file.description || undefined}
            status={
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Preview">
                  <IconButton size="small" onClick={() => window.open(file.url, "_blank")}>
                    <FaEye size={15} />
                  </IconButton>
                </Tooltip>
                <DeleteModelButton
                  item={file}
                  model={"File"}
                  contentKey="name"
                  onDelete={() => setFiles((old) => old.filter((f) => f.id !== file.id))}
                />
              </Stack>
            }
          >
            {renderFilePreview(file)}
          </RecordCard>
        ))}
      </Box>
    );

  return (
    <TabSection
      icon={<GoPaperclip />}
      title="Attachments"
      count={files?.length || 0}
      action={canCreate ? <AddFiles lead={lead} setFiles={setFiles} /> : null}
    >
      <ToggleButtonGroup
        value={scope}
        exclusive
        size="small"
        onChange={(e, v) => v && setScope(v)}
        sx={{ alignSelf: "flex-start" }}
      >
        <ToggleButton value="user" sx={{ textTransform: "none", fontWeight: 600, px: 2 }}>
          User files ({userFiles.length})
        </ToggleButton>
        <ToggleButton value="client" sx={{ textTransform: "none", fontWeight: 600, px: 2 }}>
          Client files ({clientFiles.length})
        </ToggleButton>
      </ToggleButtonGroup>

      {scope === "user"
        ? renderGrid(
            userFiles,
            "No user files",
            !canCreate
              ? "There are no user files for this lead."
              : "Upload a file to attach it to this lead."
          )
        : renderGrid(
            clientFiles,
            "No client files",
            "The client has not uploaded any files yet."
          )}
    </TabSection>
  );
}
