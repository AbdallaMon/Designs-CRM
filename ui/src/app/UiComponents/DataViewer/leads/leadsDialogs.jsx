import React, {useState} from "react";
import {
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField, useTheme
} from "@mui/material";
import {BsPlus} from "react-icons/bs";
import {GoPlus} from "react-icons/go";
import {useAlertContext} from "@/app/providers/MuiAlert.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {IoMdCall} from "react-icons/io";

export const CallResultDialog = ({lead, setleads, call,text="Update call result", type = "button", children, setCallReminders}) => {
    const [result, setResult] = useState('');
    const [status, setStatus] = useState("DONE")
    const [open, setOpen] = useState(false)

    const {setAlertError} = useAlertContext()
    const {user} = useAuth()
    const {setLoading} = useToastContext()

    function onClose() {
        setOpen(false)
    }

    function handleOpen(){
        setOpen(true)
    }
    const changeCallStatus = async () => {
        if (!result.trim() && status === "DONE") {
            setAlertError("Write the result of the call")
            return
        }

        const request = await handleRequestSubmit({
            callResult: result,
            userId: user.id
            , status
        }, setLoading, `staff/client-leads/call-reminders/${call.id}`, false, "Updating",false,"PUT")
        if (request.status === 200) {
            if (setCallReminders) {
                setCallReminders((oldCalls) => [...oldCalls, request.data])
            }
            if (setleads) {
                setleads((oldLeads) => oldLeads.map((l) => {
                    if (l.id === lead.id) {
                        l.callReminders = [request.data, ...l.callReminders?.filter((call) => call.id !== request.data.id)]
                    }
                    return l
                }))
            }
            setOpen(false)
            setResult('');
        }
    };
    return (
          <>
              {type === "button" ?
                    <Button
                          startIcon={<IoMdCall size={20}/>}
                          onClick={handleOpen}
                          sx={{alignSelf: 'flex-start'}}
                          variant="outlined"
                    >
                        {text}
                    </Button>
                    :  <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
              }
              {open &&
                    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{borderBottom: 1, borderColor: 'divider'}}>
                            Update Call Result
                        </DialogTitle>
                        <DialogContent sx={{mt: 2}}>
                            <Select value={status} onChange={(e) => {
                                setStatus(e.target.value)
                            }}
                            sx={{width:"100%"}}
                            >
                                <MenuItem value="DONE">
                                    Done
                                </MenuItem>
                                <MenuItem value="MISSED">
                                    Missed
                                </MenuItem>
                            </Select>
                            {status === "DONE" &&
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
                            }
                        </DialogContent>
                        <DialogActions sx={{p: 2, borderTop: 1, borderColor: 'divider'}}>
                            <Button onClick={onClose} variant="outlined">Cancel</Button>
                            <Button onClick={changeCallStatus} variant="contained" color="primary"
                                    disabled={!result.trim()&&status==="DONE"}>
                                Update
                            </Button>
                        </DialogActions>
                    </Dialog>
              }
          </>
    );
};


