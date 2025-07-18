import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { MdAdd, MdClose, MdEdit } from "react-icons/md";

export function OpenItemDialog({
  type,
  name,
  component,
  initialData = {},
  componentProps = {},
  slug,
  path = "admin",
  onUpdate,
  checkValidation,
  buttonType = "ICON",
  awaitCheck,
  modelType,
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const { loading, setLoading } = useToastContext();
  const actionText = type === "CREATE" ? "Create" : "Edit";
  const label = `${actionText} ${name}`;
  const { setAlertError } = useAlertContext();
  function handleClose() {
    setOpen(false);
    setData(null);
  }
  async function handleSubmit() {
    const validation = awaitCheck
      ? await checkValidation(data)
      : checkValidation(data);

    if (validation.error) {
      setAlertError(validation.message);
      setLoading(false);
      return;
    }
    const url =
      type === "CREATE"
        ? `${path}/${slug}`
        : `${path}/${slug}/${initialData.id}`;
    const request = await handleRequestSubmit(
      data,
      setLoading,
      url,
      false,
      "Submitting",
      false,
      type === "CREATE" ? "POST" : "PUT"
    );
    if (request.status === 200) {
      if (onUpdate) {
        handleClose();
        await onUpdate();
      } else {
        window.location.reload();
      }
    }
  }
  const Component = component ? component : null;
  const renderIcon = () => {
    return type === "CREATE" ? <MdAdd /> : <MdEdit />;
  };
  const icon = renderIcon();
  return (
    <>
      {buttonType === "ICON" ? (
        <IconButton onClick={() => setOpen(true)}>{icon}</IconButton>
      ) : (
        <Button
          startIcon={icon}
          variant="contained"
          onClick={() => setOpen(true)}
        >
          {label}
        </Button>
      )}

      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {label}
          <IconButton onClick={handleClose}>
            <MdClose />
          </IconButton>
        </DialogTitle>

        <DialogContent maxWidth="lg">
          {Component && (
            <Component
              data={data}
              setData={setData}
              type={type}
              initialData={initialData}
              modelType={modelType}
              {...componentProps}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              window.setTimeout(async () => {
                await handleSubmit();
              }, 50);
            }}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Submitting..." : actionText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
