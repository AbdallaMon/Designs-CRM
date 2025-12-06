"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { BsPersonCheck } from "react-icons/bs";
import { MdMoreHoriz, MdWork } from "react-icons/md";
import DeleteModal from "../../../models/DeleteModal";
import { AssignNewStaffModal } from "../../utility/AssignNewStaffModal";
import AddPayments from "../payments/AddPayments";
import PaymentDialog from "../payments/PaymentsDialog";

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

  const handleMoreClick = (event) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleMoreClick}
        sx={{
          backgroundColor: "#c7a9a9ff",
          "&:hover": { backgroundColor: "#e0e0e0" },
          width: 40,
          height: 40,
        }}
      >
        <MdMoreHoriz size={18} />
      </IconButton>

      <Menu
        anchorEl={moreAnchorEl}
        open={moreOpen}
        onClose={handleMoreClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 200,
          },
        }}
      >
        {/* Convert Lead Action - Staff Only */}
        {!admin &&
          user.role === "STAFF" &&
          lead.status !== "FINALIZED" &&
          lead.status !== "NEW" && (
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
          user.role !== "ACCOUNTANT" && (
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
        {admin && (
          <>
            <MenuItem>
              <DeleteModal
                item={lead}
                href={"admin/client-leads"}
                fullButtonWidth={true}
                handleClose={() => {
                  window.location.reload();
                }}
              />
            </MenuItem>
            <MenuItem>
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
                  } else {
                    window.location.reload();
                  }
                }}
              />
            </MenuItem>
          </>
        )}

        {/* Payment Actions - Finalized/Archived Only */}
        {(lead.status === "FINALIZED" || lead.status === "ARCHIVED") && (
          <>
            {(user.role === "STAFF" ||
              user.role === "SUPER_ADMIN" ||
              user.role === "ADMIN") &&
              (!payments || payments?.length < 1) && (
                <MenuItem>
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
              )}
            {payments?.length > 0 && (
              <MenuItem sx={{ py: 1.5 }}>
                <PaymentDialog payments={payments} />
              </MenuItem>
            )}
          </>
        )}
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
