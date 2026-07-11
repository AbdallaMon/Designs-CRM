"use client";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import dayjs from "dayjs";
import { BsArrowRight, BsFileText } from "react-icons/bs";
import { AiOutlineSwap } from "react-icons/ai";
import {
  MdWork,
  MdTag,
  MdSchedule,
  MdOpenInNew,
  MdFullscreen,
  MdFullscreenExit,
} from "react-icons/md";
import { IoMdContract } from "react-icons/io";
import {
  ClientLeadStatus,
  CONTRACT_LEVELS,
  PaymentStatus,
  statusColors,
} from "@/app/helpers/constants";
import { contractLevelColors } from "@/app/helpers/colors";
import { generatePDF } from "@/shared/components/buttons/GenerateLeadPdf";
import TelegramLink from "@/features/work-stages/utility/TelegramLink.jsx";
import UpdateInitialConsultButton from "@/shared/components/buttons/UpdateInitialConsultLead.jsx";
import ClientImageSessionManager from "@/features/image-session/users/ClientSessionImageManager.jsx";

/**
 * LeadDialogHeader — the redesigned action header for the lead / deal detail.
 *
 * Two deliberate zones instead of the old scattered button salad:
 *   1. IDENTITY row — back, avatar, name, id/code/date, and (right) the current status
 *      as the single prominent control (click to change), plus contract / payment chips.
 *   2. ACTION BAR — one bordered surface that groups every action by intent:
 *        • the context primary CTA (Start Deal),
 *        • the tool actions (Telegram, image session, initial consult, PDF),
 *        • "open in a new tab" (only when shown as a modal from the kanban),
 *        • the overflow "More" menu (assign / convert / delete / payments).
 *
 * All previously-available actions are preserved — only reorganized.
 */
