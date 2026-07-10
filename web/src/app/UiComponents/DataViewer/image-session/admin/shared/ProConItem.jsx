"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Divider,
} from "@mui/material";
import {
  MdThumbUp as ThumbUp,
  MdThumbDown as ThumbDown,
  MdDelete as Delete,
  MdEdit as Edit,
  MdSave as Save,
  MdCancel as Cancel,
  MdExpandMore as ExpandMore,
  MdExpandLess as ExpandLess,
} from "react-icons/md";
import RenderTitle from "@/app/UiComponents/DataViewer/image-session/admin/shared/RenderTitle.jsx";
import { EditTitleOrDescFields } from "@/app/UiComponents/DataViewer/image-session/admin/shared/EditTitleOrDesc.jsx";

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

export default ProConItem;
