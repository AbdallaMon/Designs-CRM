import React, { useState, useMemo } from "react";
import {
  alpha,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { AddFiles } from "@/app/UiComponents/DataViewer/leads/dialogs/AddFilesDialog";

import DeleteModelButton from "../../../common/DeleteModelButton";
import {
  getFileTypeIcon,
  renderFilePreview,
} from "@/app/UiComponents/utility/Files";
import { FaEye } from "react-icons/fa";
import { MdFolderOpen } from "react-icons/md";
import { SectionToolbar } from "../shared/SectionToolbar";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";

export function FileList({ lead, admin, notUser }) {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const { data: files, onMutated: setFiles, showLoading } = useLeadTab("files", {
    fallback: lead?.files,
  });
  const { userFiles, clientFiles } = useMemo(() => {
    return {
      userFiles: files?.filter((file) => file.isUserFile),
      clientFiles: files?.filter((file) => !file.isUserFile),
    };
  }, [files]);

  if (showLoading) return <TabLoading />;

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderFileGrid = (list) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
        },
        gap: 2,
      }}
    >
      {list.map((file) => (
        <Paper
          key={file.id}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.divider}`,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow: theme.shadows[3],
              borderColor: alpha(theme.palette.primary.main, 0.4),
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  flexShrink: 0,
                }}
              >
                {getFileTypeIcon(file.url, theme)}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.primary"
                  noWrap
                  title={file.name}
                >
                  {file.name}
                </Typography>
                {file.description && (
                  <Typography variant="caption" color="text.secondary">
                    {file.description}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Tooltip title="Preview">
                <IconButton
                  size="small"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <FaEye size={16} />
                </IconButton>
              </Tooltip>
              <DeleteModelButton
                item={file}
                model={"File"}
                contentKey="name"
                onDelete={() => {
                  setFiles((oldFiles) =>
                    oldFiles.filter((f) => f.id !== file.id)
                  );
                }}
              />
            </Stack>
          </Stack>
          {renderFilePreview(file)}
        </Paper>
      ))}
    </Box>
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab
            sx={{ textTransform: "none", fontWeight: 600 }}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                User Files
                <Chip
                  label={userFiles?.length || 0}
                  size="small"
                  color="primary"
                />
              </Box>
            }
          />
          <Tab
            sx={{ textTransform: "none", fontWeight: 600 }}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Client Files
                <Chip
                  label={clientFiles?.length || 0}
                  size="small"
                  color="primary"
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {currentTab === 0 && (
        <Stack spacing={2.5}>
          {!notUser && (
            <Box>
              <AddFiles lead={lead} setFiles={setFiles} />
            </Box>
          )}
          {userFiles?.length === 0 ? (
            <EmptyState
              icon={<MdFolderOpen />}
              title="No user files"
              description={
                notUser
                  ? "There are no user files for this lead."
                  : "Upload a file to attach it to this lead."
              }
            />
          ) : (
            renderFileGrid(userFiles)
          )}
        </Stack>
      )}
      {currentTab === 1 && (
        <Box>
          {clientFiles?.length === 0 ? (
            <EmptyState
              icon={<MdFolderOpen />}
              title="No client files"
              description="The client has not uploaded any files yet."
            />
          ) : (
            renderFileGrid(clientFiles)
          )}
        </Box>
      )}
    </Stack>
  );
}
