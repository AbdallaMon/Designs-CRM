import { PROFILES } from "@dms/shared";
import React from "react";
import {
  alpha,
  Box,
  Button,
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
} from "react-icons/fa";
import { AddPriceOffers } from "@/features/leads/dialogs/PriceOffersDialog.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "@/shared/components/common/DeleteModelButton.jsx";
import { FilePreview } from "@/shared/components/utility/Files.jsx";

import LeadContractList from "@/features/contracts/ContractsList.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/features/leads/shared/TabLoading.jsx";
import { useLeadTab } from "@/features/leads/context/LeadDetailsContext.jsx";
import {
  TabSection,
  RecordCard,
  MetaItem,
  CardBlock,
  StatusPill,
} from "@/features/leads/shared/tabKit.jsx";

export function PriceOffersList({ admin, lead, notUser }) {
  const {
    data: offers,
    onMutated: setOffers,
    showLoading,
    error,
    refetch,
  } = useLeadTab("priceOffers", { fallback: lead?.priceOffers });
  const theme = useTheme();

  if (showLoading) return <TabLoading />;

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddPriceOffer)
    : !notUser;

  return (
    <Stack spacing={4}>
      {/* Price offers — small, uniform cards: capped height, scrolls inside itself. */}
      <TabSection
        icon={<FaMoneyBillWave />}
        title="Price Offers"
        count={offers?.length || 0}
        action={
          canCreate ? <AddPriceOffers lead={lead} setPriceOffers={setOffers} /> : null
        }
      >
        {error ? (
          <EmptyState
            icon={<FaMoneyBillWave />}
            title="Couldn't load price offers"
            description="Something went wrong while loading the price offers. Please try again."
            action={
              <Button
                variant="outlined"
                onClick={() => refetch()}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Retry
              </Button>
            }
          />
        ) : !offers?.length ? (
          <EmptyState
            icon={<FaMoneyBillWave />}
            title="No price offers"
            description={
              !canCreate
                ? "There are no price offers for this lead."
                : "Add a price offer to share pricing with this lead."
            }
          />
        ) : (
          <Box
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              pr: 0.5,
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 3,
              },
            }}
          >
            <Stack spacing={1.5}>
              {offers.map((offer) => {
                const c = offer.isAccepted
                  ? theme.palette.success.main
                  : theme.palette.grey[500];
                return (
                  <RecordCard
                    key={offer.id}
                    accent={c}
                    title={
                      offer.minPrice
                        ? `${Number(offer.minPrice).toLocaleString()} - ${Number(
                            offer.maxPrice
                          ).toLocaleString()} AED`
                        : "Price offer"
                    }
                    status={
                      <StatusPill
                        label={offer.isAccepted ? "Accepted" : "Pending"}
                        color={c}
                      />
                    }
                    meta={
                      <>
                        <MetaItem
                          icon={<FaUserAlt size={13} />}
                          value={offer.user?.name}
                        />
                        <MetaItem
                          icon={<FaCalendarAlt size={13} />}
                          value={dayjs(offer.createdAt).format("YYYY-MM-DD HH:mm")}
                        />
                      </>
                    }
                    actions={
                      <>
                        <PriceOfferSwitch priceOffer={offer} setPriceOffers={setOffers} />
                        <DeleteModelButton
                          item={offer}
                          model={"PriceOffers"}
                          contentKey={offer.note ? "note" : "url"}
                          onDelete={() =>
                            setOffers((old) => old.filter((o) => o.id !== offer.id))
                          }
                        />
                      </>
                    }
                  >
                    {offer.note && <CardBlock label="Note">{offer.note}</CardBlock>}
                    {offer.url && <FilePreview file={{ url: offer.url }} />}
                  </RecordCard>
                );
              })}
            </Stack>
          </Box>
        )}
      </TabSection>

      {/* Contracts — tall, variable content: bare, uncapped, flows and grows. */}
      <LeadContractList leadId={lead.id} lead={lead} />
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
      `leads/price-offers/change-status`,
      false,
      "Updating"
    );
    if (request.status === 200) {
      const nextAccepted =
        request.data?.isAccepted ?? event.target.checked;
      setChecked(nextAccepted);
      if (setPriceOffers) {
        setPriceOffers((oldPrices) =>
          oldPrices.map((offer) =>
            offer.id === priceOffer.id
              ? { ...offer, isAccepted: nextAccepted }
              : offer
          )
        );
      }
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Typography variant="caption" color="text.secondary">
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
              ![PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES].includes(user.profile) &&
              user.profile !== PROFILES.ADMIN &&
              user.profile !== PROFILES.SUPER_ADMIN &&
              user.profile !== PROFILES.SUPER_SALES
            }
          />
        </Box>
      </Tooltip>
    </Box>
  );
}
