"use client";

import { useCallback, useEffect, useState, memo } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
} from "@mui/material";
import {
  MdEdit,
  MdList,
  MdExpandMore,
  MdDelete,
  MdAdd,
  MdClose,
} from "react-icons/md";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";

function StageClauseCreateDialog({ open, onClose, onCreate, order }) {
  const [headingAr, setHeadingAr] = useState("");
  const [headingEn, setHeadingEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  useEffect(() => {
    if (open) {
      setHeadingAr("");
      setHeadingEn("");
      setTitleAr("");
      setTitleEn("");
      setDescriptionAr("");
      setDescriptionEn("");
    }
  }, [open]);

  const handleSave = () => {
    const newClause = {
      id: null,
      headingAr,
      headingEn,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      order,
      isNew: true,
    };
    onCreate(newClause);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MdAdd />
        <span>إضافة بند مرحلة جديد</span>
        <Box flexGrow={1} />
        <IconButton onClick={onClose}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Heading (عربي)"
              fullWidth
              sx={{ direction: "rtl" }}
              value={headingAr}
              onChange={(e) => setHeadingAr(e.target.value)}
            />
            <TextField
              label="Heading (EN)"
              fullWidth
              value={headingEn}
              onChange={(e) => setHeadingEn(e.target.value)}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Title (عربي)"
              fullWidth
              sx={{ direction: "rtl" }}
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
            />
            <TextField
              label="Title (EN)"
              fullWidth
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Description (عربي)"
              fullWidth
              multiline
              minRows={3}
              sx={{ direction: "rtl" }}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
            />
            <TextField
              label="Description (EN)"
              fullWidth
              multiline
              minRows={3}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<MdClose />}>
          إلغاء
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<MdAdd />}>
          إنشاء البند
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const StageClauseItemBase = ({ clause, index, onSave, onDelete, disabled }) => {
  const [headingAr, setHeadingAr] = useState(clause.headingAr || "");
  const [headingEn, setHeadingEn] = useState(clause.headingEn || "");
  const [titleAr, setTitleAr] = useState(clause.titleAr || "");
  const [titleEn, setTitleEn] = useState(clause.titleEn || "");
  const [descriptionAr, setDescriptionAr] = useState(
    clause.descriptionAr || ""
  );
  const [descriptionEn, setDescriptionEn] = useState(
    clause.descriptionEn || ""
  );

  // If backend refetches and gives new data, sync it
  useEffect(() => {
    setHeadingAr(clause.headingAr || "");
    setHeadingEn(clause.headingEn || "");
    setTitleAr(clause.titleAr || "");
    setTitleEn(clause.titleEn || "");
    setDescriptionAr(clause.descriptionAr || "");
    setDescriptionEn(clause.descriptionEn || "");
  }, [clause.id]);

  const handleSaveClick = () => {
    const updatedClause = {
      ...clause,
      headingAr,
      headingEn,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
    };
    onSave(updatedClause, index);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          gap={1}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle2">
              {headingAr || "بدون عنوان (عربي)"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {headingEn || "No heading (EN)"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={`#${index + 1}`} variant="outlined" />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(clause.id, index);
              }}
              disabled={disabled}
            >
              <MdDelete />
            </IconButton>
          </Stack>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Heading (عربي)"
              fullWidth
              value={headingAr}
              sx={{ direction: "rtl" }}
              onChange={(e) => setHeadingAr(e.target.value)}
            />
            <TextField
              label="Heading (EN)"
              fullWidth
              value={headingEn}
              onChange={(e) => setHeadingEn(e.target.value)}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Title (عربي)"
              fullWidth
              value={titleAr}
              sx={{ direction: "rtl" }}
              onChange={(e) => setTitleAr(e.target.value)}
            />
            <TextField
              label="Title (EN)"
              fullWidth
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <TextField
              label="Description (عربي)"
              fullWidth
              multiline
              minRows={3}
              value={descriptionAr}
              sx={{ direction: "rtl" }}
              onChange={(e) => setDescriptionAr(e.target.value)}
            />
            <TextField
              label="Description (EN)"
              fullWidth
              multiline
              minRows={3}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
            />
          </Stack>

          <Box display="flex" justifyContent="flex-end">
            <Button
              startIcon={<MdEdit />}
              variant="contained"
              onClick={handleSaveClick}
              disabled={disabled}
            >
              حفظ البند
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

const StageClauseItem = memo(StageClauseItemBase);

// ------------------ main dialog ------------------

export function StageClausesDialog({ open, onClose, onUpdated }) {
  const { setLoading: setToastLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const [loading, setLoading] = useState(false);
  const [clauses, setClauses] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);

  // confirmation state for delete
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clauseId: null,
    index: null,
  });

  const fetchStageClauses = useCallback(async () => {
    if (!open) return;
    await getDataAndSet({
      url: "shared/site-utilities/contract-utility/stage-clauses",
      setData: setClauses,
      setLoading,
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchStageClauses();
    }
  }, [open, fetchStageClauses]);

  const handleAddClause = () => {
    setCreateOpen(true);
  };

  // this is now just opening the warning dialog
  const handleDeleteClause = (clauseId, index) => {
    setDeleteDialog({
      open: true,
      clauseId,
      index,
    });
  };

  // actual deletion logic (unchanged payload / endpoint)
  const confirmDeleteClause = async () => {
    const { clauseId, index } = deleteDialog;
    setDeleteDialog((prev) => ({ ...prev, open: false }));

    // Not saved yet → just remove locally
    if (!clauseId) {
      setClauses((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `shared/site-utilities/contract-utility/stage-clauses/${clauseId}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await fetchStageClauses();
      onUpdated?.();
    }
  };

  const handleSaveClause = async (updatedClause, index) => {
    // payload unchanged
    const payload = {
      headingAr: updatedClause.headingAr,
      headingEn: updatedClause.headingEn,
      titleAr: updatedClause.titleAr,
      titleEn: updatedClause.titleEn,
      descriptionAr: updatedClause.descriptionAr,
      descriptionEn: updatedClause.descriptionEn,
      order: updatedClause.order ?? index,
    };

    const isNew = !updatedClause.id;

    const req = await handleRequestSubmit(
      payload,
      setToastLoading,
      isNew
        ? `shared/site-utilities/contract-utility/stage-clauses`
        : `shared/site-utilities/contract-utility/stage-clauses/${updatedClause.id}`,
      false,
      "Saving",
      false,
      isNew ? "POST" : "PUT"
    );

    if (req.status === 200) {
      await fetchStageClauses();
      onUpdated?.();
    }
  };

  const handleCreateClause = async (draftClause) => {
    await handleSaveClause(draftClause, clauses.length);
    setCreateOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdList />
          <span>بنود المراحل (Stage Clauses)</span>
          <Box flexGrow={1} />
          <IconButton onClick={onClose}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Button
              startIcon={<MdAdd />}
              variant="outlined"
              onClick={handleAddClause}
              disabled={loading}
            >
              إضافة بند جديد
            </Button>
          </Box>

          {/* Sub dialog for creating a new stage clause */}
          <StageClauseCreateDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={handleCreateClause}
            order={clauses.length}
          />

          <Stack spacing={1}>
            {clauses?.map((clause, index) => (
              <StageClauseItem
                key={clause.id ?? `new-${index}`}
                clause={clause}
                index={index}
                disabled={loading}
                onDelete={handleDeleteClause}
                onSave={handleSaveClause}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} startIcon={<MdClose />}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning dialog for delete (Stage Clauses) */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog((prev) => ({
            ...prev,
            open: false,
          }))
        }
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdDelete />
          <span>تأكيد الحذف</span>
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            هل أنت متأكد من رغبتك في حذف هذا البند؟ لا يمكن التراجع عن هذه
            العملية.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog((prev) => ({
                ...prev,
                open: false,
              }))
            }
            startIcon={<MdClose />}
          >
            إلغاء
          </Button>
          <Button
            onClick={confirmDeleteClause}
            startIcon={<MdDelete />}
            color="error"
            variant="contained"
            disabled={loading}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
