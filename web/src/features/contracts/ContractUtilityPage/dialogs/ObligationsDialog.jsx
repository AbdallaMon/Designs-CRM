"use client";

import { useEffect, useState } from "react";
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
  Stack,
  Divider,
} from "@mui/material";
import { MdEdit, MdArticle, MdClose } from "react-icons/md";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

export function ObligationsDialog({ open, onClose, onUpdated }) {
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);

  const [partyOneAr, setPartyOneAr] = useState("");
  const [partyOneEn, setPartyOneEn] = useState("");
  const [partyTwoAr, setPartyTwoAr] = useState("");
  const [partyTwoEn, setPartyTwoEn] = useState("");

  const fetchObligations = async () => {
    if (!open) return;
    const req = await getData({
      url: "site-utilities/contract-utility/obligations",
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
      `site-utilities/contract-utility/obligations`,
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
