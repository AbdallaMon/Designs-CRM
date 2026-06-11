"use client";

// Price offers tab — lists the lead's price offers, exposes the New-offer dialog
// (canAddPriceOffer) and inline accept/reject (also gated on canAddPriceOffer, which the
// backend dto maps from lead.price_offer.manage). Body = shared LeadRecordList; the offer
// verdict (isAccepted) reads as a <StatusChip>.
//
// StatusChip resolves its SEMANTIC bucket purely from (domain, status) — it has no explicit
// semantic prop — so we pick a `payment`-domain enum value whose semantic matches the verdict
// (FULLY_PAID→success / OVERDUE→error / unknown→neutral) and override the visible Arabic label.

import { Typography } from "@mui/material";
import { MdRequestQuote } from "react-icons/md";
import dayjs from "dayjs";
import { StatusChip } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { LeadRecordList } from "../LeadRecordList.jsx";
import {
  NewPriceOfferDialog,
  PriceOfferStatusActions,
} from "../dialogs/PriceOfferDialog.jsx";

// isAccepted → { status (drives the semantic color), labelKey (resolved to the Arabic verdict) }.
// true → success "مقبول" · false → error "مرفوض" · null/undefined → neutral "قيد المراجعة".
const OFFER_VERDICT = {
  true: { status: "FULLY_PAID", labelKey: "leadsDetails.priceOffers.verdict.accepted" },
  false: { status: "OVERDUE", labelKey: "leadsDetails.priceOffers.verdict.rejected" },
  null: { status: "__REVIEW__", labelKey: "leadsDetails.priceOffers.verdict.review" },
};

function offerVerdict(isAccepted) {
  if (isAccepted === true) return OFFER_VERDICT.true;
  if (isAccepted === false) return OFFER_VERDICT.false;
  return OFFER_VERDICT.null;
}

function formatPrice(value) {
  if (value == null || value === "") return "؟";
  try {
    return new Intl.NumberFormat("ar-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value}`;
  }
}

export function PriceOffersTab({ lead, onChanged }) {
  const { t } = useT();
  const caps = lead?.capabilities ?? {};
  const offers = Array.isArray(lead?.priceOffers) ? lead.priceOffers : [];

  return (
    <LeadRecordList
      title={t("leadsDetails.priceOffers.title")}
      icon={<MdRequestQuote />}
      items={offers}
      headerAction={
        <NewPriceOfferDialog lead={lead} canAdd={caps.canAddPriceOffer} onCreated={onChanged} />
      }
      renderPrimary={(o) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {formatPrice(o.minPrice)} – {formatPrice(o.maxPrice)}
        </Typography>
      )}
      renderSecondary={(o) => (
        <Typography variant="body2" color="text.secondary" component="span">
          {o.note ? `${o.note} · ` : ""}
          {o.createdAt ? dayjs(o.createdAt).format("YYYY-MM-DD") : ""}
        </Typography>
      )}
      renderStatus={(o) => {
        const v = offerVerdict(o.isAccepted);
        return <StatusChip domain="payment" status={v.status} label={t(v.labelKey)} />;
      }}
      renderRowAction={(o) => (
        <PriceOfferStatusActions
          priceOffer={o}
          canManage={caps.canAddPriceOffer}
          onChanged={onChanged}
        />
      )}
      emptyTitle={t("leadsDetails.priceOffers.empty.title")}
      emptyDescription={
        caps.canAddPriceOffer
          ? t("leadsDetails.priceOffers.empty.canAdd")
          : t("leadsDetails.priceOffers.empty.readonly")
      }
    />
  );
}
