import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { MdAdd, MdEdit } from "react-icons/md";
import { useState } from "react";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

export function SesssionItemModal({
  model,
  type,
  onClose,
  item,
  buttonType = "TEXT",
}) {
  const [formData, setFormData] = useState({
    name: "",
    avatarUrl: "",
    file: "",
  });

  const { setAlertError } = useAlertContext();
  const { setLoading: setToastLoading } = useToastContext();
  const isEdit = type === "EDIT";
  const [openDialog, setOpenDialog] = useState(false);
  const getActionConfig = () => {
    switch (type) {
      case "EDIT":
        return {
          icon: <MdEdit />,
          text: "Edit",
        };
      case "CREATE":
      default:
        return {
          icon: <MdAdd />,
          text: "Create",
        };
    }
  };

  const { icon, text } = getActionConfig();
  const handleOpenDialog = () => {
    setFormData({
      name: item?.name || "",
      avatarUrl: item?.avatarUrl || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: "", avatarUrl: "" });
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setAlertError("Space name is required");
      return;
    }

    if (!formData.file && !isEdit) {
      setAlertError("You must upload file");
      return;
    }
    if (formData.file) {
      const uploadForm = new FormData();
      uploadForm.append("file", formData.file);

      const uploadResponse = await handleRequestSubmit(
        uploadForm,
        setToastLoading,
        "utility/upload",
        true,
        "Uploading file"
      );
      if (uploadResponse.status !== 200) {
        setAlertError("Error uploading file");
        return;
      }
      formData.avatarUrl = uploadResponse.fileUrls.file[0];
    }
    const url = isEdit
      ? `admin/image-session/${item.id}?model=${model}&`
      : `admin/image-session?model=${model}&`;

    const method = isEdit ? "PUT" : "POST";
    const request = await handleRequestSubmit(
      formData,
      setToastLoading,
      url,
      false,
      "Submitting",
      false,
      method
    );
    if (request.status === 200) {
      if (onClose) {
        onClose();
      }
      handleCloseDialog();
    }
  };
  if (!openDialog) {
    return buttonType === "ICON" ? (
      <IconButton onClick={handleOpenDialog} color="primary">
        {icon}
      </IconButton>
    ) : (
      <Button
        variant="contained"
        startIcon={icon}
        onClick={handleOpenDialog}
        color="primary"
      >
        {text}
      </Button>
    );
  }
  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isEdit ? `Edit ${model}` : `Create New ${model}`}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={`${model} Name`}
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          sx={{ mb: 2 }}
        />
        <SimpleFileInput
          label="Avatar"
          id="file"
          variant="outlined"
          setData={setFormData}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name.trim()}
        >
          {isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
