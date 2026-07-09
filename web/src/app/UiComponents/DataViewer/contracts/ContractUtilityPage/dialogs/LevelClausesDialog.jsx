"use client";

import { useEffect, useState } from "react";
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
import { useAlertContext } from "@/app/providers/MuiAlert";

export function LevelClausesDialog({ open, onClose, onUpdated }) {
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
