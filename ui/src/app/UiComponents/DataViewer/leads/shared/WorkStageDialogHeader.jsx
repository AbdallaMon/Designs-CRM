"use client";
import {
  Avatar,
  Box,
  Button,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { BsArrowLeft } from "react-icons/bs";
import Link from "next/link";
import TelegramLink from "../../work-stages/utility/TelegramLink";

/**
 * WorkStageDialogHeader component for work-stage preview dialogs
 * Displays designer/work-stage specific lead information
 */
export const WorkStageDialogHeader = ({
  lead,
  theme,
  handleClose,
  isPage,
  admin,
  user,
  setLead,
  twoDLink,
  dealLink,
}) => {
  return (
    <DialogTitle
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        pb: 2,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          {handleClose && (
            <IconButton onClick={() => handleClose(isPage)} sx={{ mr: 1 }}>
              <BsArrowLeft size={20} />
            </IconButton>
          )}
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {lead.client.name[0]}
          </Avatar>
          {(lead.status === "NEW" || lead.status === "ON_HOLD") && !admin ? (
            <Typography variant="h6" color="text.secondary">
              Lead Preview
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                #{lead.id.toString().padStart(7, "0")} {lead.client.name}
              </Typography>
              -------
              <Typography variant="body2" color="text.secondary">
                code {lead.code}
              </Typography>
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TelegramLink lead={lead} setLead={setLead} />
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-end"
        >
          {admin && (
            <>
              {dealLink && (
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  href={dealLink}
                >
                  See the deal
                </Button>
              )}
              {twoDLink && (
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  href={twoDLink}
                >
                  See the two d lead
                </Button>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </DialogTitle>
  );
};
