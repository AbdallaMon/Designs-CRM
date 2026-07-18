"use client";
// Quick "generate session link" dialog for the contract CARD. Mirrors the per-language
// generate/copy flow that lives inline in ViewContract's PdfBlock, but in a compact modal
// reachable straight from the card menu — so you don't have to open the full contract view
// just to hand a client their signing link. All logic is the shared contractSessionLink
// module (same `generate-pdf-token` action + same URL).
import { Fragment, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { FaCopy, FaLink, FaPlay } from "react-icons/fa";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  buildSessionUrl,
  copyToClipboard,
  generateContractPdfToken,
} from "@/features/contracts/contractSessionLink.js";

// One language row: current session link (if a token exists) + copy + generate/regenerate.
function LangBlock({ lang, label, token, contractId, onGenerated }) {
  const theme = useTheme();
  const { setLoading } = useToastContext();
  const sessionUrl = buildSessionUrl(token);

  const generate = async () => {
    const res = await generateContractPdfToken({ contractId, lang, setLoading });
    if (res?.status === 200) await onGenerated?.();
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {label}
        </Typography>
        {!token && <Chip label="No session yet" size="small" variant="outlined" />}
      </Stack>

      {token ? (
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}
          >
            <FaLink size={12} style={{ flexShrink: 0 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ wordBreak: "break-all", flex: 1 }}
            >
              {sessionUrl}
            </Typography>
            <Tooltip title="Copy session link">
              <IconButton size="small" onClick={() => copyToClipboard(sessionUrl)}>
                <FaCopy size={13} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FaPlay size={11} />}
            onClick={generate}
            fullWidth
          >
            Regenerate session
          </Button>
        </Stack>
      ) : (
        <Button
          size="small"
          variant="contained"
          startIcon={<FaPlay size={11} />}
          onClick={generate}
          fullWidth
        >
          Generate session
        </Button>
      )}
    </Box>
  );
}

export default function ContractGenerateLinkDialog({
  open,
  onClose,
  contract,
  onReload,
}) {
  const theme = useTheme();
  if (!contract) return null;

  // Mirror ViewContract: AR is always available; EN is offered once the AR PDF exists.
  const showEn = Boolean(contract.pdfLinkAr || contract.enToken);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <FaLink size={15} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            Session link
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {contract.title || contract.enTitle || `Contract #${contract.id}`}
          </Typography>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={1.5}>
          <LangBlock
            lang="ar"
            label="Arabic (AR)"
            token={contract.arToken}
            contractId={contract.id}
            onGenerated={onReload}
          />
          {showEn && (
            <Fragment>
              <LangBlock
                lang="en"
                label="English (EN)"
                token={contract.enToken}
                contractId={contract.id}
                onGenerated={onReload}
              />
            </Fragment>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
