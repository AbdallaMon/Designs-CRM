"use client";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Box, Button, Input, TextField } from "@mui/material";
import { useState } from "react";
import { MdClose } from "react-icons/md";

export function EditFieldButton({
  path,
  text,
  reqType = "PUT",
  onUpdate,
  inputType = "text",
  field,
}) {
  const { setLoading } = useToastContext();
  const [data, setData] = useState();
  const [isEditing, setIsEditing] = useState(false);

  async function handleUpdate() {
    const request = await handleRequestSubmit(
      { [field]: data },
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
      <Box sx={{ display: "flex", gap: 2, backgroundColor: "white", p: 1.5 }}>
        <TextField
          type={inputType}
          onChange={(e) => {
            setData(e.target.value);
          }}
          label={`Edit ${text}`}
        />
        <Button variant="contained" onClick={() => handleUpdate()}>
          Save
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setIsEditing(false);
          }}
        >
          <MdClose />
        </Button>
      </Box>
    );
  }
  return (
    <Button
      variant="contained"
      onClick={() => {
        setIsEditing(true);
      }}
    >
      Edit {text}
    </Button>
  );
}
