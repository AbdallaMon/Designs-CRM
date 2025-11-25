"use client";

import { Container, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import PdfUtility from "./PdfUtility";
import { useSearchParams } from "next/navigation";
import ContractPaymentConditionsManager from "./ContractPaymentConditions";
import ContractUtilityPage from "../contracts/ContractUtility";

export default function SiteUtilityManager() {
  const [value, setValue] = useState(0);
  const tabsData = [
    { label: "PDF Utility", component: <PdfUtility /> },
    {
      label: "Contract Payment Conditions",
      component: <ContractPaymentConditionsManager />,
    },
    {
      label: "Contract utility",
      component: <ContractUtilityPage />,
    },
  ];
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam) {
      if (tabParam !== value) {
        setValue(Number(tabParam));
      }
    }
  }, [tabParam, value]);
  const handleChange = (event, newValue) => {
    //we need to set searchParams here
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", newValue);
    const newRelativePathQuery =
      window.location.pathname + "?" + searchParams.toString();
    window.history.pushState(null, "", newRelativePathQuery);
    // setValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ position: "relative", py: 4 }}>
      <Tabs value={value} onChange={handleChange} centered>
        {tabsData.map((tab, index) => (
          <Tab label={tab.label} key={index} />
        ))}
      </Tabs>
      {tabsData.map((tab, index) => (
        <div
          role="tabpanel"
          hidden={value !== index}
          key={index}
          id={`tabpanel-${index}`}
        >
          {tab.component}
        </div>
      ))}
    </Container>
  );
}
