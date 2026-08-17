"use client";
import React, { useState } from "react";
import { Button, Box, Card, CardContent } from "@mui/material";
import { MdAdd as Add } from "react-icons/md";
import { CreateTitleOrDesc } from "@/features/image-session/admin/shared/CreateTitleOrDesc.jsx";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";

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
      setAlertError(FEEDBACK.FILL_ALL_LANGUAGES);
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

export default AddNewItem;
