import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  alpha,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AddExtraService,
  CallResultDialog,
  NewCallDialog,
  NewClientMeetingDialog,
  NewMeetingDialog,
} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiLink,
  RiShieldUserLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";
import { FaFileImage, FaFilePdf, FaEye, FaUser } from "react-icons/fa";
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
  Link as MuiLink,
} from "@mui/material";
import { Avatar } from "@mui/material";
import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import { Grid, Button } from "@mui/material";
import { FaMoneyBillWave, FaUserAlt, FaCalendarAlt } from "react-icons/fa";
import { AddPriceOffers } from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import {
  MdAttachFile,
  MdPsychology,
  MdQuestionAnswer,
  MdTouchApp,
} from "react-icons/md";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "./extra/DeleteModelButton";
import { SPAINQuestionsDialog } from "../meeting/SPAIN/SPAINQuestionDialog";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "../meeting/VERSA/VERSADialog";
import Link from "next/link";
import ContractManagement from "./extra/ContractManagement";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
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
      {!notUser && (
        <NewCallDialog
          lead={lead}
          setCallReminders={setCallReminders}
          setleads={setleads}
        />
      )}
      <Stack spacing={2}>
        {callReminders?.map((call) => {
          if (
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN" &&
            user.role !== "STAFF" &&
            user.role !== "SUPER_SALES" &&
            call.userId !== user.id
          ) {
            return;
          }
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
                    <Box>
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
                      {call.status !== "IN_PROGRESS" && (
                        <Typography variant="body2" fontWeight="600">
                          Done at ,{dayjs(call.updatedAt).format("DD/MM/YYYY")}
                        </Typography>
                      )}
                    </Box>
                    {user.role !== "ACCOUNTANT" && (
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
                    <DeleteModelButton
                      item={call}
                      model={"CallReminder"}
                      contentKey="reminderReason"
                      onDelete={() => {
                        setCallReminders((oldCalls) =>
                          oldCalls.filter((c) => c.id !== call.id)
                        );
                      }}
                    />
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
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: call.isAdmin ? 600 : 400,
                        color: call.isAdmin ? "#7B1FA2" : "inherit",
                      }}
                    >
                      {call.time
                        ? dayjs(call.time).format("MM/DD/YYYY, h:mm A")
                        : "No time selected"}
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

export function MeetingReminders({ lead, setleads, admin, notUser }) {
  const [meetingReminders, setMeetingReminders] = useState(
    lead?.meetingReminders
  );
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (lead?.meetingReminders) setMeetingReminders(lead.meetingReminders);
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

  const getMeetingTypeStyles = (type) => ({
    backgroundColor:
      {
        CONSULTATION: alpha(theme.palette.info.main, 0.1),
        FOLLOW_UP: alpha(theme.palette.secondary.main, 0.1),
        PRESENTATION: alpha(theme.palette.primary.main, 0.1),
        NEGOTIATION: alpha("#FF9800", 0.1), // Orange
        CLOSING: alpha("#4CAF50", 0.1), // Green
        OTHER: alpha(theme.palette.grey[500], 0.1),
      }[type] || alpha(theme.palette.grey[500], 0.1),
    color:
      {
        CONSULTATION: theme.palette.info.dark,
        FOLLOW_UP: theme.palette.secondary.dark,
        PRESENTATION: theme.palette.primary.dark,
        NEGOTIATION: "#E65100", // Dark Orange
        CLOSING: "#2E7D32", // Dark Green
        OTHER: theme.palette.grey[700],
      }[type] || theme.palette.grey[700],
    borderColor:
      {
        CONSULTATION: theme.palette.info.main,
        FOLLOW_UP: theme.palette.secondary.main,
        PRESENTATION: theme.palette.primary.main,
        NEGOTIATION: "#FF9800",
        CLOSING: "#4CAF50",
        OTHER: theme.palette.grey[300],
      }[type] || theme.palette.grey[300],
  });

  const formatMeetingType = (type) => {
    if (!type) return "General";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Stack spacing={3}>
      {!notUser && (
        <Box display="flex" gap={1.5}>
          <NewClientMeetingDialog
            lead={lead}
            setMeetingReminders={setMeetingReminders}
            setleads={setleads}
          />
          <Button
            variant="outlined"
            size="small"
            component={"a"}
            target="_blank"
            href="/dashboard/calendar?tab=1"
          >
            See admin available days
          </Button>
        </Box>
      )}
      <Stack spacing={2}>
        {meetingReminders?.map((call) => {
          if (
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN" &&
            user.role !== "STAFF" &&
            user.role !== "SUPER_SALES" &&
            call.userId !== user.id
          ) {
            return;
          }
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
                  borderColor: call.isAdmin
                    ? "#9C27B0"
                    : theme.palette.primary.main,
                },
                // Special styling for admin meetings
                ...(call.isAdmin && {
                  background: `linear-gradient(135deg, ${alpha(
                    "#9C27B0",
                    0.02
                  )} 0%, ${alpha("#9C27B0", 0.05)} 100%)`,
                  borderColor: alpha("#9C27B0", 0.3),
                }),
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Stack spacing={2}>
                    {/* Status and Type Chips Row */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        icon={
                          call.status === "DONE" ? (
                            <RiCheckboxCircleLine size={16} />
                          ) : (
                            <RiAlarmLine size={16} />
                          )
                        }
                        label={`# ${call.id}`}
                        sx={{
                          fontWeight: 600,
                          border: "1px solid",
                          "& .MuiChip-icon": {
                            color: "inherit",
                          },
                        }}
                      />
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

                      <Chip
                        size="small"
                        label={formatMeetingType(call.type)}
                        sx={{
                          ...getMeetingTypeStyles(call.type),
                          fontWeight: 600,
                          border: "1px solid",
                        }}
                      />

                      {/* Admin Tag */}
                      {call.isAdmin && (
                        <Chip
                          size="small"
                          icon={<RiShieldUserLine size={16} />}
                          label="ADMIN"
                          sx={{
                            backgroundColor: alpha("#9C27B0", 0.1),
                            color: "#7B1FA2",
                            borderColor: "#9C27B0",
                            fontWeight: 700,
                            border: "1px solid",
                            "& .MuiChip-icon": {
                              color: "#7B1FA2",
                            },
                          }}
                        />
                      )}

                      {call.token && (
                        <Chip
                          size="small"
                          icon={<RiLink size={16} />}
                          label="Client Link"
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.info.main,
                              0.1
                            ),
                            color: theme.palette.info.main,
                            fontWeight: 700,
                            border: `1px solid ${alpha(
                              theme.palette.info.main,
                              0.5
                            )}`,
                            "& .MuiChip-icon": {
                              color: theme.palette.info.main,
                            },
                          }}
                        />
                      )}
                    </Stack>

                    {/* Done Date */}
                    {call.status !== "IN_PROGRESS" && (
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="text.secondary"
                      >
                        Done at {dayjs(call.updatedAt).format("DD/MM/YYYY")}
                      </Typography>
                    )}

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {user.role !== "ACCOUNTANT" && (
                        <>
                          {call.status === "IN_PROGRESS" && (
                            <CallResultDialog
                              lead={lead}
                              setCallReminders={setMeetingReminders}
                              call={call}
                              setleads={setleads}
                              reminderType="MEETING"
                              text="Update meeting result"
                            />
                          )}
                        </>
                      )}
                      {call.token && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 1, flexWrap: "wrap" }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Client Link:
                          </Typography>
                          <Typography
                            variant="body2"
                            color="primary"
                            sx={{ wordBreak: "break-all" }}
                          >
                            {`${window.location.origin}/booking?token=${call.token}`}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${window.location.origin}/booking?token=${call.token}`
                              )
                            }
                          >
                            Copy
                          </Button>
                        </Stack>
                      )}

                      <DeleteModelButton
                        item={call}
                        model={"MeetingReminder"}
                        contentKey="reminderReason"
                        onDelete={() => {
                          setMeetingReminders((oldCalls) =>
                            oldCalls.filter((c) => c.id !== call.id)
                          );
                        }}
                      />
                    </Stack>
                  </Stack>

                  {/* User Info */}
                  <Stack direction="column" spacing={1} alignItems="flex-end">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RiUserLine
                        size={16}
                        color={theme.palette.text.secondary}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {call.user.name}
                      </Typography>
                    </Stack>

                    {/* Admin Info (if admin meeting) */}
                    {call.isAdmin && call.admin && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <RiShieldUserLine size={16} color="#9C27B0" />
                        <Typography
                          variant="body2"
                          sx={{ color: "#7B1FA2", fontWeight: 600 }}
                        >
                          Admin: {call.admin.name}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>

                {call.status === "IN_PROGRESS" && (
                  <InProgressCall call={call} type="MEETING" />
                )}

                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiCalendarLine
                      size={18}
                      color={
                        call.isAdmin ? "#9C27B0" : theme.palette.primary.main
                      }
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: call.isAdmin ? 600 : 400,
                        color: call.isAdmin ? "#7B1FA2" : "inherit",
                      }}
                    >
                      {dayjs(call.time).format("MM/DD/YYYY, h:mm A")}
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      bgcolor: call.isAdmin
                        ? alpha("#9C27B0", 0.03)
                        : alpha(theme.palette.background.default, 0.6),
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${
                        call.isAdmin
                          ? alpha("#9C27B0", 0.2)
                          : theme.palette.divider
                      }`,
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

                  {call.meetingResult && (
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
                        {call.meetingResult}
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
      <MuiLink href={file.url} target="_blank" rel="noopener noreferrer">
        Open {fileType.toUpperCase()} File
      </MuiLink>
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
                  <DeleteModelButton
                    item={file}
                    model={"File"}
                    contentKey="name"
                    onDelete={() => {
                      setFiles((oldFiles) =>
                        oldFiles.filter((f) => f.id !== file.id)
                      );
                    }}
                  />
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
            {!notUser && <AddFiles lead={lead} setFiles={setFiles} />}
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
      {!notUser && <NewNoteDialog lead={lead} setNotes={setNotes} />}
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
                <DeleteModelButton
                  item={note}
                  model={"Note"}
                  contentKey="content"
                  onDelete={() => {
                    setNotes((oldNotes) =>
                      oldNotes.filter((n) => n.id !== note.id)
                    );
                  }}
                />
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
    p: 0,
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
      <CardContent>
        <ContractManagement leadId={lead.id} />

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
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
          {!notUser && (
            <AddPriceOffers lead={lead} setPriceOffers={setOffers} />
          )}
        </Box>
        <List>
          {offers?.map((offer) => (
            <ListItem key={offer.id} sx={listItemStyles} disablePadding>
              <Box sx={{ width: "100%", p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <DeleteModelButton
                    item={offer}
                    model={"PriceOffers"}
                    contentKey={offer.note ? "note" : "url"}
                    onDelete={() => {
                      setOffers((oldOffers) =>
                        oldOffers.filter((o) => o.id !== offer.id)
                      );
                    }}
                  />
                  <PriceOfferSwitch
                    priceOffer={offer}
                    setPriceOffers={setOffers}
                  />
                  {offer.url && (
                    <Button
                      variant="outlined"
                      component="a"
                      href={offer.url}
                      target="_blank"
                    >
                      Preview attachment
                    </Button>
                  )}
                </Box>
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
function PriceOfferSwitch({ priceOffer, setPriceOffers }) {
  const [checked, setChecked] = React.useState(priceOffer.isAccepted);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const handleChange = async (event) => {
    const request = await handleRequestSubmit(
      { priceOfferId: priceOffer.id, isAccepted: event.target.checked },
      setLoading,
      `shared/client-lead/price-offers/change-status`,
      false,
      "Updating"
    );
    if (request.status === 200) {
      setChecked(request.data.isAccepted);
      if (setPriceOffers) {
        setPriceOffers((oldPrices) =>
          oldPrices.map((offer) => {
            if (offer.id === priceOffer.id) {
              offer.isAccepted = checked;
            }
            return offer;
          })
        );
      }
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body1" color="textPrimary">
        {checked ? "Offer Accepted" : "Accept Offer"}
      </Typography>
      <Tooltip title="Toggle to accept or reject the price offer">
        <Switch
          checked={checked}
          onChange={handleChange}
          inputProps={{ "aria-label": "Accept Price Offer" }}
          disabled={
            user.role !== "STAFF" &&
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN" &&
            user.role !== "SUPER_SALES"
          }
        />
      </Tooltip>
    </Box>
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
      {!notUser && (
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
                  <DeleteModelButton
                    item={service}
                    model={"ExtraService"}
                    contentKey={service.note ? "note" : "price"}
                    onDelete={() => {
                      setExtraServices((oldServices) =>
                        oldServices.filter((s) => s.id !== service.id)
                      );
                    }}
                  />
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

export function OurCostAndContractorCost({ lead, setLead }) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

  const handleUpload = async (file, type) => {
    if (!file) {
      setAlertError("Please select a file.");
      return;
    }

    setLoading(true);
    const fileUpload = await uploadInChunks(file, setProgress, setOverlay);

    if (fileUpload.status === 200) {
      const fileUrl = fileUpload.url;

      const updateData = {
        [type]: fileUrl,
      };

      const updateResponse = await handleRequestSubmit(
        updateData,
        setLoading,
        `shared/work-stages/${lead.id}/cost`,
        false,
        "Updating Lead",
        false,
        "PUT"
      );

      if (updateResponse.status === 200) {
        setLead((prevLead) => ({
          ...prevLead,
          [type]: fileUrl,
        }));
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2, borderLeft: "6px solid #1976d2" }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
      >
        Cost Documents
      </Typography>

      <Stack spacing={3}>
        {/* Our Cost */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1">Our Cost:</Typography>
          {lead.ourCost ? (
            <Button
              href={lead.ourCost}
              target="_blank"
              variant="contained"
              color="primary"
              startIcon={<MdAttachFile />}
            >
              View File
            </Button>
          ) : (
            <>
              <SimpleFileInput
                label="File"
                id="file"
                handleUpload={(file) => handleUpload(file, "ourCost")}
                variant="outlined"
              />
            </>
          )}
        </Box>

        {/* Contractor Cost */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1">Contractor Cost:</Typography>
          {lead.contractorCost ? (
            <Button
              href={lead.contractorCost}
              target="_blank"
              variant="contained"
              color="success"
              startIcon={<MdAttachFile />}
            >
              View File
            </Button>
          ) : (
            <>
              <SimpleFileInput
                label="File"
                id="file"
                handleUpload={(file) => handleUpload(file, "contractorCost")}
                variant="outlined"
              />
            </>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export function SalesToolsTabs({ lead, setLead, setleads }) {
  const { user } = useAuth();
  const [personality, setPersonality] = useState(lead.personality);
  const { setLoading } = useToastContext();
  const isAdmin = checkIfAdmin(user);

  const handleChange = async (event) => {
    setPersonality(event.target.value);
    await handleChangePersonality(event.target.value);
  };
  async function handleChangePersonality(personality) {
    const request = await handleRequestSubmit(
      { personality },
      setLoading,
      `shared/lead/update/${lead.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (setleads) {
        setleads((oldleads) =>
          oldleads.map((l) => {
            if (l.id === lead.id) {
              return { ...l, personality };
            }
            return l;
          })
        );
      }
      if (setLead) {
        setLead({ ...lead, personality });
      }
    }
  }
  if (!isAdmin && user.role !== "STAFF") {
    return (
      <Alert severity="error">You are not allowed to access this tab </Alert>
    );
  }
  return (
    <Box sx={{ width: "100%", maxWidth: 1200, margin: "0 auto", p: 2 }}>
      <Grid container spacing={3}>
        <Grid size={{ md: 6 }}>
          <Card
            sx={{
              height: "100%",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <MdQuestionAnswer size={48} style={{ marginBottom: 16 }} />
              <Typography
                variant="h5"
                component="h3"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                SPIN Questions
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, fontSize: "0.9rem" }}
              >
                سؤال اسبين
              </Typography>
              <SPAINQuestionsDialog clientLeadId={lead.id} />
            </CardContent>
          </Card>
        </Grid>
        {user.role === "STAFF" && !user.isPrimary ? null : (
          <Grid size={{ md: 6 }}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <MdTouchApp size={48} style={{ marginBottom: 16 }} />
                <Typography
                  variant="h5"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  VERSA Objections
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, fontSize: "0.9rem" }}
                >
                  نموذج الاعتراضات
                </Typography>
                <VersaObjectionSystem clientLeadId={lead.id} />
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ md: 6 }}>
          <Card
            sx={{
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <FaUser size={48} style={{ marginBottom: 16 }} />
              <Typography
                variant="h5"
                component="h3"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Client Personality
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 3, fontSize: "0.9rem", opacity: 0.9 }}
              >
                شخصية العميل
              </Typography>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="personality-select-label">
                  {personality ? "Change" : "Select"} Personality
                </InputLabel>
                <Select
                  labelId="personality-select-label"
                  value={personality}
                  label="Select Personality"
                  onChange={async (e) => await handleChange(e)}
                  displayEmpty
                >
                  {Object.entries(personalityEnum).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
