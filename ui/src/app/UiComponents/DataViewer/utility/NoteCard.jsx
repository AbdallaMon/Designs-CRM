import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { MdAttachment, MdNote } from 'react-icons/md';

const NoteCard = ({ note }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1, 
        backgroundColor: '#fafafa',
        border: '1px solid #e0e0e0'
      }}
    >
      <CardContent sx={{ padding: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <MdNote sx={{ fontSize: 16, color: 'primary.main', mt: 0.25 }} />
          <Box flex={1}>
            {note.content && (
              <Typography 
                variant="body2" 
                sx={{ 
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                  mb: note.attachment ? 1 : 0
                }}
              >
                {note.content}
              </Typography>
            )}
            
            {note.attachment && (
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <MdAttachment sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // Handle attachment click - could be download or preview
                    window.open(note.attachment, '_blank');
                  }}
                >
                  View Attachment
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatDate(note.createdAt)}
          </Typography>
          {note.user && (
            <Chip 
              label={note.user.name || `User ${note.userId}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NoteCard;