"use client";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Button, Stack, Typography, useTheme } from "@mui/material";

import React from "react";
import ConfirmWithActionModel from "@/shared/components/models/ConfirmsWithActionModel.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import UpdateInitialConsultButton from "@/shared/components/buttons/UpdateInitialConsultLead";
import {
  MdCheck,
  MdHourglassEmpty,
  MdPreview,
  MdLocationOn,
  MdCategory,
  MdPhone,
} from "react-icons/md";
import PreviewDialog from "@/features/leads/PreviewLeadDialog.jsx";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { RecordCard, MetaItem, StatusPill, NameAvatar } from "@/features/leads/shared/tabKit.jsx";
import { LeadCategory } from "@/app/helpers/constants";

dayjs.extend(relativeTime);

/* ----------------------------------------------------------------------------
 * Lead card — rebuilt on the shared RecordCard. Same signature ({lead, setData})
 * and same action wiring as before, so NonConsultedLeads/OnHoldLeads keep working.
 * -------------------------------------------------------------------------- */
export function LeadSliderCard({ lead, setData }) {
  const { user } = useAuth();
  const theme = useTheme();
  const { setLoading } = useToastContext();
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const admin = checkIfAdmin(user);
  const isFullyPaid = lead.paymentStatus === "FULLY_PAID";

  const relative = dayjs(lead.createdAt).locale("ar").fromNow();
  const idLabel = `#${lead?.id.toString().padStart(7, "0")}`;

  const showContact =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "CONTACT_INITIATOR" ||
    user.isSuperSales;

  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (assign.status === 200) {
      setData((data) => data.filter((l) => l.id !== lead.id));
    }
    return assign;
  }

  const category = LeadCategory[lead.selectedCategory] || lead.selectedCategory;
  const location = lead.country || lead.emirate;

  return (
    <>
      <RecordCard
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        accent={isFullyPaid ? theme.palette.success.main : undefined}
        leading={
          showContact ? <NameAvatar name={lead.client?.name} /> : undefined
        }
        title={showContact ? lead.client?.name : idLabel}
        subtitle={`${idLabel} · ${relative}`}
        status={
          <StatusPill
            label={lead.paymentStatus}
            color={
              isFullyPaid
                ? theme.palette.success.main
                : theme.palette.text.secondary
            }
            icon={
              isFullyPaid ? (
                <MdCheck size={14} />
              ) : (
                <MdHourglassEmpty size={14} />
              )
            }
          />
        }
        meta={
          <>
            {category && (
              <MetaItem
                icon={<MdCategory size={14} />}
                label="Category"
                value={category}
              />
            )}
            {location && (
              <MetaItem
                icon={<MdLocationOn size={14} />}
                label="Location"
                value={location}
              />
            )}
            {showContact && lead.client?.phone && (
              <MetaItem icon={<MdPhone size={14} />} value={lead.client.phone} />
            )}
          </>
        }
        actions={
          <Stack spacing={1} sx={{ width: "100%" }}>
            {user.role === "STAFF" && !user.isSuperSales && (
              <ConfirmWithActionModel
                title="Are you sure you want to get this lead and assign it to you as a new deal?"
                handleConfirm={() => createADeal(lead)}
                label="Start a Deal"
                fullWidth={true}
                size="small"
                variant="contained"
              />
            )}
            <UpdateInitialConsultButton clientLead={lead} fullWidth />
            {user.role !== "CONTACT_INITIATOR" && (
              <Button
                fullWidth
                onClick={() => setPreviewDialogOpen(true)}
                variant="outlined"
                size="small"
                startIcon={<MdPreview />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Preview Details
              </Button>
            )}
          </Stack>
        }
      >
        {lead.description && (
          <Typography
            variant="body2"
            color="text.primary"
            title={lead.description}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lead.description}
          </Typography>
        )}
      </RecordCard>
      <PreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        setleads={setData}
        id={lead.id}
        admin={admin}
      />
    </>
  );
}
