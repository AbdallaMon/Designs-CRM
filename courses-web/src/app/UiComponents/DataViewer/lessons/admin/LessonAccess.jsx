import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

import { getDataAndSet } from '@/app/helpers/functions/getDataAndSet';
import DeleteModal from '@/app/models/DeleteModal';
import dayjs from 'dayjs';
import { useAlertContext } from '@/app/providers/MuiAlert';
import { handleRequestSubmit } from '@/app/helpers/functions/handleSubmit';
import { MdAdd, MdManageAccounts, MdPerson } from 'react-icons/md';
import { useToastContext } from '@/app/providers/ToastLoadingProvider';

const LessonAccessDialog = ({ lessonId ,courseId }) => {
  const [open, setOpen] = useState(false);
  const [lessonAccess, setLessonAccess] = useState([]);
  const [_,setAllowedRoles]=useState([])
  const [loadingAllowed,setLoadingAllowedRoles]=useState(false)
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const {setAlertError}=useAlertContext()
const {setToastLoading }=useToastContext()
  const fetchLessonAccess = async () => {
   await getDataAndSet({url:`admin/courses/${courseId}/lessons/${lessonId}/allowed-users`,setData:setLessonAccess,setLoading})
  };

  async function getAllowedRoles(){
   const req= await getDataAndSet({url:`admin/courses/${courseId}/allowed-roles`,setLoading:setLoadingAllowedRoles,setData:setAllowedRoles})
    await fetchAllUsers(req.data)
  }
  async function fetchAllUsers(roles)  {
    const roleOr= roles.map((r)=>({role:r}))
    await getDataAndSet({url:`utility/search/`,filters:{OR:roleOr},setData:setAllUsers,setLoading})

  };

  const handleOpen = () => {
    setOpen(true);
    fetchLessonAccess();
    getAllowedRoles()
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };


  const handleAddUser = async () => {
    if (!selectedUser) return;

      const hasAccess = lessonAccess.some(access => access.userId === selectedUser.id);
      if (hasAccess) {
        setAlertError('User already has access to this lesson');
        return;
      }
        const req=await handleRequestSubmit({userId:selectedUser.id},setToastLoading,`admin/courses/${courseId}/lessons/${lessonId}/allowed-users`,false,"Allowing")
if(req.status===200){
    await fetchLessonAccess()
        setSelectedUser(null);
}
  
  };

  const availableUsers = allUsers?.filter(user => 
    !lessonAccess.some(access => access.userId === user.id)
  );

  return (
    <>
      <Button
        variant="contained"
        startIcon={<MdManageAccounts />}
        onClick={handleOpen}
      >
        Manage Lesson Access
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <MdManageAccounts />
            Lesson Access Management
          </Box>
        </DialogTitle>
        
        <DialogContent>
   

          {/* Add User Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New User Access
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <Autocomplete
                options={availableUsers}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                value={selectedUser}
                loading={loadingAllowed||loading}
                onChange={(event, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Users"
                    variant="outlined"
                    placeholder="Type to search users..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} display="flex" alignItems="center" gap={1}>
                    <MdPerson fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                      {" - "}
                               <Typography variant="caption" color="text.secondary">
                        {option.role}
                      </Typography>
                    </Box>
                  </Box>
                )}
                sx={{ flexGrow: 1 }}
                noOptionsText="No users found"
              />
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                onClick={handleAddUser}
                disabled={!selectedUser}
              >
                Add Access
              </Button>
            </Box>
          </Box>

          {/* Current Access List */}
          <Typography variant="h6" gutterBottom>
            Current Access List
          </Typography>
          
          {(loading||loadingAllowed) ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {lessonAccess.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No users have access to this lesson"
                    secondary="Add users using the search above"
                  />
                </ListItem>
              ) : (
                lessonAccess.map((access) => (
                  <ListItem key={access.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <MdPerson fontSize="small" />
                          {access.user.name}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {access.user.email}
                          </Typography>
                              <Typography variant="body2" color="text.secondary">
                            {access.user.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Access granted: {dayjs(access.grantedAt).format("DD/MM/YYYY")}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                   <DeleteModal buttonType='ICON' href={`admin/courses/${courseId}/lessons/${lessonId}/allowed-users`} item={access} handleClose={fetchLessonAccess} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LessonAccessDialog;