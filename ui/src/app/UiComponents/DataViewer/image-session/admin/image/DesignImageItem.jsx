import React, { useState } from "react";
import {
  Card,
  CardActions,
  Typography,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip,
  CardContent,
  Fade,
  Avatar,
} from "@mui/material";
import { MdArchive, MdUnarchive, MdImage, MdStyle } from "react-icons/md";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { EditDesignImage } from "./EditDesignImage";
import ImageLoader from "../shared/ImageLoader ";

export const DesignImageItem = ({ item, onUpdate }) => {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleToggleArchive = async () => {
    const req = await handleRequestSubmit(
      { isArchived: !item.isArchived },
      setIsArchiving,
      `admin/model/archived/${item.id}?model=designImage&`,
      false,
      "Updating",
      false,
      "PATCH"
    );
    if (req.status === 200) {
      await onUpdate();
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          m: 2,
          opacity: item.isArchived ? 0.7 : 1,
          border: item.isArchived ? "1px dashed #ccc" : "1px solid #e0e0e0",
          borderRadius: 2,
          boxShadow: item.isArchived ? 1 : 2,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: item.isArchived ? 2 : 4,
            transform: "translateY(-2px)",
          },
        }}
      >
        <CardContent
          sx={{
            pb: 0,
          }}
        >
          {/* Header Section */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            flexWrap="wrap"
            gap={1}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 32,
                  height: 32,
                }}
              >
                <MdImage size={18} />
              </Avatar>
              <Typography variant="h6" component="h2" color="primary">
                Image #{item.id}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: "secondary.main",
                  width: 32,
                  height: 32,
                }}
              >
                <MdStyle size={18} />
              </Avatar>
              <Typography variant="h6" component="h2" color="secondary">
                Style #{item.styleId} -{" "}
                {item.title.find((t) => t.language.code === "ar").text}
              </Typography>
            </Box>

            <Chip
              label={item.isArchived ? "Archived" : "Active"}
              color={item.isArchived ? "default" : "success"}
              size="small"
              variant={item.isArchived ? "outlined" : "filled"}
              sx={{
                fontWeight: "bold",
                minWidth: 80,
              }}
            />
          </Box>

          {/* Spaces Section */}
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Associated Spaces ({item.spaces.length})
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {item.spaces.map((designImageSpace) => (
                <Chip
                  key={designImageSpace.id}
                  label={
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Space #{designImageSpace.space.id}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textPrimary"
                        sx={{ fontWeight: 500 }}
                      >
                        {designImageSpace.space.title[0].text}
                      </Typography>
                    </Box>
                  }
                  color="primary"
                  size="small"
                  variant="outlined"
                  sx={{
                    height: "auto",
                    borderRadius: 2,
                    "& .MuiChip-label": {
                      px: 1.5,
                      py: 0.5,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <ImageLoader
            src={item.imageUrl}
            alt={"Design Image dream studio"}
            isArchived={item.isArchived}
            skeletonHeight={200}
            borderRadius={2}
            overlayText="ARCHIVED"
          />

          {/* Image Details */}
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Alt Text: {item.alt || "No alt text provided"}
            </Typography>
          </Box>
        </CardContent>

        <Divider sx={{ my: 2 }} />

        {/* Actions Section */}
        <CardActions
          sx={{
            justifyContent: "space-between",
            px: 2,
            pb: 2,
            gap: 1,
          }}
        >
          <EditDesignImage initialData={item} onUpdate={onUpdate} />

          <Tooltip
            title={item.isArchived ? "Restore from archive" : "Archive image"}
            placement="top"
          >
            <span>
              <IconButton
                onClick={handleToggleArchive}
                disabled={isArchiving}
                color={item.isArchived ? "success" : "warning"}
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                  "&:disabled": {
                    opacity: 0.5,
                  },
                }}
              >
                {isArchiving ? (
                  <Box
                    sx={{
                      animation: "spin 1s linear infinite",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  >
                    {item.isArchived ? <MdUnarchive /> : <MdArchive />}
                  </Box>
                ) : (
                  <>{item.isArchived ? <MdUnarchive /> : <MdArchive />}</>
                )}
              </IconButton>
            </span>
          </Tooltip>
        </CardActions>
      </Card>
    </Fade>
  );
};

export default DesignImageItem;
