"use client";
import React, { useEffect, useState } from "react";
import {
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
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import AddPayments from "../payments/AddPayments";

import utc from "dayjs/plugin/utc";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { OpenButton } from "./OpenButton";

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
      //   "utility/upload",
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
          `shared/client-leads/${lead.id}/files`,
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
          sx={{ alignSelf: "flex-start" }}
        >
          Add New File
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            New File
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
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
                rows={3}
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
                variant="contained"
                color="primary"
                disabled={!fileData.name || !fileData.file}
              >
                Add File
              </Button>
            </Stack>
            {fileList.length > 0 && (
              <List
                sx={{
                  mt: 2,
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {fileList.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <MdDelete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`Name: ${file.name}`}
                      secondary={
                        <>
                          <div>{`File Name: ${file.file.name}`}</div>
                          <div>{`Description: ${file.description}`}</div>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllFiles}
              variant="contained"
              color="primary"
              disabled={fileList.length === 0}
            >
              Save All
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
