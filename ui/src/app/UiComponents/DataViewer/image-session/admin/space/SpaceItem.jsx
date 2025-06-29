import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MdEdit, MdArchive, MdUnarchive } from "react-icons/md";
import RenderTitle from "../shared/RenderTitle";
import { EditSpace } from "./EditSpace";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

const SpaceItemCard = ({ item, onUpdate }) => {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleToggleArchive = async () => {
    const req = await handleRequestSubmit(
      { isArchived: !item.isArchived },
      setIsArchiving,
      `admin/model/archived/${item.id}?model=space&`,
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
    <Card
      sx={{
        m: 2,
        opacity: item.isArchived ? 0.7 : 1,
        border: item.isArchived ? "1px dashed #ccc" : "1px solid #e0e0e0",
      }}
    >
      <CardContent
        sx={{
          pb: 0,
        }}
      >
        {/* Header with ID and Status */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" component="h2" color="primary">
            Space #{item.id}
          </Typography>
          <Chip
            label={item.isArchived ? "Archived" : "Active"}
            color={item.isArchived ? "default" : "success"}
            size="small"
          />
        </Box>

        {/* Titles in different languages */}
        <Box mb={2}>
          <RenderTitle titles={item.title} />
        </Box>

        <Divider sx={{ my: 2 }} />
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 0, pb: 2 }}>
        <EditSpace onUpdate={onUpdate} space={item} />

        <Tooltip
          title={item.isArchived ? "Restore from archive" : "Archive space"}
        >
          <IconButton
            onClick={handleToggleArchive}
            disabled={isArchiving}
            color={item.isArchived ? "success" : "warning"}
          >
            {item.isArchived ? <MdUnarchive /> : <MdArchive />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default SpaceItemCard;
