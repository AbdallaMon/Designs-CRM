// PartyTwoObligations.jsx
import React from "react";
import { SectionCard, BulletText } from "./primitives";

export default function PartyTwoObligations({ lng, contractUtility }) {
  return (
    <SectionCard
      title={lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations"}
      dense
    >
      <BulletText
        text={
          lng === "ar"
            ? contractUtility.obligationsPartyTwoAr
            : contractUtility.obligationsPartyTwoEn
        }
      />
    </SectionCard>
  );
}
