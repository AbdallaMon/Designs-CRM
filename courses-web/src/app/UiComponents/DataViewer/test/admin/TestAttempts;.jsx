"use client"
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  DialogTitle
} from '@mui/material';
import { FaEye, FaUser, FaEnvelope, FaHashtag } from 'react-icons/fa';
import { getDataAndSet } from '@/app/helpers/functions/getDataAndSet';
import FullScreenLoader from '@/app/UiComponents/feedback/loaders/FullscreenLoader';
import ReviewAttempts from './ReviewAttempts';
import { MdClose } from 'react-icons/md';
import SearchComponent from '@/app/UiComponents/formComponents/SearchComponent';

const AttemptDetailsComponent = ({ userId, testId }) => {
  return (
    <Box sx={{ p: 2 }}>
      <ReviewAttempts userId={userId} testId={testId} />
    </Box>
  );
};



const TestAttempts = ({ testId = 1 }) => {
  const [attempts, setAttempts] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
const [loading,setLoading]=useState(false)
const [filters,setFilters]=useState({})
useEffect(()=>{
async function getAttempts(){
  const extra=filters&&filters.staffId?`?userId=${filters.staffId}&`:""
  await getDataAndSet({url:`admin/courses/tests/${testId}/attempts${extra}`,setLoading,setData:setAttempts})
}
getAttempts()
},[testId,filters])
  // Handle URL search parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    
    if (userIdParam) {
      setSelectedUserId(parseInt(userIdParam));
      setDialogOpen(true);
    }
  }, []);

  const handleViewAttempts = (userId) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
    
    // Update URL with search parameters
    const url = new URL(window.location);
    url.searchParams.set('userId', userId);
    url.searchParams.set('testId', testId);
    window.history.pushState({}, '', url);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
    
    // Remove search parameters from URL
    const url = new URL(window.location);
    url.searchParams.delete('userId');
    url.searchParams.delete('testId');
    window.history.pushState({}, '', url);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'STUDENT':
        return 'primary';
      case 'INSTRUCTOR':
        return 'secondary';
      case 'ADMIN':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPassedColor = (passed) => {
    return passed ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Test #{testId} Attempts
      </Typography>
      {loading&&<FullScreenLoader/>}
      <Box>

             <SearchComponent
                apiEndpoint={`search?model=all-users-search`}
                setFilters={setFilters}
                inputLabel="Search staff by name or email"
                renderKeys={["name", "email","role"]}
                mainKey="name"
                searchKey={"staffId"}
                withParamsChange={true}
                
                />
                </Box>
      <TableContainer component={Paper} elevation={2}>
        
        <Table>
          
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaUser />
                  <Typography variant="subtitle2">User</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaEnvelope />
                  <Typography variant="subtitle2">Email</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Role</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaHashtag />
                  <Typography variant="subtitle2">Attempts</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Score</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Status</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Last Attempt</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attempts?.map((attempt) => (
              <TableRow 
                key={attempt.id} 
                sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {attempt.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {attempt.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {attempt.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={attempt.role} 
                    color={getRoleColor(attempt.role)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={attempt.attempts} 
                      color="info"
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {attempt.maxScore}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={attempt.passed ? 'Passed' : 'Failed'} 
                    color={getPassedColor(attempt.passed)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(attempt.lastAttempt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleViewAttempts(attempt.userId)}
                    color="primary"
                    size="small"
                  >
                    <FaEye />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Full-screen Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#ffffff'
          }
        }}
      >
        <DialogTitle>
          <IconButton onClick={handleCloseDialog} color='error.main'>
      <MdClose/>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AttemptDetailsComponent 
            userId={selectedUserId} 
            testId={testId}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TestAttempts;