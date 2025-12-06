import { DEPARTMENTS } from "@/app/helpers/constants";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Fade,
  IconButton,
  Stack,
  Typography,
  Grid,
  Tooltip,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import dayjs from "dayjs";
import { useState } from "react";
import {
  MdMoreVert,
  MdCheckCircle,
  MdBusiness,
  MdPerson,
  MdSchedule,
  MdAccessTime,
} from "react-icons/md";
import { NotesComponent } from "../../utility/Notes";
import DeleteModelButton from "../../../common/DeleteModelButton";
import { DepartmentManagementModal } from "./components/DepartmentManagementModal";
import { UpdateActionMenu } from "./components/UpdateActionMenu";

const getDepartmentConfig = (dept) =>
  DEPARTMENTS.find((d) => d.value === dept) || { label: dept, color: "#666" };

export const UpdateCard = ({
  update,
  onToggleArchive,
  onUpdate,
  currentUserDepartment,
  filter,
  isSimple,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const canManageDepartments = update?.createdById === user?.id || isAdmin;
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const mainDepartment = getDepartmentConfig(update.department);

  const userSharedUpdate = update?.sharedSettings?.find(
    (shared) => shared.type === currentUserDepartment
  );
  const adminSharedUpdate = isAdmin
    ? update?.sharedSettings?.find((shared) => shared.type === "ADMIN")
    : null;
  const isArchived = canManageDepartments
    ? adminSharedUpdate
      ? adminSharedUpdate.isArchived
      : update?.sharedSettings
          ?.filter((shared) => shared.type !== mainDepartment.type)
          .every((shared) => shared.isArchived)
    : userSharedUpdate?.isArchived;
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenNotes = () => {
    handleMenuClose();
    setNoteOpen(true);
  };

  const formatRelativeTime = (dateString) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.format("DD/MM/YYYY");
  };

  const getAuthorizedCount = () => {
    console.log(update, "update");
    return update?.sharedSettings?.length || 0;
  };

  if (filter && filter === "notArchived" && isArchived) {
    return;
  }
  return (
    <>
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)}>
        <DialogContent>
          <NotesComponent
            idKey={"updateId"}
            id={update.id}
            slug="shared"
            showAddNotes={true}
            isOpen={noteOpen}
            simpleButton={true}
            onClose={() => setNoteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Fade in={true}>
        <Card
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: update.isArchived ? "grey.300" : "grey.200",
            opacity: update.isArchived ? 0.85 : 1,
            transition: "all 0.3s ease",
            backgroundColor: `${mainDepartment.color}20`,
            "& .MuiCardContent-root": {
              padding: "12px !important",
            },
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={1}
            >
              <Box flex={1} mr={1}>
                <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      color: update.isArchived
                        ? "text.secondary"
                        : "text.primary",
                    }}
                  >
                    {update.title}
                  </Typography>
                </Box>

                {update.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      mb: 1.2,
                    }}
                  >
                    {update.description}
                  </Typography>
                )}
              </Box>

              {/* Three Dots Menu Button */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                  }}
                >
                  {canManageDepartments && (
                    <DeleteModelButton
                      item={update}
                      model={"ClientLeadUpdate"}
                      contentKey="title"
                      onDelete={() => {
                        // window.location.reload();
                        if (onUpdate) {
                          onUpdate(update); // Pass an empty object or handle as needed
                        } else {
                          console.log("onUpdate function is not provided");
                          window.location.reload();
                        }
                      }}
                      deleteModelesBeforeMain={[
                        { name: "Note", key: "updateId" },
                        { name: "SharedUpdate", key: "updateId" },
                      ]}
                    />
                  )}
                  <Tooltip title="More actions">
                    <IconButton
                      onClick={handleMenuOpen}
                      size="small"
                      sx={{
                        color: "text.secondary",
                        backgroundColor: "transparent",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          color: "text.primary",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <MdMoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
                {isArchived && (
                  <Chip
                    label="Done"
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<MdCheckCircle fontSize="small" />}
                    sx={{
                      height: 24,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Box mb={1.2}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 1 }}
              >
                Primary Department
              </Typography>
              <Chip
                icon={<MdBusiness />}
                label={mainDepartment.label}
                sx={{
                  backgroundColor: mainDepartment.color + "15",
                  color: mainDepartment.color,
                  fontWeight: 600,
                  border: `1px solid ${mainDepartment.color}30`,
                  fontSize: "0.85rem",
                  height: 32,
                }}
              />
            </Box>
            {canManageDepartments && (
              <Box mb={2.5}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    Shared Access ({getAuthorizedCount()}/
                    {DEPARTMENTS.length - 1} departments)
                  </Typography>
                  {canManageDepartments && (
                    <DepartmentManagementModal
                      onUpdate={onUpdate}
                      update={update}
                    />
                  )}
                </Box>
                {!isSimple && (
                  <>
                    {update?.sharedSettings &&
                    update?.sharedSettings?.length > 0 ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        gap={1}
                      >
                        {update?.sharedSettings
                          ?.slice(0, 4)
                          .map((shared, index) => {
                            const deptConfig = getDepartmentConfig(shared.type);
                            return (
                              <Chip
                                key={index}
                                avatar={
                                  <Avatar
                                    sx={{
                                      bgcolor: deptConfig.color + "20",
                                      color: deptConfig.color,
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <MdPerson fontSize="small" />
                                  </Avatar>
                                }
                                label={deptConfig.label}
                                variant="outlined"
                                size="small"
                                sx={{
                                  borderColor: deptConfig.color + "40",
                                  color: deptConfig.color,
                                  fontWeight: 500,
                                }}
                              />
                            );
                          })}
                        {update?.sharedSettings?.length > 4 && (
                          <Chip
                            label={`+${update.sharedSettings?.length - 4} more`}
                            variant="filled"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "grey.50",
                          borderRadius: 1,
                          border: "1px dashed",
                          borderColor: "grey.300",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ fontStyle: "italic" }}
                        >
                          No additional departments have access
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
            <Divider sx={{ my: 1.5 }} />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ pt: 1 }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ fontSize: "0.75rem" }}
                >
                  <MdSchedule fontSize="small" />
                  Created {formatRelativeTime(update.createdAt)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ fontSize: "0.75rem" }}
                >
                  <MdAccessTime fontSize="small" />
                  Updated {formatRelativeTime(update.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <UpdateActionMenu
        menuAnchorEl={menuAnchorEl}
        handleMenuClose={handleMenuClose}
        handleOpenNotes={handleOpenNotes}
        adminSharedUpdate={adminSharedUpdate}
        userSharedUpdate={userSharedUpdate}
        isArchived={isArchived}
        onToggleArchive={onToggleArchive}
        update={update}
        onUpdate={onUpdate}
        canManageDepartments={canManageDepartments}
      />
    </>
  );
};
