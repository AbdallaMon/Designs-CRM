import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import RenderTitle from "../shared/RenderTitle";
import { EditPageInfo } from "./EditPageInfo";

const PageInfoItem = ({ item, onUpdate }) => {
  return (
    <Card
      sx={{
        m: 2,
        opacity: 1,
        border: "1px solid #e0e0e0",
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
            Page #{item.id}
          </Typography>

          <Chip
            label={`Page type : ${item.type}`}
            color={"default"}
            size="small"
          />
        </Box>
        <Box mb={2}>
          <RenderTitle titles={item.title} />
        </Box>{" "}
        <Box mb={1}>
          <RenderTitle type="DESCRIPTION" titles={item.content} />
        </Box>
        <Divider sx={{ my: 2 }} />
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 0, pb: 2 }}>
        <EditPageInfo onUpdate={onUpdate} pageInfo={item} />
      </CardActions>
    </Card>
  );
};

export default PageInfoItem;
