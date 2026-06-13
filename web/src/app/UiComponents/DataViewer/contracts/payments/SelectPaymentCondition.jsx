import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { Autocomplete, Box, TextField } from "@mui/material";
import { useEffect, useState } from "react";

export default function SelectPaymentCondition({
  initialCondition,
  onConditionChange,
  disabled,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  useEffect(() => {
    const fetchData = async () => {
      const req = await getDataAndSet({
        url: "shared/site-utilities/contract-payment-conditions",
        setData,
        setLoading,
      });
      if (initialCondition) {
        const found = req?.data.find(
          (condition) => condition.id === initialCondition.value
        );
        if (found) {
          setSelectedCondition(found);
        }
      }
    };
    fetchData();
  }, []);

  const handleConditionChange = (event, newValue) => {
    console.log(newValue, "condition changed");
    setSelectedCondition(newValue);
    onConditionChange(newValue);
  };
  return (
    <>
      <Box sx={{ position: "relative" }}>
        {loading && <LoadingOverlay />}
        <Autocomplete
          id="payment-condition-select"
          options={data}
          autoHighlight
          getOptionLabel={(option) => option.labelAr}
          value={selectedCondition}
          onChange={handleConditionChange}
          disabled={disabled || loading}
          renderInput={(params) => (
            <TextField {...params} label="Select Payment Condition" />
          )}
        />
      </Box>
    </>
  );
}