// NewCallDialog Component (No changes needed)
export const NewCallDialog = ({lead, setleads, type = "button", children, setCallReminders}) => {
    const [callData, setCallData] = useState({time: '', reminderReason: ''});
    const [open, setOpen] = useState(false)
    const {setAlertError} = useAlertContext()
    const {user} = useAuth()
    const {setLoading} = useToastContext()

    function handleOpen() {
        const canScheduleNewCall = !lead?.callReminders.some(call => call.status === 'IN_PROGRESS');
        if (canScheduleNewCall) {
            setOpen(true)
        } else {
            setAlertError("Complete or close the in-progress call before scheduling a new one")
        }
    }
function onClose(){
    setCallData({time: '', reminderReason: ''})
        setOpen(false)

}
    const handleAddNewCall = async () => {
        const canScheduleNewCall = !lead?.callReminders.some(call => call.status === 'IN_PROGRESS');
        if (!canScheduleNewCall) {
            setAlertError("Complete or close the in-progress call before scheduling a new one.")
            return
        }

        const request = await handleRequestSubmit({
            reminderReason: callData.reminderReason,
            time: callData.time,
            userId: user.id
        }, setLoading, `staff/client-leads/${lead.id}/call-reminders`, false, "Creating")
        if (request.status === 200) {
            if (setCallReminders) {
                setCallReminders((oldCalls) => [...oldCalls, request.data])
            }
            if (setleads) {
                setleads((oldLeads) => oldLeads.map((l) => {
                    if (l.id === lead.id) {
                        l.callReminders = [request.data, ...l.callReminders]
                    }
                    return l
                }))
            }
            setCallData({time: '', reminderReason: ''});
            setOpen(false)
        }
    };

    return (
          <>
              {type === "button" ?
                    <Button
                          onClick={handleOpen}
                          variant="contained"
                          startIcon={<BsPlus size={20}/>}
                          sx={{alignSelf: 'flex-start'}}
                    >
                        Schedule New Call
                    </Button>
                    :  <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
              }
              {open &&
                    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{borderBottom: 1, borderColor: 'divider'}}>
                            Schedule New Call
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{mt: 2}}>
                                <TextField
                                      type="datetime-local"
                                      label="Call Time"
                                      value={callData.time}
                                      onChange={(e) => setCallData({...callData, time: e.target.value})}
                                      fullWidth
                                      InputLabelProps={{shrink: true}}
                                />
                                <TextField
                                      label="Reminder Reason"
                                      value={callData.reminderReason}
                                      onChange={(e) => setCallData({...callData, reminderReason: e.target.value})}
                                      fullWidth
                                      multiline
                                      rows={2}
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{p: 2, borderTop: 1, borderColor: 'divider'}}>
                            <Button onClick={onClose} variant="outlined">Cancel</Button>
                            <Button
                                  onClick={handleAddNewCall}
                                  variant="contained"
                                  color="primary"
                            >
                                Schedule
                            </Button>
                        </DialogActions>
                    </Dialog>
              }
          </>
    );
};
function OpenButton({handleOpen,children}){
    return   <>
        <Button
              sx={{
                  display:"flex",
                  gap:1,
                  justifyContent:"flex-start",
                  width:"100%"
              }}
              variant={"text"}
              onClick={handleOpen}
        >{children}</Button>
    </>
}
export const NewNoteDialog = ({lead, setleads, setNotes, type="button", children}) => {
    const [open, setOpen] = useState(false)
    const {setAlertError} = useAlertContext()
    const {user} = useAuth()
    const {setLoading} = useToastContext()
    const [newNote, setNewNote] = useState("")
    const theme=useTheme()
    const onClose = () => setOpen(false)
    function handleOpen(){
        setOpen(true)
    }
    const handleAddNote = async () => {
        if (!newNote.trim()) {
            setAlertError("You must write something in the note to create new one")
            return
        }
        const request = await handleRequestSubmit({
            content: newNote,
            userId: user.id
        }, setLoading, `staff/client-leads/${lead.id}/notes`, false, "Creating")
        if (request.status === 200) {
            if (setNotes) {
                setNotes((oldNotes) => [...oldNotes, request.data])
            }
            if (setleads) {
                setleads((oldLeads) => oldLeads.map((l) => {
                    if (l.id === lead.id) {
                        l.notes = [request.data, ...l.notes]
                    }
                    return l
                }))
            }
            setNewNote("")
            setOpen(false)
        }
    }
    return (
          <>
              {type === "button" ?
                    <Button endIcon={<GoPlus/>} onClick={handleOpen} variant="contained"  sx={{width:"fit-content"}}>
                        Add new Note
                    </Button>
                    :  <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
              }
              {open && <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{borderBottom: 1, borderColor: 'divider'}}>
                      Add New Note
                  </DialogTitle>
                  <DialogContent>
                      <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                my:2,
                                backgroundColor: theme.palette.background.paper,
                            }}
                      >
                          <Stack direction="row" spacing={2} alignItems="center">
                              {lead.assignedTo &&
                                    <Avatar sx={{bgcolor: theme.palette.primary.main}}>
                                        {lead.assignedTo.name[0]}
                                    </Avatar>
                              }
                              <TextField
                                    label="Add a new note"
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddNote();
                                        }
                                    }}
                                    placeholder="Write your note here..."
                              />

                          </Stack>
                      </Paper>
                  </DialogContent>
                  <DialogActions sx={{p: 2, borderTop: 1, borderColor: 'divider'}}>
                      <Button onClick={onClose} variant="outlined">Cancel</Button>
                      <Button
                            variant="contained"
                            color="primary"
                            startIcon={<BsPlus size={16}/>}
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                      >
                          Add
                      </Button>
                  </DialogActions>
              </Dialog>}
          </>
    )
}