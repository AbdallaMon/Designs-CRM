"use client";

import { useCallback, useEffect, useState, memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import {
  MdEdit,
  MdFormatListBulleted,
  MdDelete,
  MdAdd,
  MdClose,
} from "react-icons/md";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";

function SpecialClauseCreateDialog({ open, onClose, onCreate, order }) {
  const [textAr, setTextAr] = useState("");
  const [textEn, setTextEn] = useState("");

  useEffect(() => {
    if (open) {
      setTextAr("");
      setTextEn("");
    }
  }, [open]);

  const handleSave = () => {
    const newClause = {
      id: null,
      textAr,
      textEn,
      order,
      isActive: true,
    };
    onCreate(newClause);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MdAdd />
        <span>إضافة بند خاص جديد</span>
        <Box flexGrow={1} />
        <IconButton onClick={onClose}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            label="النص (عربي)"
            fullWidth
            multiline
            minRows={3}
            sx={{ direction: "rtl" }}
            value={textAr}
            onChange={(e) => setTextAr(e.target.value)}
          />
          <TextField
            label="Text (EN)"
            fullWidth
            multiline
            minRows={3}
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
          />
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

const SpecialClauseItemBase = ({
  clause,
  index,
  onSave,
  onDelete,
  disableDelete,
  disabled,
}) => {
  const [textAr, setTextAr] = useState(clause.textAr || "");
  const [textEn, setTextEn] = useState(clause.textEn || "");

  // sync with backend refetch
  useEffect(() => {
    setTextAr(clause.textAr || "");
    setTextEn(clause.textEn || "");
  }, [clause.id, clause.textAr, clause.textEn]);

  const handleSaveClick = () => {
    const updatedClause = {
      ...clause,
      textAr,
      textEn,
    };
    onSave(updatedClause, index);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Typography variant="subtitle2">بند خاص #{index + 1}</Typography>
          <IconButton
            onClick={() => onDelete(clause.id, index)}
            disabled={disableDelete || disabled}
          >
            <MdDelete />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="النص (عربي)"
            fullWidth
            multiline
            minRows={3}
            value={textAr}
            sx={{ direction: "rtl" }}
            onChange={(e) => setTextAr(e.target.value)}
          />
          <TextField
            label="Text (EN)"
            fullWidth
            multiline
            minRows={3}
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
          />
        </Stack>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            startIcon={<MdEdit />}
            variant="contained"
            onClick={handleSaveClick}
            disabled={disabled}
          >
            حفظ
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const SpecialClauseItem = memo(SpecialClauseItemBase);

// ------------------ main dialog ------------------

export function SpecialClausesDialog({ open, onClose, onUpdated }) {
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

  const fetchSpecialClauses = useCallback(async () => {
    if (!open) return;
    await getDataAndSet({
      url: "shared/site-utilities/contract-utility/special-clauses",
      setData: setClauses,
      setLoading,
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchSpecialClauses();
    }
  }, [open, fetchSpecialClauses]);

  const handleAddClause = () => {
    setCreateOpen(true);
  };

  // now just opens warning dialog
  const handleDeleteClause = (clauseId, index) => {
    setDeleteDialog({
      open: true,
      clauseId,
      index,
    });
  };

  // actual delete logic (unchanged payload / endpoint)
  const confirmDeleteClause = async () => {
    const { clauseId, index } = deleteDialog;
    setDeleteDialog((prev) => ({ ...prev, open: false }));

    // not saved yet → just remove locally
    if (!clauseId) {
      setClauses((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `shared/site-utilities/contract-utility/special-clauses/${clauseId}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await fetchSpecialClauses();
      onUpdated?.();
    }
  };

  const handleSaveClause = async (updatedClause, index) => {
    // payload unchanged
    const payload = {
      textAr: updatedClause.textAr,
      textEn: updatedClause.textEn,
      order: updatedClause.order ?? index,
      isActive: updatedClause.isActive ?? true,
    };

    const isNew = !updatedClause.id;

    const req = await handleRequestSubmit(
      payload,
      setToastLoading,
      isNew
        ? `shared/site-utilities/contract-utility/special-clauses`
        : `shared/site-utilities/contract-utility/special-clauses/${updatedClause.id}`,
      false,
      "Saving",
      false,
      isNew ? "POST" : "PUT"
    );

    if (req.status === 200) {
      await fetchSpecialClauses();
      onUpdated?.();
    }
  };

  const handleCreateClause = async (draftClause) => {
    await handleSaveClause(draftClause, clauses.length);
    setCreateOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdFormatListBulleted />
          <span>بنود خاصة (Special Clauses)</span>
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
              إضافة بند خاص جديد
            </Button>
          </Box>

          {/* Sub-dialog for creating a new special clause */}
          <SpecialClauseCreateDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={handleCreateClause}
            order={clauses.length}
          />

          <Stack spacing={2}>
            {clauses.map((clause, index) => (
              <SpecialClauseItem
                key={clause.id ?? `special-${index}`}
                clause={clause}
                index={index}
                onSave={handleSaveClause}
                onDelete={handleDeleteClause}
                disabled={loading}
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

      {/* Warning dialog for delete (Special Clauses) */}
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
            هل أنت متأكد من رغبتك في حذف هذا البند الخاص؟ لا يمكن التراجع عن هذه
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
