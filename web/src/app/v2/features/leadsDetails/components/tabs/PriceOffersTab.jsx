"use client";

// Price offers tab — lists the lead's price offers, exposes the New-offer dialog
// (canAddPriceOffer) and inline accept/reject (also gated on canAddPriceOffer, which the
// backend dto maps from lead.price_offer.manage).

import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  NewPriceOfferDialog,
  PriceOfferStatusActions,
} from "../dialogs/PriceOfferDialog.jsx";

export function PriceOffersTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const offers = Array.isArray(lead?.priceOffers) ? lead.priceOffers : [];

  return (
    <Stack spacing={2}>
      <NewPriceOfferDialog lead={lead} canAdd={caps.canAddPriceOffer} onCreated={onChanged} />
      {offers.length === 0 ? (
        <Typography color="text.secondary">لا توجد عروض أسعار</Typography>
      ) : (
        <List>
          {offers.map((o) => (
            <ListItem
              key={o.id}
              divider
              secondaryAction={
                <PriceOfferStatusActions priceOffer={o} canManage={caps.canAddPriceOffer} onChanged={onChanged} />
              }
            >
              <ListItemText
                primary={`${o.minPrice ?? "?"} - ${o.maxPrice ?? "?"}`}
                secondary={
                  <>
                    {o.note ? `${o.note} · ` : ""}
                    {o.createdAt ? dayjs(o.createdAt).format("YYYY-MM-DD") : ""}
                    {o.isAccepted != null ? ` · ${o.isAccepted ? "مقبول" : "مرفوض"}` : ""}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
