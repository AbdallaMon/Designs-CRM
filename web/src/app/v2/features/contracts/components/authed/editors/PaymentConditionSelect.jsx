"use client";

// Payment-condition picker for a contract payment. Reads the contract payment conditions via
// the contracts service (→ GET /v2/site-utilities/contract-payment-conditions, gated
// server-side on site_utility.payment_condition.list). Ported from the legacy
// SelectPaymentCondition, Arabic-only.

import { useEffect, useState } from "react";
import { Autocomplete, Box, TextField, LinearProgress } from "@mui/material";
import contractsService from "../../../contracts.service.js";

export default function PaymentConditionSelect({ initialCondition, onConditionChange, disabled }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(initialCondition || null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await contractsService.getPaymentConditions();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;
        setData(list);
        if (initialCondition) {
          const found = list.find((c) => c.id === (initialCondition.id ?? initialCondition.value));
          if (found) setSelected(found);
        }
      } catch {
        if (active) setData([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      {loading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}
      <Autocomplete
        id="payment-condition-select"
        options={data}
        autoHighlight
        getOptionLabel={(option) => option?.labelAr || ""}
        isOptionEqualToValue={(o, v) => o?.id === v?.id}
        value={selected}
        onChange={(_e, newValue) => {
          setSelected(newValue);
          onConditionChange(newValue);
        }}
        disabled={disabled || loading}
        renderInput={(params) => <TextField {...params} size="small" label="اختر شرط الدفع" />}
      />
    </Box>
  );
}
