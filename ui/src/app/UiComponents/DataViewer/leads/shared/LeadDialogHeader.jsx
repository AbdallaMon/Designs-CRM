"use client";
import {
  Avatar,
  Box,
  Button,
  Chip,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { BsArrowLeft, BsFileText } from "react-icons/bs";
import { AiOutlineSwap } from "react-icons/ai";
import { MdWork } from "react-icons/md";
import { IoMdContract } from "react-icons/io";
import {
  ClientLeadStatus,
  CONTRACT_LEVELS,
  statusColors,
} from "@/app/helpers/constants";
import { contractLevelColors } from "@/app/helpers/colors";
import { generatePDF } from "@/app/UiComponents/buttons/GenerateLeadPdf";
import TelegramLink from "../../work-stages/utility/TelegramLink";
import UpdateInitialConsultButton from "../../../buttons/UpdateInitialConsultLead";
import ClientImageSessionManager from "../../image-session/users/ClientSessionImageManager";

/**
 * LeadDialogHeader component for lead preview dialogs
 * Displays lead information, status controls, and action buttons
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
}) => {
  const currentContract =
    lead.contracts && lead.contracts.length > 0 && lead.contracts[0];
  const levelColor = currentContract
    ? contractLevelColors[currentContract.contractLevel]
    : "#000000";

  return (
    <DialogTitle
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        pb: 0,
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
      }}
    >
      {/* Main Header Row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ py: 2, px: 1 }}
      >
        {/* Left Section - Lead Info */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
          {handleClose && (
            <IconButton
              onClick={() => handleClose(isPage)}
              sx={{
                backgroundColor: "#f5f5f5",
                "&:hover": { backgroundColor: "#e0e0e0" },
                mr: 1,
              }}
            >
              <BsArrowLeft size={18} />
            </IconButton>
          )}

          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 48,
              height: 48,
              fontSize: "1.2rem",
              fontWeight: 600,
            }}
          >
            {lead.client.name[0]}
          </Avatar>

          <Box>
            {(lead.status === "NEW" || lead.status === "ON_HOLD") && !admin ? (
              <Typography variant="h6" color="text.secondary">
                Lead Preview
              </Typography>
            ) : (
              <>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  {lead.client.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    #{lead.id.toString().padStart(7, "0")}
                  </Typography>
                  -------
                  <Typography variant="body2" color="text.secondary">
                    code {lead.code}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Stack>

        {/* Right Section - Status & Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {(admin || user.role === "STAFF") && currentContract && (
            <Chip
              icon={<IoMdContract sx={{ fontSize: "12px !important" }} />}
              label={
                currentContract
                  ? CONTRACT_LEVELS[currentContract.contractLevel]
                  : "No Contract"
              }
              sx={{
                fontWeight: "bold",
                fontSize: "0.875rem",
                color: levelColor,
                bgcolor: levelColor + "60",
                borderRadius: "0",
                cursor: "default",
                userSelect: "none",
              }}
            />
          )}

          {(admin || user.role === "STAFF") && lead.paymentStatus && (
            <Chip
              label={`Payment: ${lead.paymentStatus}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          )}

          {/* Status Button/Menu */}
          {user.role !== "ACCOUNTANT" && lead.status !== "NEW" && (
            <Button
              variant="contained"
              startIcon={<AiOutlineSwap size={16} />}
              onClick={handleClick}
              sx={{
                background: statusColors[lead.status],
                fontWeight: 500,
                borderRadius: "20px",
                px: 2,
                py: 0.5,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: "120px",
              }}
            >
              {ClientLeadStatus[lead.status]}
            </Button>
          )}

          {/* Start Deal or More Actions */}
          {lead.status === "NEW" && !admin ? (
            <Button onClick={() => createADeal(lead)} variant="contained">
              <MdWork size={16} style={{ marginRight: 12 }} />
              Start Deal
            </Button>
          ) : (
            MoreActionsComponent
          )}
        </Stack>
      </Stack>

      {/* Secondary Header Row - Quick Actions */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fafafa",
          px: 3,
          py: 1.5,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#ccc",
              borderRadius: 2,
            },
          }}
        >
          <TelegramLink lead={lead} setLead={setLead} />

          {lead.status !== "NEW" && (
            <UpdateInitialConsultButton clientLead={lead} />
          )}

          <ClientImageSessionManager clientLeadId={lead.id} />

          {lead.status === "FINALIZED" && lead.averagePrice && (
            <Chip
              label={`Final Price: ${lead.averagePrice}`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<BsFileText size={14} />}
            onClick={() => generatePDF(lead, user)}
            sx={{
              borderRadius: "16px",
              textTransform: "none",
              fontSize: "0.75rem",
              px: 2,
            }}
          >
            PDF
          </Button>

          {/* Additional header content from parent */}
          {additionalHeaderContent}
        </Stack>
      </Box>
    </DialogTitle>
  );
};
