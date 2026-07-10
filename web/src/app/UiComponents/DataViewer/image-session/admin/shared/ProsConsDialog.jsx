"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
} from "@mui/material";
import {
  MdThumbUp as ThumbUp,
  MdThumbDown as ThumbDown,
  MdEdit as Edit,
  MdVisibility as Visibility,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import AddNewItem from "@/app/UiComponents/DataViewer/image-session/admin/shared/AddNewItem.jsx";
import ProConItem from "@/app/UiComponents/DataViewer/image-session/admin/shared/ProConItem.jsx";

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

export default ProsConsDialog;
