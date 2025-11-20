import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
} from "@mui/material";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";

import { PROJECT_TYPES } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { getData } from "@/app/helpers/functions/getData";

export const ProjectAutoAssignmentDialog = ({ userId }) => {
  const { setLoading } = useToastContext();

  const [open, setOpen] = useState(false);
  // What is stored in DB when dialog opens
  const [originalTypes, setOriginalTypes] = useState([]);

  // Current editable selection
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [tempType, setTempType] = useState(""); // type to add
  const [isFetching, setIsFetching] = useState(false);

  const onClose = () => {
    setOpen(false);
    setTempType("");
  };

  const handleOpen = () => {
    setOpen(true);
  };

  // Fetch current auto assignments when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchAssignments = async () => {
      setIsFetching(true);
      const req = await getData({
        url: `admin/users/${userId}/auto-assignments`,
        setLoading: setIsFetching,
      });

      if (req && req.status === 200) {
        const typesFromApi = req.data?.types || req.types || req.data || [];

        const uniqueTypes = Array.from(new Set(typesFromApi));
        setOriginalTypes(uniqueTypes);
        setSelectedTypes(uniqueTypes);
      } else {
        setOriginalTypes([]);
        setSelectedTypes([]);
      }
    };

    fetchAssignments();
  }, [open, userId, setLoading]);

  const handleAddType = () => {
    if (tempType && !selectedTypes.includes(tempType)) {
      setSelectedTypes([...selectedTypes, tempType]);
      setTempType("");
    }
  };

  const handleRemoveType = (typeToRemove) => {
    setSelectedTypes(selectedTypes.filter((t) => t !== typeToRemove));
  };

  const handleSave = async () => {
    const payload = {
      added: selectedTypes.filter((t) => !originalTypes.includes(t)),
      removed: originalTypes.filter((t) => !selectedTypes.includes(t)),
    };

    const request = await handleRequestSubmit(
      payload,
      setLoading,
      `admin/users/${userId}/auto-assignments`,
      false,
      "Updating auto assignments",
      null,
      "PUT"
    );

    if (request && request.status === 200) {
      window.location.reload();
      onClose();
    }
  };

  if (!open) {
    return (
      <Button onClick={handleOpen} variant="contained" fullWidth>
        Manage Project Auto Assignment
      </Button>
    );
  }

  const availableTypesToAdd = PROJECT_TYPES.filter(
    (t) => !selectedTypes.includes(t) && t !== "3D_Modification"
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Project Auto Assignment</DialogTitle>

      <DialogContent>
        {isFetching ? (
          <Typography
            variant="body2"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <CircularProgress size={20} /> Loading current assignments...
          </Typography>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Assigned Project Types:
            </Typography>

            <List dense>
              {selectedTypes.length > 0 ? (
                selectedTypes.map((type) => (
                  <ListItem
                    key={type}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveType(type)}
                        color="error"
                      >
                        <MdDelete />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={type} />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No project types assigned for auto assignment.
                </Typography>
              )}
            </List>

            <FormControl fullWidth margin="normal">
              <InputLabel>Add Project Type</InputLabel>
              <Select
                value={tempType}
                label="Add Project Type"
                onChange={(e) => setTempType(e.target.value)}
              >
                {availableTypesToAdd.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
                {availableTypesToAdd.length === 0 && (
                  <MenuItem disabled>No more types to add</MenuItem>
                )}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<MdAddCircleOutline />}
              onClick={handleAddType}
              fullWidth
              disabled={!tempType}
              sx={{ mt: 1 }}
            >
              Add Project Type
            </Button>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={isFetching}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
