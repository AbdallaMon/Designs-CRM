import React, { useState } from "react";
import {
  Card,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CardContent,
} from "@mui/material";
import { MdArchive, MdClose, MdUnarchive } from "react-icons/md";
import RenderTitle from "../shared/RenderTitle";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import ProsAndConsDialogButton from "../shared/ProsAndCons";
import { PreviewItemTemplate } from "../shared/PreviewItemTemplate";
import { EditSessionItem } from "../shared/session-item/EditSessionItem";

export const MaterialItemCard = ({ model, item, onUpdate }) => {
  const [isArchiving, setIsArchiving] = useState(false);
  const handleToggleArchive = async () => {
    const req = await handleRequestSubmit(
      { isArchived: !item.isArchived },
      setIsArchiving,
      `admin/model/archived/${item.id}?model=material&`,
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" component="h2" color="primary">
            {model} #{item.id}
          </Typography>
          <Typography variant="h6" component="h2" color="primary">
            Template Id #{item.template.id}
          </Typography>
          <Chip
            label={item.isArchived ? "Archived" : "Active"}
            color={item.isArchived ? "default" : "success"}
            size="small"
          />
        </Box>
        <Box>
          <RenderTitle titles={item.title} />
        </Box>
        <Box>
          <RenderTitle titles={item.description} type="DESCRIPTION" />
        </Box>
      </CardContent>
      <Divider sx={{ my: 2 }} />
      <CardActions
        sx={{ justifyContent: "space-between", px: 1, pb: 2, gap: 1 }}
      >
        <ProsAndConsDialogButton
          materialId={item.id}
          type={"MATERIAL"}
          isEditing={true}
        />
        <EditSessionItem
          initialData={item}
          onUpdate={onUpdate}
          modelType={"MATERIAL"}
          name="Material"
          slug="material"
        />
        <Tooltip
          title={item.isArchived ? "Restore from archive" : "Archive material"}
        >
          <IconButton
            onClick={handleToggleArchive}
            disabled={isArchiving}
            color={item.isArchived ? "success" : "warning"}
          >
            {item.isArchived ? <MdUnarchive /> : <MdArchive />}
          </IconButton>
        </Tooltip>
        <TemplateDialog item={item} />
      </CardActions>
    </Card>
  );
};

function TemplateDialog({ item }) {
  const [open, setOpen] = useState(false);
  function handleClose() {
    setOpen(false);
  }
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Preview template
      </Button>
      <Dialog maxWidth="lg" fullWidth open={open} onClose={handleClose}>
        <DialogTitle>
          <Typography variant="h4">Template id #{item.template.id}</Typography>
          <IconButton onClick={handleClose}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PreviewItemTemplate item={item} template={item.template} />
        </DialogContent>
      </Dialog>
    </>
  );
}
export default MaterialItemCard;
