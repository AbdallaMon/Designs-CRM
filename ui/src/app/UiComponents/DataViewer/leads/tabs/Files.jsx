import React, { useEffect, useState, useMemo } from "react";
import { Box, Chip, Typography, useTheme } from "@mui/material";

import { AddFiles } from "@/app/UiComponents/DataViewer/leads/dialogs/AddFilesDialog";
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Link as MuiLink,
} from "@mui/material";

import DeleteModelButton from "../../../inline-actions/DeleteModelButton";
import {
  getFileType,
  getFileTypeIcon,
  renderFilePreview,
} from "@/app/UiComponents/layout/FilePreviewUtils";
import { FaEye } from "react-icons/fa";

export function FileList({ lead, admin, notUser }) {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const [files, setFiles] = useState(lead.files);
  const { userFiles, clientFiles } = useMemo(() => {
    return {
      userFiles: files?.filter((file) => file.isUserFile),
      clientFiles: files?.filter((file) => !file.isUserFile),
    };
  }, [files]);
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };
  const renderFileList = (files) => (
    <List>
      {files.map((file) => {
        return (
          <ListItem key={file.id} sx={listItemStyles}>
            <Box sx={{ width: "100%", p: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {getFileTypeIcon(file.url, theme)}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Name: {file.name}
                    </Typography>
                    {file.description && (
                      <Typography variant="body2" color="textSecondary">
                        Description: {file.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
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
                  <Tooltip title="Preview">
                    <IconButton
                      size="small"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <FaEye />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {renderFilePreview(file)}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Card sx={cardStyles}>
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  User Files
                  <Chip label={userFiles.length} size="small" color="primary" />
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Client Files
                  <Chip
                    label={clientFiles.length}
                    size="small"
                    color="primary"
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <Box>
            {!notUser && <AddFiles lead={lead} setFiles={setFiles} />}
            {userFiles.length === 0 ? (
              <Typography
                variant="body1"
                color="textSecondary"
                textAlign="center"
              >
                No user files available
              </Typography>
            ) : (
              renderFileList(userFiles)
            )}
          </Box>
        )}
        {currentTab === 1 && (
          <Box>
            {clientFiles.length === 0 ? (
              <Typography
                variant="body1"
                color="textSecondary"
                textAlign="center"
              >
                No client files available
              </Typography>
            ) : (
              renderFileList(clientFiles)
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
