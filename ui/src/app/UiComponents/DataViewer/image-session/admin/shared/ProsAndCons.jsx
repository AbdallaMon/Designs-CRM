import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Divider,
  Chip,
  Paper,
  Grid2 as Grid,
  useTheme,
} from "@mui/material";
import {
  MdThumbUp as ThumbUp,
  MdThumbDown as ThumbDown,
  MdAdd as Add,
  MdDelete as Delete,
  MdEdit as Edit,
  MdSave as Save,
  MdCancel as Cancel,
  MdDragIndicator as DragIndicator,
  MdVisibility as Visibility,
  MdExpandMore as ExpandMore,
  MdExpandLess as ExpandLess,
  MdVisibility,
  MdThumbUp,
  MdThumbDown,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { CreateTitleOrDesc } from "./CreateTitleOrDesc";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import RenderTitle from "./RenderTitle";
import { EditTitleOrDescFields } from "./EditTitleOrDesc";

const AddNewItem = ({ type, onAdd, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState();
  const { languages } = useLanguage();
  const { setAlertError } = useAlertContext();
  const handleAdd = async () => {
    const allFilled = languages.every((lng) =>
      item.descriptions?.[lng.id]?.text?.trim()
    );
    if (allFilled) {
      await onAdd(item, type);
      setItem(null);
      setIsOpen(false);
    } else {
      setAlertError("Please fill the data in all language");
    }
  };

  const isPro = type === "PRO";

  return (
    <Card
      sx={{
        mb: 2,
        border: `2px dashed ${isPro ? "#4caf50" : "#f44336"}`,
        borderRadius: 2,
        backgroundColor: isPro ? "#f1f8e9" : "#fce4ec",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {!isOpen ? (
          <Button
            fullWidth
            startIcon={<Add />}
            onClick={() => setIsOpen(true)}
            sx={{
              color: isPro ? "#4caf50" : "#f44336",
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            Add New {isPro ? "Pro" : "Con"}
          </Button>
        ) : (
          <Box>
            <CreateTitleOrDesc
              data={item}
              setData={setItem}
              type="DESCRIPTION"
            />
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                onClick={() => {
                  setIsOpen(false);
                }}
                size="small"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                variant="contained"
                size="small"
                disabled={isLoading}
                sx={{
                  backgroundColor: isPro ? "#4caf50" : "#f44336",
                  "&:hover": {
                    backgroundColor: isPro ? "#45a049" : "#da190b",
                  },
                }}
              >
                Add {isPro ? "Pro" : "Con"}
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const ProConItem = ({
  item,
  type,
  isEditing,
  onDelete,
  onSave,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  lng,
}) => {
  const [editContent, setEditContent] = useState();
  const [isEditMode, setIsEditMode] = useState(false);
  const handleEdit = () => {
    setIsEditMode(true);
    setEditContent(item.content[0]?.text || "");
  };

  const handleSave = async () => {
    await onSave(item.id, editContent);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditContent(item.content[0]?.text || "");
  };

  const isPro = type === "PRO";

  return (
    <Card
      sx={{
        mb: 2,
        border: `2px solid ${isPro ? "#4caf50" : "#f44336"}`,
        borderRadius: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: `0 4px 20px ${
            isPro ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)"
          }`,
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              backgroundColor: isPro ? "#e8f5e8" : "#ffebee",
              color: isPro ? "#4caf50" : "#f44336",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 40,
              height: 40,
            }}
          >
            {isPro ? <ThumbUp /> : <ThumbDown />}
          </Box>

          <Box flex={1}>
            {isEditMode ? (
              <EditTitleOrDescFields
                initialData={item.content}
                data={editContent}
                setData={setEditContent}
                type="DESCRIPTIONS"
              />
            ) : (
              <>
                {lng && !isEditing ? (
                  <Typography
                    sx={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      wordBreak: "break-all",
                    }}
                    variant="body2"
                  >
                    {item.content[0].content}
                  </Typography>
                ) : (
                  <RenderTitle titles={item.content} type="DESCRIPTIONS" />
                )}
              </>
            )}
          </Box>

          {isEditing && (
            <Box display="flex" flexDirection="column" gap={0.5}>
              {isEditMode ? (
                <>
                  <IconButton size="small" onClick={handleSave} color="primary">
                    <Save />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={handleEdit}>
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(item.id, type)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                  <Divider sx={{ my: 0.5 }} />
                  <IconButton
                    size="small"
                    onClick={() => onMoveUp(item.id, type)}
                    disabled={!canMoveUp}
                  >
                    <ExpandLess />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onMoveDown(item.id, type)}
                    disabled={!canMoveDown}
                  >
                    <ExpandMore />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const ProsConsDialog = ({
  open,
  onClose,
  type,
  materialId,
  styleId,
  isEditing = false,
  lng,
}) => {
  const [pros, setPros] = useState([]);
  const [cons, setCons] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loading: saving, setLoading: setSaving } = useToastContext();
  const id = materialId || styleId;
  const [isOrderDirty, setIsOrderDirty] = useState();
  useEffect(() => {
    if (open && id) {
      loadProsAndCons();
    }
  }, [open, id, type]);

  const loadProsAndCons = async () => {
    const req = await getData({
      url: `client/image-session/pros-and-cons?type=${type}&id=${id}&lng=${lng}&isClient=${!isEditing}&`,
      setLoading,
    });
    if (req.status === 200) {
      setCons(req.data.cons);
      setPros(req.data.pros);
    }
  };

  const handleAdd = async (item, itemType) => {
    const req = await handleRequestSubmit(
      { type, id, item, itemType },
      setSaving,
      `admin/image-session/pros-and-cons`,
      false,
      "Saving"
    );
    if (req.status === 200) {
      await loadProsAndCons();
    }
  };

  const handleDelete = async (id, itemType) => {
    const req = await handleRequestSubmit(
      { id: id, itemType: itemType },
      setSaving,
      `admin/image-session/pros-and-cons/${id}`,
      false,
      "Saving",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      await loadProsAndCons();
    }
  };

  const handleSave = async (id, item, itemType) => {
    const req = await handleRequestSubmit(
      { id, item, itemType },
      setSaving,
      `admin/image-session/pros-and-cons/${id}`,
      false,
      "Saving",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await loadProsAndCons();
    }
  };

  const moveUp = (proId, itemType) => {
    let list = itemType === "PRO" ? pros : cons;

    const currentIndex = list.findIndex((p) => p.id === proId);
    if (currentIndex > 0) {
      const newList = [...list];

      // Update order before swapping
      const aboveOrder = newList[currentIndex - 1].order;
      newList[currentIndex].order = aboveOrder - 1;

      // Swap positions visually
      [newList[currentIndex], newList[currentIndex - 1]] = [
        newList[currentIndex - 1],
        newList[currentIndex],
      ];

      if (itemType === "PRO") {
        setPros(newList);
      } else {
        setCons(newList);
      }

      setIsOrderDirty(itemType);
    }
  };

  const moveDown = (proId, itemType) => {
    let list = itemType === "PRO" ? pros : cons;
    const currentIndex = list.findIndex((p) => p.id === proId);

    if (currentIndex < list.length - 1) {
      const newList = [...list];

      // Update order of the item to move down (before swapping)
      const belowOrder = newList[currentIndex + 1].order;
      newList[currentIndex].order = belowOrder + 1;

      // Swap positions
      [newList[currentIndex], newList[currentIndex + 1]] = [
        newList[currentIndex + 1],
        newList[currentIndex],
      ];

      if (itemType === "PRO") {
        setPros(newList);
      } else {
        setCons(newList);
      }

      setIsOrderDirty(itemType);
    }
  };

  const handleSaveOrder = async (item, itemType) => {
    console.log(pros, "pros");
    const req = await handleRequestSubmit(
      { itemType: isOrderDirty, data: isOrderDirty === "PRO" ? pros : cons },
      setSaving,
      `admin/image-session/pros-and-cons/order/`,
      false,
      "Saving"
    );

    if (req.status === 200) {
      setIsOrderDirty(null);
      await loadProsAndCons(); // reload for consistency
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" component="div">
            {lng === "ar" ? "المميزات & العيوب" : "Pros & Cons"}
          </Typography>
          {isEditing && (
            <Chip
              label={isEditing ? "Edit Mode" : "View Mode"}
              color={isEditing ? "primary" : "default"}
              icon={isEditing ? <Edit /> : <Visibility />}
            />
          )}
        </Box>
        {isEditing && (
          <Typography variant="subtitle2" color="text.secondary">
            {type} ID: {id}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {isEditing && isOrderDirty && (
          <Box textAlign="center" mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveOrder}
              disabled={saving}
            >
              Save Order
            </Button>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading pros and cons...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: "2px solid #4caf50",
                  borderRadius: 2,
                  backgroundColor: "#f1f8e9",
                  height: "fit-content",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ThumbUp sx={{ color: "#4caf50" }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#4caf50", fontWeight: "bold" }}
                  >
                    {lng === "ar" ? "المميزات" : "Pros"} ({pros.length})
                  </Typography>
                </Box>

                {pros.map((pro, index) => (
                  <ProConItem
                    key={pro.id}
                    item={pro}
                    type="PRO"
                    isEditing={isEditing}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                    onSave={handleSave}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    canMoveUp={index > 0}
                    canMoveDown={index < pros.length - 1}
                    isOrderDirty={isOrderDirty}
                    lng={lng}
                  />
                ))}

                {isEditing && (
                  <AddNewItem type="PRO" onAdd={handleAdd} isLoading={saving} />
                )}

                {pros.length === 0 && !isEditing && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    py={2}
                  >
                    No pros listed yet
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Cons Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: "2px solid #f44336",
                  borderRadius: 2,
                  backgroundColor: "#fce4ec",
                  height: "fit-content",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ThumbDown sx={{ color: "#f44336" }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#f44336", fontWeight: "bold" }}
                  >
                    {lng === "ar" ? "العيوب" : "Cons"}({cons.length})
                  </Typography>
                </Box>

                {cons.map((con, index) => (
                  <ProConItem
                    key={con.id}
                    item={con}
                    type="CON"
                    isEditing={isEditing}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                    onSave={handleSave}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    canMoveUp={index > 0}
                    canMoveDown={index < cons.length - 1}
                    lng={lng}
                  />
                ))}

                {isEditing && (
                  <AddNewItem type="CON" onAdd={handleAdd} isLoading={saving} />
                )}

                {cons.length === 0 && !isEditing && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    py={2}
                  >
                    No cons listed yet
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Example usage component
const ProsAndConsDialogButton = ({
  isEditing = false,
  type,
  materialId,
  styleId,
  customStyle,
  lng = "en",
}) => {
  const [open, setOpen] = useState(false);
  const label = isEditing
    ? lng === "ar"
      ? "تعديل المميزات والعيوب"
      : "Edit Pros & Cons"
    : lng === "ar"
    ? "عرض المميزات والعيوب"
    : "View Pros & Cons";
  return (
    <Box>
      {customStyle ? (
        <Button
          variant="contained"
          sx={customStyle}
          onClick={() => {
            setOpen(true);
          }}
        >
          {label}
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={() => {
            setOpen(true);
          }}
          sx={(theme) => ({
            position: "relative",
            overflow: "hidden",
            minWidth: 200,
            height: 48,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.error.main} 100%)`,
            backgroundSize: "200% 100%",
            backgroundPosition: "100% 0",
            color: theme.palette.primary.contrastText,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[4],
            transition: theme.transitions.create(["all"], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),

            // Shimmer effect
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}30, transparent)`,
              transition: theme.transitions.create(["left"], {
                duration: theme.transitions.duration.complex,
                easing: theme.transitions.easing.easeOut,
              }),
            },

            // Pros/Cons indicators
            "&::after": {
              content: '""',
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 24,
              height: 24,
              background: `linear-gradient(45deg, ${theme.palette.success.main} 50%, ${theme.palette.error.main} 50%)`,
              borderRadius: "50%",
              opacity: 0.8,
              transition: theme.transitions.create(["all"], {
                duration: theme.transitions.duration.short,
                easing: theme.transitions.easing.easeInOut,
              }),
            },

            "&:hover": {
              backgroundPosition: "0% 0",
              boxShadow: theme.shadows[8],
              transform: "translateY(-2px)",

              "&::before": {
                left: "100%",
              },

              "&::after": {
                transform: "translateY(-50%) scale(1.1)",
                opacity: 1,
              },
            },

            "&:active": {
              transform: "translateY(0px)",
              boxShadow: theme.shadows[2],
            },

            // Pulse animation on focus
            "&:focus": {
              animation: "pulse 2s infinite",
            },

            "@keyframes pulse": {
              "0%": {
                boxShadow: theme.shadows[4],
              },
              "50%": {
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
              },
              "100%": {
                boxShadow: theme.shadows[4],
              },
            },

            // Loading state (optional)
            "&.loading": {
              pointerEvents: "none",
              "&::before": {
                animation: "shimmer 1.5s infinite",
              },
            },

            "@keyframes shimmer": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" },
            },

            // Dark mode adaptations
            ...(theme.palette.mode === "dark" && {
              "&::before": {
                background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}20, transparent)`,
              },
              "@keyframes pulse": {
                "0%": {
                  boxShadow: theme.shadows[4],
                },
                "50%": {
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}60`,
                },
                "100%": {
                  boxShadow: theme.shadows[4],
                },
              },
            }),
          })}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="button" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Box
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                opacity: 0.9,
                fontSize: "0.75rem",
              })}
            >
              <MdThumbUp
                sx={(theme) => ({
                  fontSize: 14,
                  color: theme.palette.success.main,
                })}
              />
              <MdThumbDown
                sx={(theme) => ({
                  fontSize: 14,
                  color: theme.palette.error.main,
                })}
              />
            </Box>
          </Box>
        </Button>
      )}
      <ProsConsDialog
        open={open}
        onClose={() => setOpen(false)}
        type={type}
        materialId={materialId}
        styleId={styleId}
        isEditing={isEditing}
        lng={lng}
      />
    </Box>
  );
};

export default ProsAndConsDialogButton;
