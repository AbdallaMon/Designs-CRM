import React, { useState } from "react";
import {
  Box,
  Fade,
  Modal,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { simpleModalStyle } from "@/app/helpers/constants";
import { MdDelete } from "react-icons/md";

export default function DeleteModal({
  handleClose,
  item,
  setData,
  href,
  setTotal,
  archive = false,
  buttonType = "TEXT",
  extra,
  fullButtonWidth = false,
}) {
  const { setLoading } = useToastContext();
  const [open, setOpen] = useState(false);
  const handleDeleteOpen = (item) => {
    setOpen(true);
  };
  const handleDeleteOrArchive = async () => {
    const url = archive
      ? `${href}/${item.id}?${extra ? extra : ""}&`
      : `${href}/${item.id}?${extra ? extra : ""}&`;
    const method = archive ? "PATCH" : "DELETE";
    const message = archive ? "جاري الارشفة..." : "Deleting";
    const result = await handleRequestSubmit(
      {},
      setLoading,
      url,
      false,
      message,
      null,
      method
    );
    if (result.status === 200) {
      setOpen(false);
      if (setData) {
        setData((prevData) =>
          prevData.filter((dataItem) => dataItem.id !== item.id)
        );
      }
      if (setTotal) {
        setTotal((prev) => prev - 1);
      }
      if (handleClose) {
        handleClose();
      }
    }
  };

  if (!open)
    return buttonType === "ICON" ? (
      <IconButton
        onClick={() => handleDeleteOpen(item)}
        color={archive ? "warning" : "error"}
      >
        <MdDelete />
      </IconButton>
    ) : (
      <Button
        fullWidth={fullButtonWidth}
        variant="contained"
        color="secondary"
        onClick={() => handleDeleteOpen(item)}
        sx={{ textTransform: "none" }}
      >
        {!archive ? "Delete" : "Archieve"}
      </Button>
    );
  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition>
        <Fade in={open}>
          <Box sx={{ ...simpleModalStyle }}>
            <Typography variant="h6" component="h2">
              {archive
                ? "هل انت متاكد انك تريد عمل ارشفة لهذا العنصر"
                : "Are u sure u want to delete this item?"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <Button
                variant="contained"
                color={archive ? "warning" : "secondary"}
                onClick={handleDeleteOrArchive}
              >
                {archive ? "ارشفه" : "Delete"}
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpen(false)}
                sx={{ marginLeft: "8px" }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
