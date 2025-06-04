import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { GoPlus } from "react-icons/go";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { IoMdCall } from "react-icons/io";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import AddPayments from "./AddPayments";

export const CallResultDialog = ({
  lead,
  setleads,
  call,
  text = "Update call result",
  type = "button",
  children,
  setCallReminders,
  reminderType = "CALL",
}) => {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("DONE");
  const [open, setOpen] = useState(false);

  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  const { setLoading } = useToastContext();

  function onClose() {
    setOpen(false);
  }

  function handleOpen() {
    setOpen(true);
  }

  const changeCallStatus = async () => {
    if (!result.trim() && status === "DONE") {
      setAlertError("Write the result of the call");
      return;
    }
    const requestedData = {
      userId: user.id,
      status,
    };
    if (reminderType === "MEETING") {
      requestedData.meetingResult = result;
    } else {
      requestedData.callResult = result;
    }

    const request = await handleRequestSubmit(
      requestedData,
      setLoading,
      `shared/client-leads/${
        reminderType === "MEETING" ? "meeting-reminders" : "call-reminders"
      }/${call.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (setCallReminders) {
        setCallReminders((oldCalls) =>
          oldCalls.map((c) => {
            return c.id === request.data.id ? request.data : c;
          })
        );
      }

      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
              if (reminderType === "MEETING") {
                l.meetingReminders = [
                  request.data,
                  ...l.meetingReminders?.filter(
                    (meeting) => meeting.id !== request.data.id
                  ),
                ];
              } else {
                l.callReminders = [
                  request.data,
                  ...l.callReminders?.filter(
                    (call) => call.id !== request.data.id
                  ),
                ];
              }
            }
            return l;
          })
        );
      }
      setOpen(false);
      setResult("");
    }
  };
  return (
    <>
      {type === "button" ? (
        <Button
          startIcon={<IoMdCall size={20} />}
          onClick={handleOpen}
          sx={{ alignSelf: "flex-start" }}
          variant="outlined"
        >
          {text}
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            {text}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
              sx={{ width: "100%" }}
            >
              <MenuItem value="DONE">Done</MenuItem>
              <MenuItem value="MISSED">Missed</MenuItem>
            </Select>
            {status === "DONE" && (
              <TextField
                autoFocus
                margin="dense"
                label="Call Result"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={changeCallStatus}
              variant="contained"
              color="primary"
              disabled={!result.trim() && status === "DONE"}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export const NewCallDialog = ({
  lead,
  setleads,
  type = "button",
  children,
  setCallReminders,
  reminderType,
}) => {
  const [callData, setCallData] = useState({ time: "", reminderReason: "" });
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  function handleOpen() {
    setOpen(true);
  }
  const reminderName = reminderType === "MEETING" ? "Meeting" : "Call";
  function onClose() {
    setCallData({ time: "", reminderReason: "" });
    setOpen(false);
  }
  const handleAddNewCall = async () => {
    const request = await handleRequestSubmit(
      {
        reminderReason: callData.reminderReason,
        time: dayjs(callData.time).utc().toISOString(),
        userId: user.id,
      },
      setLoading,
      `shared/client-leads/${lead.id}/${
        reminderType === "MEETING" ? "meeting-reminders" : "call-reminders"
      }`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      if (setCallReminders) {
        setCallReminders((oldCalls) => [request.data.newReminder, ...oldCalls]);
      }
      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
              if (reminderType === "MEETING") {
                l.meetingReminders = request.data.latestTwo;
              } else {
                l.callReminders = request.data.latestTwo;
              }
            }
            return l;
          })
        );
      }
      setCallData({ time: "", reminderReason: "" });
      setOpen(false);
    }
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
          Schedule New {reminderName}
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            Schedule New {reminderName}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                type="datetime-local"
                label={`${reminderName} Time`}
                value={callData.time}
                onChange={(e) =>
                  setCallData({ ...callData, time: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Reminder Reason"
                value={callData.reminderReason}
                onChange={(e) =>
                  setCallData({ ...callData, reminderReason: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewCall}
              variant="contained"
              color="primary"
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
function OpenButton({ handleOpen, children }) {
  return (
    <>
      <Button
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-start",
          width: "100%",
        }}
        variant={"text"}
        onClick={handleOpen}
      >
        {children}
      </Button>
    </>
  );
}
export const NewNoteDialog = ({
  lead,
  setNotes,
  type = "button",
  children,
  handleClose,
}) => {
  const [open, setOpen] = useState(false);
  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const [newNote, setNewNote] = useState("");
  const theme = useTheme();
  const onClose = () => setOpen(false);
  function handleOpen() {
    setOpen(true);
  }
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setAlertError("You must write something in the note to create new one");
      return;
    }
    const request = await handleRequestSubmit(
      {
        content: newNote,
        userId: user.id,
      },
      setLoading,
      `shared/client-leads/${lead.id}/notes`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      if (setNotes) {
        setNotes((oldNotes) => [request.data, ...oldNotes]);
      }
      if (handleClose) {
        handleClose(request.data);
      }
      setNewNote("");
      setOpen(false);
    }
  };
  return (
    <>
      {type === "button" ? (
        <Button
          endIcon={<GoPlus />}
          onClick={handleOpen}
          variant="contained"
          sx={{ width: "fit-content" }}
        >
          Add new Note
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            Add New Note
          </DialogTitle>
          <DialogContent>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                my: 2,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                {lead.assignedTo && (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {lead.assignedTo.name[0]}
                  </Avatar>
                )}
                <TextField
                  label="Add a new note"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="Write your note here..."
                />
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BsPlus size={16} />}
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
export const AddPriceOffers = ({
  lead,
  type = "button",
  children,
  setPriceOffers,
}) => {
  const [priceOffer, setPriceOffer] = useState({
    note: null,
    file: null,
  });
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  function handleOpen() {
    setOpen(true);
  }
  function onClose() {
    setPriceOffer({ minPrice: 0, maxPrice: 0 });
    setOpen(false);
  }
  const handleAddNewPriceOffer = async () => {
    if (!priceOffer.note) {
      setAlertError("You must enter note");
      return;
    }
    if (priceOffer.file) {
      const formData = new FormData();
      formData.append("file", priceOffer.file);
      const fileUpload = await handleRequestSubmit(
        formData,
        setLoading,
        "utility/upload",
        true,
        "Uploading file"
      );
      if (fileUpload.status === 200) {
        priceOffer.url = fileUpload.fileUrls.file[0];
      } else {
        return;
      }
    }
    const request = await handleRequestSubmit(
      {
        priceOffer,
        userId: user.id,
      },
      setLoading,
      `shared/client-leads/${lead.id}/price-offers`,
      false,
      "Adding"
    );
    if (request.status === 200) {
      if (setPriceOffers) {
        setPriceOffers((oldPrices) => [request.data, ...oldPrices]);
      }
      setOpen(false);
    }
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
          Add New Offer
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            New Price Offer
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Note"
                value={priceOffer.note}
                onChange={(e) =>
                  setPriceOffer({ ...priceOffer, note: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                InputLabelProps={{ shrink: true }}
              />
              <SimpleFileInput
                label="File"
                id="file"
                setData={setPriceOffer}
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewPriceOffer}
              variant="contained"
              color="primary"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
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
      const formData = new FormData();
      formData.append("file", fileItem.file);

      const fileUpload = await handleRequestSubmit(
        formData,
        setLoading,
        "utility/upload",
        true,
        "Uploading file"
      );

      if (fileUpload.status === 200) {
        const data = {
          ...fileItem,
          url: fileUpload.fileUrls.file[0],
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

export const AddExtraService = ({
  lead,
  setExtraServices,
  type = "button",
  children,
  setPayments,
}) => {
  const [extraService, setExtraService] = useState({
    note: null,
    price: 0,
    paymentReason: null,
  });
  const [open, setOpen] = useState(false);
  const { setAlertError } = useAlertContext();
  const [openPayments, setOpenPayments] = useState(false);
  function handleOpen() {
    setOpen(true);
  }
  function onClose(close) {
    setExtraService({ note: null, price: 0 });
    setOpen(false);
    if (close) {
      // setExtraServices((old) => [...old, extraService]);
      window.location.reload();
    }
  }
  const handleAddNewExtraService = async () => {
    if (!extraService.price || !extraService.paymentReason) {
      setAlertError("You must enter payment reason and price");
      return;
    }
    if (extraService.price <= 0) {
      setAlertError("You must a price bigger than 0");
      return;
    }
    setOpenPayments(true);
  };

  return (
    <>
      {openPayments && (
        <AddPayments
          lead={lead}
          onClose={onClose}
          open={openPayments}
          paymentType="extra-service"
          setOpen={setOpenPayments}
          totalAmount={extraService.price}
          extraData={extraService}
          setOldPayments={setPayments}
        />
      )}
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{ alignSelf: "flex-start" }}
        >
          Add extra service
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            New Service
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Price"
                value={extraService.price}
                onChange={(e) =>
                  setExtraService({ ...extraService, price: e.target.value })
                }
                fullWidth
                type="number"
              />
              <TextField
                label="Payment Reason"
                value={extraService.note}
                onChange={(e) =>
                  setExtraService({
                    ...extraService,
                    paymentReason: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Note"
                value={extraService.note}
                onChange={(e) =>
                  setExtraService({ ...extraService, note: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewExtraService}
              variant="contained"
              color="primary"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