export const LeadDialogHeader = ({
  lead,
  theme,
  handleClose,
  isPage,
  admin,
  user,
  handleClick,
  setLead,
  createADeal,
  MoreActionsComponent,
  additionalHeaderContent,
  fullscreen,
  onToggleFullscreen,
}) => {
  const currentContract =
    lead.contracts && lead.contracts.length > 0 && lead.contracts[0];
  const levelColor = currentContract
    ? contractLevelColors[currentContract.contractLevel]
    : theme.palette.common.black;

  const isAnonymous =
    (lead.status === "NEW" || lead.status === "ON_HOLD") && !admin;
  const statusColor = statusColors[lead.status] || theme.palette.primary.main;

  // Prefer the backend-computed capability (permission code + object scope + workflow
  // lock) when the payload carries one — this is the parity-safe source of truth and
  // hides a status control the user could never successfully use. Fall back to the
  // legacy role rule for payloads without capabilities (e.g. the work-stage preview).
  // A NEW lead never exposes a change control.
  const canChangeStatus =
    lead.status !== "NEW" &&
    (lead.capabilities
      ? Boolean(lead.capabilities.canChangeStatus)
      : user.role !== "ACCOUNTANT");
  const showStartDeal = lead.status === "NEW" && !admin;

  // Small reusable meta pill for the identity row
  const MetaPill = ({ icon, children }) => (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.text.primary, 0.04),
        color: "text.secondary",
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 600, color: "inherit" }}>
        {children}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
      {/* ───────────────────────── Identity band ───────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2.5 },
          pb: 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.1
          )} 0%, ${alpha(theme.palette.primary.light, 0.04)} 55%, ${
            theme.palette.background.paper
          } 100%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Left: back + avatar + identity */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            {handleClose && (
              <Tooltip title="Back">
                <IconButton
                  onClick={() => handleClose(isPage)}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.shadows[1],
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <BsArrowRight size={18} />
                </IconButton>
              </Tooltip>
            )}

            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                width: 54,
                height: 54,
                fontSize: "1.35rem",
                fontWeight: 700,
                boxShadow: theme.shadows[2],
              }}
            >
              {lead.client.name[0]}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              {isAnonymous ? (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  fontWeight={600}
                >
                  Lead Preview
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="text.primary"
                    noWrap
                    sx={{ lineHeight: 1.2 }}
                  >
                    {lead.client.name}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 0.75 }}
                  >
                    <MetaPill icon={<MdTag size={13} />}>
                      {lead.id.toString().padStart(7, "0")}
                    </MetaPill>
                    {lead.code && (
                      <MetaPill icon={<MdTag size={13} />}>
                        {`code ${lead.code}`}
                      </MetaPill>
                    )}
                    {lead.createdAt && (
                      <MetaPill icon={<MdSchedule size={13} />}>
                        {dayjs(lead.createdAt).format("DD/MM/YYYY HH:mm")}
                      </MetaPill>
                    )}
                  </Stack>
                </>
              )}
            </Box>
          </Stack>

          {/* Right: status control + contract / payment chips */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
          >
            {canChangeStatus ? (
              <Tooltip title="Change status">
                <Button
                  variant="contained"
                  startIcon={<AiOutlineSwap size={16} />}
                  onClick={handleClick}
                  disableElevation
                  sx={{
                    background: statusColor,
                    color: theme.palette.common.white,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    fontSize: "0.85rem",
                    minWidth: 130,
                    boxShadow: `0 2px 8px ${alpha(statusColor, 0.45)}`,
                    "&:hover": {
                      background: statusColor,
                      filter: "brightness(0.95)",
                      boxShadow: `0 4px 12px ${alpha(statusColor, 0.55)}`,
                    },
                  }}
                >
                  {ClientLeadStatus[lead.status]}
                </Button>
              </Tooltip>
            ) : (
              <Chip
                label={ClientLeadStatus[lead.status] || lead.status}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  color: statusColor,
                  bgcolor: alpha(statusColor, 0.14),
                  border: `1px solid ${alpha(statusColor, 0.4)}`,
                }}
              />
            )}

            {(admin || user.role === "STAFF") && currentContract && (
              <Chip
                icon={<IoMdContract style={{ fontSize: 14 }} />}
                label={CONTRACT_LEVELS[currentContract.contractLevel]}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: levelColor,
                  bgcolor: alpha(levelColor, 0.16),
                  border: `1px solid ${alpha(levelColor, 0.4)}`,
                  borderRadius: 2,
                  cursor: "default",
                  userSelect: "none",
                  "& .MuiChip-icon": { color: levelColor },
                }}
              />
            )}

            {(admin || user.role === "STAFF") && lead.paymentStatus && (
              <Chip
                label={`Payment: ${PaymentStatus[lead.paymentStatus] || lead.paymentStatus}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />
            )}

            {lead.status === "FINALIZED" && lead.averagePrice && (
              <Chip
                label={`Final Price: ${lead.averagePrice}`}
                color="success"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      {/* ───────────────────────── Action bar ───────────────────────── */}
      <Box
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 3,
            },
            "& > *": { flexShrink: 0 },
          }}
        >
          {/* Primary CTA — start the deal (non-admin, NEW lead) */}
          {showStartDeal && (
            <Button
              onClick={() => createADeal(lead)}
              variant="contained"
              startIcon={<MdWork size={16} />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
            >
              Start Deal
            </Button>
          )}

          {/* Tool actions (self-contained action components) */}
          <TelegramLink lead={lead} setLead={setLead} />

          <ClientImageSessionManager clientLeadId={lead.id} />

          {lead.status !== "NEW" && (
            <UpdateInitialConsultButton
              clientLead={lead}
              onSuccess={(updated) =>
                setLead((old) => ({
                  ...old,
                  ...(updated || {}),
                  initialConsult: true,
                }))
              }
            />
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<BsFileText size={14} />}
            onClick={() => generatePDF(lead, user)}
            sx={{ borderRadius: 2, fontSize: "0.78rem", px: 2 }}
          >
            PDF
          </Button>

          {additionalHeaderContent}

          {/* push the right-aligned cluster to the end */}
          <Box sx={{ flex: 1, minWidth: 8 }} />

          {/* Fullscreen toggle — modal mode only (the standalone page is already
              full-bleed). The choice is remembered per-browser, so the next lead
              opened restores the same mode. */}
          {!isPage && onToggleFullscreen && (
            <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <IconButton
                onClick={() => onToggleFullscreen()}
                sx={(t) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  border: `1px solid ${t.palette.divider}`,
                  bgcolor: t.palette.background.paper,
                  boxShadow: t.shadows[1],
                  "&:hover": {
                    bgcolor: t.palette.action.hover,
                    borderColor: t.palette.primary.main,
                  },
                })}
              >
                {fullscreen ? (
                  <MdFullscreenExit size={20} />
                ) : (
                  <MdFullscreen size={20} />
                )}
              </IconButton>
            </Tooltip>
          )}

          {/* Open this lead in its own page, in a new browser tab — only meaningful
              from the kanban modal (on the standalone page you are already here). */}
          {!isPage && (
            <>
              <Tooltip title="Open in a new tab">
                <IconButton
                  component="a"
                  href={`/dashboard/deals/${lead.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={(t) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    border: `1px solid ${t.palette.divider}`,
                    bgcolor: t.palette.background.paper,
                    boxShadow: t.shadows[1],
                    "&:hover": {
                      bgcolor: t.palette.action.hover,
                      borderColor: t.palette.primary.main,
                    },
                  })}
                >
                  <MdOpenInNew size={18} />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {/* Overflow menu (assign / convert / delete / payments). The parent passes
              <MoreActionsMenu/> here; Start Deal is the bar's primary CTA above. */}
          {!showStartDeal && MoreActionsComponent}
        </Stack>
      </Box>
    </Box>
  );
};
