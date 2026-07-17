import React, { useEffect, useState } from "react";
import { Box, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
const DateRangeFilter = ({ setFilters, noMargin, lastThreeMonth }) => {
  const [range, setRange] = useState({
    start: dayjs()
      .subtract(lastThreeMonth ? 3 : 1, "month")
      .startOf("month"),
    end: dayjs(),
  });
  useEffect(() => {
    applyFilters();
  }, [range]);
  const applyFilters = () => {
    if (!range.start && !range.end) return;
    setFilters((prevFilters) => ({
      ...prevFilters,
      range: {
        startDate: range.start.format("YYYY-MM-DD"),
        endDate: range.end.format("YYYY-MM-DD"),
      },
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box mb={noMargin ? 0 : 2}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
          }}
        >
          <DatePicker
            label="Start Date"
            value={range.start}
            onChange={(newValue) => setRange({ ...range, start: newValue })}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />

          <DatePicker
            label="End Date"
            value={range.end}
            onChange={(newValue) => setRange({ ...range, end: newValue })}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeFilter;
