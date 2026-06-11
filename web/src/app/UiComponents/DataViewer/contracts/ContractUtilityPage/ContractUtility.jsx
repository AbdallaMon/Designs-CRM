"use client";

import { useCallback, useEffect, useState, memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
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
  Divider,
} from "@mui/material";
import {
  MdEdit,
  MdList,
  MdArticle,
  MdFormatListBulleted,
  MdLayers,
  MdExpandMore,
  MdDelete,
  MdAdd,
  MdClose,
} from "react-icons/md";

import { getData } from "@/app/helpers/functions/getData";
import { CONTRACT_LEVELSENUM } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

export default function ContractUtilityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [contractUtility, setContractUtility] = useState(null);

  const [openObligations, setOpenObligations] = useState(false);
  const [openStageClauses, setOpenStageClauses] = useState(false);
  const [openSpecialClauses, setOpenSpecialClauses] = useState(false);
  const [openLevelClauses, setOpenLevelClauses] = useState(false);

  const fetchContractUtility = async () => {
    await getDataAndSet({
      url: "shared/site-utilities/contract-utility/details",
      setData: setContractUtility,
      setLoading: setIsLoading,
    });
  };

  useEffect(() => {
    fetchContractUtility();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        إعدادات عقد التصميم (Contract Utility)
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            العناصر المتاحة للتحكم:
          </Typography>

          <List>
            <ListItemButton
              onClick={() => setOpenObligations(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="التزامات الفريقين (Obligations)"
                secondary="إدارة نص التزامات الفريق الأول والثاني - عربي / إنجليزي"
              />
              <MdArticle size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenStageClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود المراحل (Stage Clauses)"
                secondary="Heading + Title + Description لكل بند - عربي / إنجليزي"
              />
              <MdList size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenSpecialClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود خاصة (Special Clauses)"
                secondary="قائمة نصوص جاهزة يمكن إضافتها للعقود - عربي / إنجليزي"
              />
              <MdFormatListBulleted size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenLevelClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود خاصة بكل مرحلة (Level Clauses)"
                secondary="قائمة نصوص مربوطة بـ ContractLevel (LEVEL_1..LEVEL_7)"
              />
              <MdLayers size={22} />
            </ListItemButton>
          </List>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ObligationsDialog
        open={openObligations}
        onClose={() => setOpenObligations(false)}
        onUpdated={fetchContractUtility}
      />

      <StageClausesDialog
        open={openStageClauses}
        onClose={() => setOpenStageClauses(false)}
        onUpdated={fetchContractUtility}
      />

      <SpecialClausesDialog
        open={openSpecialClauses}
        onClose={() => setOpenSpecialClauses(false)}
        onUpdated={fetchContractUtility}
      />

      <LevelClausesDialog
        open={openLevelClauses}
        onClose={() => setOpenLevelClauses(false)}
        onUpdated={fetchContractUtility}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Obligations Dialog
// -----------------------------------------------------------------------------

function ObligationsDialog({ open, onClose, onUpdated }) {
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);

  const [partyOneAr, setPartyOneAr] = useState("");
  const [partyOneEn, setPartyOneEn] = useState("");
  const [partyTwoAr, setPartyTwoAr] = useState("");
  const [partyTwoEn, setPartyTwoEn] = useState("");

  const fetchObligations = async () => {
    if (!open) return;
    const req = await getData({
      url: "shared/site-utilities/contract-utility/obligations",
      setLoading,
    });
    if (req && req.data) {
      const data = req.data;
      setPartyOneAr(data.obligationsPartyOneAr || "");
      setPartyOneEn(data.obligationsPartyOneEn || "");
      setPartyTwoAr(data.obligationsPartyTwoAr || "");
      setPartyTwoEn(data.obligationsPartyTwoEn || "");
    }
  };

  useEffect(() => {
    if (open) {
      fetchObligations();
    }
  }, [open]);

  const handleSave = async () => {
    const req = await handleRequestSubmit(
      {
        obligationsPartyOneAr: partyOneAr,
        obligationsPartyOneEn: partyOneEn,
        obligationsPartyTwoAr: partyTwoAr,
        obligationsPartyTwoEn: partyTwoEn,
      },
      setToastLoading,
      `shared/site-utilities/contract-utility/obligations`,
      false,
      "Saving",
      false,
      "PUT"
    );
    if (req.status === 200) {
      onUpdated?.();
      fetchObligations();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MdArticle />
        <span>التزامات الفريقين (Obligations)</span>
        <Box flexGrow={1} />
        <IconButton onClick={onClose}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} mt={1}>
          <Box>
            <Typography variant="subtitle1" mb={1}>
              الفريق الأول (Party One)
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="عربي"
                fullWidth
                multiline
                minRows={4}
                value={partyOneAr}
                onChange={(e) => setPartyOneAr(e.target.value)}
                disabled={loading}
                sx={{ direction: "rtl" }}
              />
              <TextField
                label="English"
                fullWidth
                multiline
                minRows={4}
                value={partyOneEn}
                onChange={(e) => setPartyOneEn(e.target.value)}
                disabled={loading}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" mb={1}>
              الفريق الثاني (Party Two)
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="عربي"
                fullWidth
                multiline
                minRows={4}
                value={partyTwoAr}
                onChange={(e) => setPartyTwoAr(e.target.value)}
                disabled={loading}
                sx={{ direction: "rtl" }}
              />
              <TextField
                label="English"
                fullWidth
                multiline
                minRows={4}
                value={partyTwoEn}
                onChange={(e) => setPartyTwoEn(e.target.value)}
                disabled={loading}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<MdClose />}>
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<MdEdit />}
          disabled={loading}
        >
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------
// Stage Clauses Dialog
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Special Clauses Dialog
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Level Clauses Dialog (per ContractLevel, one clause per level)
// -----------------------------------------------------------------------------

function LevelClausesDialog({ open, onClose, onUpdated }) {
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);

  // 👇 now it's an array of items (one per level)
  const [clausesByLevel, setClausesByLevel] = useState([]);
  const { setAlertError } = useAlertContext();

  const fetchLevelClauses = async () => {
    if (!open) return;
    await getDataAndSet({
      url: "shared/site-utilities/contract-utility/level-clauses",
      setData: setClausesByLevel,
      setLoading,
    });
  };

  useEffect(() => {
    if (open) {
      fetchLevelClauses();
    }
  }, [open]);

  const handleChangeField = (level, field, value) => {
    setClausesByLevel((prev) => {
      if (!prev || !Array.isArray(prev)) return prev;
      const exists = prev.find((c) => c.level === level);
      if (!exists) return prev;

      return prev.map((c) =>
        c.level === level ? { ...c, [field]: value } : c
      );
    });
  };

  // لا يوجد Add ولا Delete هنا، فقط Save (PUT) للبند الواحد الخاص بكل مرحلة

  const handleSaveClause = async (level, index) => {
    const clause = clausesByLevel?.find((c) => c.level === level);

    if (!clause || !clause.id) {
      setAlertError("لا يمكن حفظ هذا البند لأنه غير معرف في قاعدة البيانات.");
      return;
    }

    const payload = {
      level,
      textAr: clause.textAr,
      textEn: clause.textEn,
      order: clause.order ?? index,
      isActive: clause.isActive ?? true,
    };

    const req = await handleRequestSubmit(
      payload,
      setToastLoading,
      `shared/site-utilities/contract-utility/level-clauses/${clause.id}`,
      false,
      "Saving",
      false,
      "PUT"
    );

    if (req.status === 200) {
      fetchLevelClauses();
      onUpdated?.();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MdLayers />
        <span>بنود خاصة بكل مرحلة (Level Clauses)</span>
        <Box flexGrow={1} />
        <IconButton onClick={onClose}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {CONTRACT_LEVELSENUM.map((lvl, idx) => {
            const levelKey = lvl.enum;
            const clause =
              clausesByLevel?.find((lv) => lv.level === levelKey) || {};
            return (
              <Card key={levelKey} variant="outlined">
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Box>
                      <Typography variant="subtitle1">{lvl.labelAr}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lvl.labelEn} ({levelKey})
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={2}>
                    <Box border="1px solid #eee" borderRadius={1} p={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="subtitle2">بند المرحلة</Typography>
                      </Box>

                      <Stack spacing={2}>
                        <TextField
                          label="النص (عربي)"
                          fullWidth
                          multiline
                          minRows={2}
                          value={clause.textAr || ""}
                          sx={{ direction: "rtl" }}
                          onChange={(e) =>
                            handleChangeField(
                              levelKey,
                              "textAr",
                              e.target.value
                            )
                          }
                        />
                        <TextField
                          label="Text (EN)"
                          fullWidth
                          multiline
                          minRows={2}
                          value={clause.textEn || ""}
                          onChange={(e) =>
                            handleChangeField(
                              levelKey,
                              "textEn",
                              e.target.value
                            )
                          }
                        />
                      </Stack>

                      <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                          startIcon={<MdEdit />}
                          variant="contained"
                          size="small"
                          onClick={() => handleSaveClause(levelKey, idx)}
                          disabled={loading}
                        >
                          حفظ
                        </Button>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<MdClose />}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}
