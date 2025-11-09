"use client";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  TextField,
  Paper,
  Fade,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import { useState } from "react";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";

export function EditFieldButton({
  path,
  children,
  reqType = "PUT",
  onUpdate,
  inputType = "text",
  field,
}) {
  const theme = useTheme();
  const { setLoading } = useToastContext();
  const [data, setData] = useState();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const label = `Edit ${field}`;

  async function handleUpdate() {
    const request = await handleRequestSubmit(
      { [field]: data, inputType, field },
      setLoading,
      path,
      false,
      "Updating",
      false,
      reqType
    );
    if (request.status === 200) {
      if (onUpdate) {
        onUpdate(request.data);
      }
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <Fade in={isEditing}>
        <Paper
          elevation={0}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: theme.shape.borderRadius,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(10px)",
              transition: theme.transitions.create(
                ["background", "transform", "box-shadow"],
                {
                  duration: theme.transitions.duration.standard,
                }
              ),
              "&:hover": {
                background: alpha(theme.palette.background.paper, 0.9),
                transform: "translateY(-1px)",
                boxShadow: theme.shadows[4],
              },
              "&.Mui-focused": {
                background: theme.palette.background.paper,
                transform: "translateY(-2px)",
                boxShadow: `0 8px 24px ${alpha(
                  theme.palette.primary.main,
                  0.2
                )}`,
              },
            },
            "& .MuiInputLabel-root": {
              fontWeight: theme.typography.fontWeightMedium,
              "&.Mui-focused": {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField
                type={inputType}
                onChange={(e) => setData(e.target.value)}
                label={label}
                variant="outlined"
                fullWidth
                autoFocus
              />
              <IconButton
                variant="contained"
                onClick={handleUpdate}
                color="success"
              >
                <MdSave />{" "}
              </IconButton>
              <IconButton
                variant="outlined"
                onClick={() => setIsEditing(false)}
                color="error"
              >
                <MdCancel />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      </Fade>
    );
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "relative",
        display: "inline-block",
        transition: theme.transitions.create(["transform"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          transform: "translateY(-1px)",
        },
      }}
    >
      {children}

      <Fade in={isHovered}>
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            display: "flex",
            justifyContent: "flex-end",
            zIndex: theme.zIndex.tooltip,
          }}
        >
          <Tooltip title={`Edit ${label.toLowerCase()}`} arrow placement="top">
            <IconButton
              onClick={() => setIsEditing(true)}
              size="small"
              sx={{
                background: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                width: 32,
                height: 32,
                boxShadow: theme.shadows[4],
                transition: theme.transitions.create(
                  ["transform", "box-shadow", "background"],
                  {
                    duration: theme.transitions.duration.short,
                    easing: theme.transitions.easing.easeInOut,
                  }
                ),
                "&:hover": {
                  background: theme.palette.primary.dark,
                  transform: "scale(1.1)",
                  boxShadow: theme.shadows[8],
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              <MdEdit size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>
    </Box>
  );
}
