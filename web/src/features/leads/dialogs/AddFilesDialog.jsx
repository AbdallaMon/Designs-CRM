"use client";
import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { MdUploadFile } from "react-icons/md";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput.jsx";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import AddPayments from "@/features/leads/payments/AddPayments.jsx";

import utc from "dayjs/plugin/utc";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { OpenButton } from "@/features/leads/dialogs/OpenButton.jsx";

dayjs.extend(utc);

export const AddFiles = ({ lead, type = "button", children, setFiles }) => {
  const [fileData, setFileData] = useState({
    name: "",
    file: "",
    description: "",
  });
  const [fileList, setFileList] = useState([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();
  function handleOpen() {
    setOpen(true);
  }
  useEffect(() => {
    if (fileData.file?.name) {
      setFileData((old) => ({ ...old, name: fileData.file.name }));
    }
  }, [fileData.file]);
  function onClose() {
    setFileData({ name: "", file: "", description: "" });
    setFileList([]);
    setOpen(false);
  }

  const handleAddNewFile = () => {
    if (!fileData.name || !fileData.file) {
      setAlertError("You must fill all the inputs");
      return;
    }

    setFileList([...fileList, fileData]);
    setFileData({ name: "", file: null, description: "" }); // Clear form for new entry
  };

  const handleRemoveFile = (index) => {
    setFileList(fileList.filter((_, i) => i !== index));
  };

  const handleSaveAllFiles = async () => {
    if (fileList.length === 0) {
      setAlertError("No files to upload");
      return;
    }

    for (const fileItem of fileList) {
      // const formData = new FormData();
      // formData.append("file", fileItem.file);

      // const fileUpload = await handleRequestSubmit(
      //   formData,
      //   setLoading,
      //   "utilities/upload",
      //   true,
      //   "Uploading file"
      // );
      const fileUpload = await uploadInChunks(
        fileItem.file,
        setProgress,
        setOverlay
      );
      if (fileUpload.status === 200) {
        const data = {
          ...fileItem,
          url: fileUpload.url,
          userId: user.id,
        };

        const request = await handleRequestSubmit(
          data,
          setLoading,
          `leads/${lead.id}/files`,
          false,
          "Adding Data",
          false,
          "POST"
        );

        if (request.status === 200 && setFiles) {
          setFiles((oldFiles) => [
            { ...request.data, isUserFile: true },
            ...oldFiles,
          ]);
        }
      }
    }

    setOpen(false);
    setFileList([]);
  };

  return (
    <>
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
        >
          Add New File
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", py: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 20,
                }}
              >
                <MdUploadFile />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Upload Files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add one or more files, then save them all together
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 4 } }}>
            <Stack spacing={2.5}>
              <TextField
                label="File Name"
                value={fileData.name}
                onChange={(e) =>
                  setFileData({ ...fileData, name: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Description"
                value={fileData.description}
                onChange={(e) =>
                  setFileData({ ...fileData, description: e.target.value })
                }
                fullWidth
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
              />
              <SimpleFileInput
                label="File"
                id="file"
                setData={setFileData}
                variant="outlined"
              />
              <Button
                onClick={handleAddNewFile}
                variant="outlined"
                color="primary"
                startIcon={<BsPlus size={18} />}
                disabled={!fileData.name || !fileData.file}
                sx={{ textTransform: "none", fontWeight: 600, alignSelf: "flex-start" }}
              >
                Add to list
              </Button>
            </Stack>
            {fileList.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 700 }}
                >
                  Files ready to upload ({fileList.length})
                </Typography>
                <List
                  sx={{
                    mt: 0.5,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    maxHeight: 220,
                    overflow: "auto",
                    p: 0.5,
                  }}
                >
                  {fileList.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <MdDelete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primaryTypographyProps={{
                          variant: "subtitle2",
                          fontWeight: 600,
                        }}
                        primary={file.name}
                        secondary={
                          <>
                            <Box component="span" sx={{ display: "block" }}>
                              {file.file.name}
                            </Box>
                            {file.description && (
                              <Box component="span" sx={{ display: "block" }}>
                                {file.description}
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllFiles}
              variant="contained"
              color="primary"
              disabled={fileList.length === 0}
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Save All
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
