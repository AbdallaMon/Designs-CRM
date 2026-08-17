"use client";
import { LEAD_STATUSES, PROFILES } from "@dms/shared";
import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Fade,
  Menu,
  MenuItem,
  Modal,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { BsPersonCheck } from "react-icons/bs";
import { MdMoreHoriz, MdWork } from "react-icons/md";
import DeleteModal from "@/shared/components/models/DeleteModal.jsx";
import { AssignNewStaffModal } from "@/features/leads/AssignNewStaffModal.jsx";
import { useLeadDetails } from "@/features/leads/context/LeadDetailsContext.jsx";
import AddPayments from "@/features/leads/payments/AddPayments.jsx";
import PaymentDialog from "@/features/leads/payments/PaymentsDialog.jsx";

/**
 * MoreActionsMenu component for lead actions dropdown
 * Provides contextual actions based on user role and lead status
 */
export const MoreActionsMenu = ({
  lead,
  admin,
  user,
  isPage,
  setleads,
  setLead,
  payments,
  setPayments,
  paymentModal,
  setPaymentModal,
  openConfirm,
  setOpenConfirm,
  createADeal,
  handleConvertLead,
}) => {
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const moreOpen = Boolean(moreAnchorEl);
  const details = useLeadDetails();

  const handleMoreClick = (event) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={handleMoreClick}
        variant="outlined"
        startIcon={<MdMoreHoriz size={18} />}
        sx={(theme) => ({
          height: 40,
          borderRadius: 2,
          px: 1.75,
          fontWeight: 600,
          textTransform: "none",
          borderColor: theme.palette.divider,
          color: "text.primary",
          bgcolor: theme.palette.background.paper,
          "&:hover": {
            bgcolor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        })}
      >
        Actions
      </Button>

      <Menu
        anchorEl={moreAnchorEl}
        open={moreOpen}
        onClose={handleMoreClose}
        PaperProps={{
          sx: (theme) => ({
            mt: 1,
            borderRadius: 2,
            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
            minWidth: 240,
            py: 0.5,
          }),
        }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, color: "text.disabled", letterSpacing: 0.6 }}
          >
            Lead Actions
          </Typography>
        </Box>
        <Divider />
        {/* Convert Lead Action - Staff Only */}
        {!admin &&
          [PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES].includes(user.profile) &&
          lead.status !== LEAD_STATUSES.FINALIZED &&
          lead.status !== LEAD_STATUSES.NEW && (
            <MenuItem
              onClick={() => {
                setOpenConfirm(true);
              }}
              sx={{ py: 1.5 }}
            >
              <BsPersonCheck size={16} style={{ marginRight: 12 }} />
              Convert Lead
            </MenuItem>
          )}

        {/* Start Deal Action - Non-owner Staff */}
        {isPage &&
          user.id !== lead.userId &&
          !admin &&
          user.profile !== PROFILES.ACCOUNTANT && (
            <MenuItem
              onClick={() => {
                createADeal(lead);
              }}
              sx={{ py: 1.5 }}
            >
              <MdWork size={16} style={{ marginRight: 12 }} />
              Start Deal
            </MenuItem>
          )}

        {/* Admin Actions */}
        {admin && [
          <MenuItem
            key="delete-action"
            disableRipple
            sx={{
              px: 1.25,
              py: 0.75,
              "&:hover": { bgcolor: "transparent" },
              "& > *": { width: "100%" },
            }}
          >
            <DeleteModal
              item={lead}
              href={"admin/client-leads"}
              fullButtonWidth={true}
              handleClose={() => {
                // Remove the deleted lead from local state instead of a full page reload.
                if (setleads) {
                  setleads((prev) => prev.filter((l) => l.id !== lead.id));
                } else if (details?.refetchCore) {
                  details.refetchCore();
                  details.refreshKanban?.();
                } else {
                  window.location.reload();
                }
              }}
            />
          </MenuItem>,
          <MenuItem
            key="assign-action"
            disableRipple
            sx={{
              px: 1.25,
              py: 0.75,
              "&:hover": { bgcolor: "transparent" },
              "& > *": { width: "100%" },
            }}
          >
            <AssignNewStaffModal
              lead={lead}
              onUpdate={(newLead) => {
                if (setLead) {
                  setLead((oldLead) => ({
                    ...oldLead,
                    assignedTo: { ...newLead.assignedTo },
                    status: newLead.status,
                  }));
                } else if (setleads) {
                  setleads((oldLeads) =>
                    oldLeads.map((l) => {
                      if (l.id === lead.id) {
                        return {
                          ...lead,
                          assignedTo: { ...newLead.assignedTo },
                          status: newLead.status,
                        };
                      } else {
                        return l;
                      }
                    })
                  );
                } else if (details?.refetchCore) {
                  details.refetchCore();
                  details.refreshKanban?.();
                }
              }}
            />
          </MenuItem>,
        ]}

        {/* Payment Actions - Finalized/Archived Only */}
        {(lead.status === LEAD_STATUSES.FINALIZED || lead.status === "ARCHIVED") && [
          ([PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES].includes(user.profile) ||
            user.profile === PROFILES.SUPER_ADMIN ||
            user.profile === PROFILES.ADMIN) &&
            (!payments || payments?.length < 1) && (
              <MenuItem
                key="add-payment"
                disableRipple
                sx={{
                  px: 1.25,
                  py: 0.75,
                  "&:hover": { bgcolor: "transparent" },
                  "& > *": { width: "100%" },
                }}
              >
                <AddPayments
                  fullButtonWidth={true}
                  lead={lead}
                  open={paymentModal}
                  paymentType={"final-price"}
                  setOpen={setPaymentModal}
                  totalAmount={lead.averagePrice}
                  setOldPayments={setPayments}
                />
              </MenuItem>
            ),
          payments?.length > 0 && (
            <MenuItem
              key="view-payment"
              disableRipple
              sx={{
              px: 1.25,
              py: 0.75,
              "&:hover": { bgcolor: "transparent" },
              "& > *": { width: "100%" },
            }}
            >
              <PaymentDialog payments={payments} fullWidth />
            </MenuItem>
          ),
        ]}
      </Menu>

      {/* Convert Lead Confirmation Modal */}
      <Modal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        closeAfterTransition
      >
        <Fade in={openConfirm}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "white",
              borderRadius: 3,
              boxShadow: 24,
              p: 3,
            }}
          >
            <Typography variant="h6" component="h2" mb={2}>
              Convert Lead
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Convert this lead so someone else can take it?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setOpenConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleConvertLead}
                color="primary"
              >
                Confirm
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};
