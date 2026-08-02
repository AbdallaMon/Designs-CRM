"use client";

import { useEffect, useState, memo } from "react";
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
import { MdEdit, MdLayers, MdClose } from "react-icons/md";

import { CONTRACT_LEVELSENUM } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

// One card per contract level. Holds its OWN local text state (seeded from the
// clause, synced on refetch) so typing always works — even when no DB row exists
// yet for this level. Save creates (POST) when there is no id, updates (PUT)
// otherwise. Mirrors the SpecialClausesDialog item pattern.
const LevelClauseCardBase = ({ lvl, clause, onSave, disabled }) => {
  const [textAr, setTextAr] = useState(clause.textAr || "");
  const [textEn, setTextEn] = useState(clause.textEn || "");

  // sync with backend refetch
  useEffect(() => {
    setTextAr(clause.textAr || "");
    setTextEn(clause.textEn || "");
  }, [clause.id, clause.textAr, clause.textEn]);

  const handleSaveClick = () => {
    onSave({
      ...clause,
      level: lvl.enum,
      textAr,
      textEn,
    });
  };

  return (
    <Card variant="outlined">
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
              {lvl.labelEn} ({lvl.enum})
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
                value={textAr}
                sx={{ direction: "rtl" }}
                onChange={(e) => setTextAr(e.target.value)}
              />
              <TextField
                label="Text (EN)"
                fullWidth
                multiline
                minRows={2}
                value={textEn}
                onChange={(e) => setTextEn(e.target.value)}
              />
            </Stack>

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                startIcon={<MdEdit />}
                variant="contained"
                size="small"
                onClick={handleSaveClick}
                disabled={disabled}
              >
                حفظ
              </Button>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const LevelClauseCard = memo(LevelClauseCardBase);

export function LevelClausesDialog({ open, onClose, onUpdated }) {
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);

  // array of items (one per level that exists in the DB)
  const [clausesByLevel, setClausesByLevel] = useState([]);

  const fetchLevelClauses = async () => {
    if (!open) return;
    await getDataAndSet({
      url: "site-utilities/contract-utility/level-clauses",
      setData: setClausesByLevel,
      setLoading,
    });
  };

  useEffect(() => {
    if (open) {
      fetchLevelClauses();
    }
  }, [open]);

  // Create (POST) when the level has no row yet, update (PUT) otherwise.
  const handleSaveClause = async (clause) => {
    const isNew = !clause.id;

    const payload = {
      level: clause.level,
      textAr: clause.textAr,
      textEn: clause.textEn,
      order: clause.order ?? 0,
      isActive: clause.isActive ?? true,
    };

    const req = await handleRequestSubmit(
      payload,
      setToastLoading,
      isNew
        ? `site-utilities/contract-utility/level-clauses`
        : `site-utilities/contract-utility/level-clauses/${clause.id}`,
      false,
      "Saving",
      false,
      isNew ? "POST" : "PUT"
    );

    if (req.status === 200) {
      await fetchLevelClauses();
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
          {CONTRACT_LEVELSENUM.map((lvl) => {
            const clause =
              clausesByLevel?.find((lv) => lv.level === lvl.enum) || {};
            return (
              <LevelClauseCard
                key={lvl.enum}
                lvl={lvl}
                clause={clause}
                onSave={handleSaveClause}
                disabled={loading}
              />
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
