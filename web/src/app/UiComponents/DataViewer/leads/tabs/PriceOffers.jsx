import React from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import {
  FaMoneyBillWave,
  FaUserAlt,
  FaCalendarAlt,
  FaFileContract,
} from "react-icons/fa";
import { RiExternalLinkLine } from "react-icons/ri";
import { AddPriceOffers } from "@/app/UiComponents/DataViewer/leads/dialogs/PriceOffersDialog.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "../../../common/DeleteModelButton";

import LeadContractList from "../../contracts/ContractsList";
import { SectionToolbar } from "../shared/SectionToolbar";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";

function MetaItem({ icon, label, value, theme }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          flexShrink: 0,
          fontSize: 15,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export function PriceOffersList({ admin, lead, notUser }) {
  const { data: offers, onMutated: setOffers, showLoading } = useLeadTab(
    "priceOffers",
    { fallback: lead?.priceOffers }
  );
  const theme = useTheme();

  if (showLoading) return <TabLoading />;

  return (
    <Stack spacing={3}>
      {/* Contracts section */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontSize: 20,
            }}
          >
            <FaFileContract />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Contracts
          </Typography>
        </Stack>
        <Box sx={{ maxHeight: 350, overflowY: "auto", p: 2 }}>
          <LeadContractList leadId={lead.id} lead={lead} />
        </Box>
      </Paper>

      {/* Price offers section */}
      <SectionToolbar
        icon={<FaMoneyBillWave />}
        title="Price Offers"
        count={offers?.length || 0}
        countLabel="offers"
        action={
          !notUser ? (
            <AddPriceOffers lead={lead} setPriceOffers={setOffers} />
          ) : null
        }
      />

      {!offers?.length ? (
        <EmptyState
          icon={<FaMoneyBillWave />}
          title="No price offers"
          description={
            notUser
              ? "There are no price offers for this lead."
              : "Add a price offer to share pricing with this lead."
          }
        />
      ) : (
        <Stack spacing={2}>
          {offers.map((offer) => (
            <Paper
              key={offer.id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: `1px solid ${
                  offer.isAccepted
                    ? alpha(theme.palette.success.main, 0.5)
                    : theme.palette.divider
                }`,
                bgcolor: offer.isAccepted
                  ? alpha(theme.palette.success.main, 0.04)
                  : "background.paper",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.shadows[3],
                },
              }}
            >
              <Stack spacing={2}>
                {/* Header: status chip + actions */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Chip
                    size="small"
                    label={offer.isAccepted ? "Accepted" : "Pending"}
                    color={offer.isAccepted ? "success" : "default"}
                    sx={{ fontWeight: 600 }}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    {offer.url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={offer.url}
                        target="_blank"
                        startIcon={<RiExternalLinkLine size={16} />}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Attachment
                      </Button>
                    )}
                    <PriceOfferSwitch
                      priceOffer={offer}
                      setPriceOffers={setOffers}
                    />
                    <DeleteModelButton
                      item={offer}
                      model={"PriceOffers"}
                      contentKey={offer.note ? "note" : "url"}
                      onDelete={() => {
                        setOffers((oldOffers) =>
                          oldOffers.filter((o) => o.id !== offer.id)
                        );
                      }}
                    />
                  </Stack>
                </Stack>

                {offer.minPrice && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Price Range (AED)
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {offer.minPrice.toLocaleString()} -{" "}
                      {offer.maxPrice.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <MetaItem
                    icon={<FaUserAlt />}
                    label="Added By"
                    value={offer.user.name}
                    theme={theme}
                  />
                  <MetaItem
                    icon={<FaCalendarAlt />}
                    label="Created At"
                    value={dayjs(offer.createdAt).format("YYYY-MM-DD HH:mm")}
                    theme={theme}
                  />
                </Stack>

                {offer.note && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ fontWeight: 700 }}
                      >
                        Note
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {offer.note}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function PriceOfferSwitch({ priceOffer, setPriceOffers }) {
  const [checked, setChecked] = React.useState(priceOffer.isAccepted);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const handleChange = async (event) => {
    const request = await handleRequestSubmit(
      { priceOfferId: priceOffer.id, isAccepted: event.target.checked },
      setLoading,
      `shared/client-leads/price-offers/change-status`,
      false,
      "Updating"
    );
    if (request.status === 200) {
      setChecked(request.data.isAccepted);
      if (setPriceOffers) {
        setPriceOffers((oldPrices) =>
          oldPrices.map((offer) => {
            if (offer.id === priceOffer.id) {
              offer.isAccepted = checked;
            }
            return offer;
          })
        );
      }
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Typography variant="body2" color="text.secondary">
        {checked ? "Accepted" : "Accept"}
      </Typography>
      <Tooltip title="Toggle to accept or reject the price offer">
        <Box component="span">
          <Switch
            size="small"
            checked={checked}
            onChange={handleChange}
            inputProps={{ "aria-label": "Accept Price Offer" }}
            disabled={
              user.role !== "STAFF" &&
              user.role !== "ADMIN" &&
              user.role !== "SUPER_ADMIN" &&
              user.role !== "SUPER_SALES"
            }
          />
        </Box>
      </Tooltip>
    </Box>
  );
}
