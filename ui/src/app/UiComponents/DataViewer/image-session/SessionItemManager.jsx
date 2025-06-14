"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  Avatar,
  Fab,
} from "@mui/material";

import { MdPalette, MdRoom } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import DeleteModal from "../../models/DeleteModal";
import { SesssionItemModal } from "./SessionItemModel";

export const SessionItemManager = ({ model }) => {
  const [items, setitems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log("fetched");
    const req = await getData({
      url: `shared/image-session?model=${model}&`,
      setLoading,
    });
    if (req && req.status === 200) {
      setitems(req.data || []);
    }
  };

  const handleDelete = async () => {
    fetchData();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        {model === "Space" ? (
          <MdRoom sx={{ mr: 2, fontSize: 32, color: "primary.main" }} />
        ) : (
          <MdPalette />
        )}
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {model}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    src={item.avatarUrl}
                    sx={{
                      width: 50,
                      height: 50,
                      mr: 2,
                      bgcolor: "secondary.main",
                    }}
                  >
                    <MdRoom />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {item.name}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                >
                  <SesssionItemModal
                    model={model}
                    item={item}
                    onClose={fetchData}
                    type={"EDIT"}
                    buttonType="ICON"
                  />
                  <DeleteModal
                    item={item}
                    handleClose={handleDelete}
                    href="admin/image-session"
                    buttonType="ICON"
                    extra={`model=${model}`}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {items.length === 0 && !loading && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "text.secondary",
          }}
        >
          <MdRoom sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No {model} yet
          </Typography>
        </Box>
      )}

      <Fab color="white" sx={{ position: "fixed", bottom: 24, right: 24 }}>
        <SesssionItemModal
          model={model}
          onClose={fetchData}
          type={"CREATE"}
          buttonType={"ICON"}
        />
      </Fab>
    </Box>
  );
};
