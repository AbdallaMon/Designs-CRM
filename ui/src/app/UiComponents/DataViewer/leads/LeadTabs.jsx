import React, { useEffect, useState, useMemo } from "react";
import {
  alpha,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AddExtraService,
  CallResultDialog,
  NewCallDialog,
} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";
import { FaFileImage, FaFilePdf, FaEye } from "react-icons/fa";
import { AddFiles } from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Link,
} from "@mui/material";
import { Avatar } from "@mui/material";
import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import { Grid2 as Grid, Button } from "@mui/material";
import { FaMoneyBillWave, FaUserAlt, FaCalendarAlt } from "react-icons/fa";
import { AddPriceOffers } from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
export function CallReminders({ lead, setleads, admin, notUser }) {
  const [callReminders, setCallReminders] = useState(lead?.callReminders);
  const theme = useTheme();
  const { user } = useAuth();
  useEffect(() => {
    if (lead?.callReminders) setCallReminders(lead.callReminders);
  }, [lead]);

  const getStatusStyles = (status) => ({
    backgroundColor:
      {
        IN_PROGRESS: alpha(theme.palette.warning.main, 0.1),
        DONE: alpha(theme.palette.success.main, 0.1),
      }[status] || alpha(theme.palette.grey[500], 0.1),
    color:
      {
        IN_PROGRESS: theme.palette.warning.dark,
        DONE: theme.palette.success.dark,
      }[status] || theme.palette.grey[700],
    borderColor:
      {
        IN_PROGRESS: theme.palette.warning.main,
        DONE: theme.palette.success.main,
      }[status] || theme.palette.grey[300],
  });

  return (
    <Stack spacing={3}>
      {!admin && !notUser && (
        <NewCallDialog
          lead={lead}
          setCallReminders={setCallReminders}
          setleads={setleads}
        />
      )}
      <Stack spacing={2}>
        {callReminders?.map((call) => {
          //   if (
          //     user.role !== "ADMIN" &&
          //     user.role !== "SUPERVISOR" &&
          //     call.userId !== user.id
          //   ) {
          //     return;
          //   }
          return (
            <Paper
              key={call.id}
              elevation={0}
              sx={{
                position: "relative",
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.shadows[4],
                  transform: "translateY(-2px)",
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      size="small"
                      icon={
                        call.status === "DONE" ? (
                          <RiCheckboxCircleLine size={16} />
                        ) : (
                          <RiAlarmLine size={16} />
                        )
                      }
                      label={call.status.replace(/_/g, " ")}
                      sx={{
                        ...getStatusStyles(call.status),
                        fontWeight: 600,
                        border: "1px solid",
                        "& .MuiChip-icon": {
                          color: "inherit",
                        },
                      }}
                    />
                    {!admin && user.role !== "ACCOUNTANT" && (
                      <>
                        {call.status === "IN_PROGRESS" && (
                          <CallResultDialog
                            lead={lead}
                            setCallReminders={setCallReminders}
                            call={call}
                            setleads={setleads}
                          />
                        )}
                      </>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiUserLine
                      size={16}
                      color={theme.palette.text.secondary}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {call.user.name}
                    </Typography>
                  </Stack>
                </Stack>
                {call.status === "IN_PROGRESS" && (
                  <InProgressCall call={call} />
                )}
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiCalendarLine
                      size={18}
                      color={theme.palette.primary.main}
                    />
                    <Typography variant="subtitle2">
                      {dayjs(call.time).format("MM/DD/YYYY, h:mm A")}
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.background.default, 0.6),
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      <Box component="span" fontWeight="600">
                        Reason:
                      </Box>{" "}
                      {call.reminderReason}
                    </Typography>
                  </Box>
                  {call.callResult && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(
                          theme.palette.success.main,
                          0.1
                        )}`,
                      }}
                    >
                      <Typography variant="body2" color="success.dark">
                        <Box component="span" fontWeight="600">
                          Result:
                        </Box>{" "}
                        {call.callResult}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}

const getFileType = (fileUrl) => {
  const extension = fileUrl.split(".").pop().toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  const videoExtensions = ["mp4", "mov", "avi", "mkv"];
  const excelExtensions = ["xls", "xlsx"];

  if (imageExtensions.includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (videoExtensions.includes(extension)) return "video";
  if (excelExtensions.includes(extension)) return "excel";
  return "";
};

// Function to get appropriate icon
const getFileTypeIcon = (fileUrl, theme) => {
  const fileType = getFileType(fileUrl);
  const iconStyle = {
    fontSize: "1.5rem",
    color: theme.palette.primary.main,
  };

  return fileType === "pdf" ? (
    <FaFilePdf style={iconStyle} />
  ) : (
    <FaFileImage style={iconStyle} />
  );
};

const renderFilePreview = (file) => {
  const fileType = getFileType(file.url);

  if (fileType === "image") {
    return (
      <Box sx={{ mt: 1 }}>
        <img
          src={file.url}
          alt={file.name}
          style={{
            maxWidth: "100%",
            maxHeight: "200px",
            objectFit: "contain",
            borderRadius: "4px",
          }}
        />
      </Box>
    );
  }
  return (
    <Box sx={{ mt: 1 }}>
      <Link href={file.url} target="_blank" rel="noopener noreferrer">
        Open {fileType.toUpperCase()} File
      </Link>
    </Box>
  );
};

export function FileList({ lead, admin, notUser }) {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const [files, setFiles] = useState(lead.files);
  const { userFiles, clientFiles } = useMemo(() => {
    return {
      userFiles: files?.filter((file) => file.isUserFile),
      clientFiles: files?.filter((file) => !file.isUserFile),
    };
  }, [files]);
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };
  const renderFileList = (files) => (
    <List>
      {files.map((file) => {
        return (
          <ListItem key={file.id} sx={listItemStyles}>
            <Box sx={{ width: "100%", p: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {getFileTypeIcon(file.url, theme)}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Name: {file.name}
                    </Typography>
                    {file.description && (
                      <Typography variant="body2" color="textSecondary">
                        Description: {file.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title="Preview">
                    <IconButton
                      size="small"
                      onClick={() => window.open(file.url, "_blank")}
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
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  User Files
                  <Chip label={userFiles.length} size="small" color="primary" />
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Client Files
                  <Chip
                    label={clientFiles.length}
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
            {!admin && !notUser && <AddFiles lead={lead} setFiles={setFiles} />}
            {userFiles.length === 0 ? (
              <Typography
                variant="body1"
                color="textSecondary"
                textAlign="center"
              >
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
              <Typography
                variant="body1"
                color="textSecondary"
                textAlign="center"
              >
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
}

export function LeadNotes({ lead, admin, notUser }) {
  const [notes, setNotes] = useState(lead?.notes);
  const theme = useTheme();
  useEffect(() => {
    if (lead?.notes) setNotes(lead.notes);
  }, [lead]);
  return (
    <Stack spacing={2}>
      {!admin && !notUser && <NewNoteDialog lead={lead} setNotes={setNotes} />}
      <Stack spacing={2}>
        {notes?.map((note) => (
          <Paper
            key={note.id}
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              "&:hover": {
                boxShadow: theme.shadows[2],
                transition: "box-shadow 0.3s ease-in-out",
              },
            }}
          >
            <Stack spacing={1}>
              <Typography
                variant="body1"
                sx={{
                  wordWrap: "break-word",
                }}
              >
                {note.content}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: theme.palette.primary.main,
                    fontSize: "0.75rem",
                  }}
                >
                  {note.user.name[0]}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {note.user.name} •{" "}
                  {dayjs(note.createdAt).format("MM/DD/YYYY")}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

export function PriceOffersList({ admin, lead, notUser }) {
  const [offers, setOffers] = useState(lead.priceOffers);
  const theme = useTheme();

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
    position: "relative",
    p: 2,
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };

  const iconStyles = {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
    fontSize: "1.2rem",
  };
  return (
    <Card sx={cardStyles}>
      {!admin && !notUser && (
        <AddPriceOffers lead={lead} setPriceOffers={setOffers} />
      )}

      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <FaMoneyBillWave style={{ ...iconStyles, fontSize: "1.5rem" }} />
          <Typography variant="h5" component="h2" color="primary">
            Price Offers
          </Typography>
          <Chip
            label={`${offers?.length || 0} offers`}
            size="small"
            sx={{ ml: 2 }}
            color="primary"
          />
        </Box>

        <List>
          {offers?.map((offer) => (
            <ListItem key={offer.id} sx={listItemStyles} disablePadding>
              <Box sx={{ width: "100%", p: 2 }}>
                {offer.url && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="outlined"
                      component="a"
                      href={offer.url}
                      target="_blank"
                    >
                      Preview attachment
                    </Button>
                  </Box>
                )}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box display="flex" alignItems="center">
                      <Tooltip title="Added By">
                        <IconButton size="small">
                          <FaUserAlt style={iconStyles} />
                        </IconButton>
                      </Tooltip>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Added By
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {offer.user.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box display="flex" alignItems="center">
                      <Tooltip title="Created Date">
                        <IconButton size="small">
                          <FaCalendarAlt style={iconStyles} />
                        </IconButton>
                      </Tooltip>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Created At
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dayjs(offer.createdAt).format("YYYY-MM-DD HH:mm")}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  {offer.minPrice && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box display="flex" alignItems="center">
                        <Tooltip title="Price Range">
                          <IconButton size="small">
                            <FaMoneyBillWave style={iconStyles} />
                          </IconButton>
                        </Tooltip>
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Price Range (AED)
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {offer.minPrice.toLocaleString()} -{" "}
                            {offer.maxPrice.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {offer.note && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Tooltip title="Note">
                          <IconButton size="small">
                            <FaMoneyBillWave style={iconStyles} />
                          </IconButton>
                        </Tooltip>
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Note
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {offer.note}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export function ExtraServicesList({ admin, lead, notUser, setPayments }) {
  const [extraServices, setExtraServices] = useState(lead.extraServices);
  const theme = useTheme();

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
    position: "relative",
    p: 2,
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };

  const iconStyles = {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
    fontSize: "1.2rem",
  };
  return (
    <Card sx={cardStyles}>
      {!admin && !notUser && (
        <AddExtraService
          lead={lead}
          setExtraServices={setExtraServices}
          setPayments={setPayments}
        />
      )}

      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <FaMoneyBillWave style={{ ...iconStyles, fontSize: "1.5rem" }} />
          <Typography variant="h5" component="h2" color="primary">
            Extra services
          </Typography>
          <Chip
            label={`${extraServices?.length || 0} services`}
            size="small"
            sx={{ ml: 2 }}
            color="primary"
          />
        </Box>

        <List>
          {extraServices?.map((service) => (
            <ListItem key={service.id} sx={listItemStyles} disablePadding>
              <Box sx={{ width: "100%", p: 2 }}>
                <Grid container spacing={3}>
                  {service.note && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Note
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {service.note}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {service.price && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Price
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {service.price}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
