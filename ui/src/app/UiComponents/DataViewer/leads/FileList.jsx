import React, { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    Tabs,
    Tab,
    List,
    ListItem,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Chip,
    useTheme,
} from '@mui/material';
import {
    FaFileImage,
    FaFilePdf,
    FaDownload,
    FaEye,
} from 'react-icons/fa';
import {AddFiles, AddPriceOffers} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
const getFileType = (fileUrl) => {
    const extension = fileUrl.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (extension === 'pdf') return 'pdf';
    if (imageExtensions.includes(extension)) return 'image';
    return null;
};

// Function to get appropriate icon
const getFileTypeIcon = (fileUrl,theme) => {
    const fileType = getFileType(fileUrl);
    const iconStyle = {
        fontSize: '1.5rem',
        color: theme.palette.primary.main
    };

    return fileType === 'pdf' ?
          <FaFilePdf style={iconStyle} /> :
          <FaFileImage style={iconStyle} />;
};

const renderFilePreview = (file) => {
    const fileType = getFileType(file.url);

    if (fileType === 'image') {
        return (
              <Box sx={{ mt: 1 }}>
                  <img
                        src={file.url}
                        alt={file.name}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            objectFit: 'contain',
                            borderRadius: '4px'
                        }}
                  />
              </Box>
        );
    }

    if (fileType === 'pdf') {
        return (
              <Box sx={{ mt: 1 }}>
                  <iframe
                        src={file.url}
                        title={file.name}
                        width="100%"
                        height="200px"
                        style={{ border: 'none', borderRadius: '4px' }}
                  />
              </Box>
        );
    }

    return null;
};

const FileList = ({ lead,admin }) => {
    const [currentTab, setCurrentTab] = useState(0);
    const theme = useTheme();
const [files,setFiles]=useState(lead.files)
    const { userFiles, clientFiles } = useMemo(() => {
        return {
            userFiles: files?.filter(file => file.isUserFile),
            clientFiles: files?.filter(file => !file.isUserFile)
        };
    }, [files]);
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const cardStyles = {
        height: '100%',
        boxShadow: theme.shadows[3],
        '&:hover': {
            boxShadow: theme.shadows[6],
            transition: 'box-shadow 0.3s ease-in-out'
        }
    };

    const listItemStyles = {
        borderRadius: 1,
        mb: 2,
        bgcolor: 'background.paper',
        '&:hover': {
            bgcolor: theme.palette.grey[50],
            transition: 'background-color 0.2s ease-in-out'
        }
    };

    const renderFileList = (files) => (
          <List>
              {files.map((file) => {
                  const fileType = getFileType(file.url);
                  if (!fileType) return null;

                  return (
                        <ListItem
                              key={file.id}
                              sx={listItemStyles}
                        >
                            <Box sx={{ width: '100%', p: 2 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={2}>
                                        {getFileTypeIcon(file.url,theme)}
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                               Name: {file.name}
                                            </Typography>
                                            {file.description && (
                                                  <Typography variant="body2" color="textSecondary">
                                                    Description:  {file.description}
                                                  </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box display="flex" gap={1}>
                                        <Tooltip title="Preview">
                                            <IconButton
                                                  size="small"
                                                  onClick={() => window.open(file.url, '_blank')}
                                            >
                                                <FaEye />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                {renderFilePreview(file)}
                            </Box>
                        </ListItem>
                  );
              })}
          </List>
    );

    return (
          <Card sx={cardStyles}>
              <CardContent>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                      <Tabs value={currentTab} onChange={handleTabChange}>
                          <Tab
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        User Files
                                        <Chip
                                              label={userFiles.filter(file => getFileType(file.name)).length}
                                              size="small"
                                              color="primary"
                                        />
                                    </Box>
                                }
                          />
                          <Tab
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        Client Files
                                        <Chip
                                              label={clientFiles.filter(file => getFileType(file.name)).length}
                                              size="small"
                                              color="primary"
                                        />
                                    </Box>
                                }
                          />
                      </Tabs>
                  </Box>

                  {currentTab === 0 && (
                        <Box>
                            {!admin && <AddFiles lead={lead} setFiles={setFiles} />}
                            {userFiles.length === 0 ? (
                                  <Typography variant="body1" color="textSecondary" textAlign="center">
                                      No user files available
                                  </Typography>
                            ) : (
                                  renderFileList(userFiles)
                            )}
                        </Box>
                  )}
                  {currentTab === 1 && (
                        <Box>
                            {clientFiles.length === 0 ? (
                                  <Typography variant="body1" color="textSecondary" textAlign="center">
                                      No client files available
                                  </Typography>
                            ) : (
                                  renderFileList(clientFiles)
                            )}
                        </Box>
                  )}
              </CardContent>
          </Card>
    );
};

export default FileList;