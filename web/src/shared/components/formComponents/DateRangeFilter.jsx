import React, { useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { MdClose } from "react-icons/md";

const DateRangeFilter = ({
  setFilters,
  noMargin,
  lastThreeMonth,
  dateKey = "range",
  startLabel,
  endLabel,
  withDeleteRange,
  noDefaultValues,
}) => {
  const [range, setRange] = useState(() =>
    noDefaultValues
      ? { start: null, end: null }
      : {
          start: dayjs()
            .subtract(lastThreeMonth ? 3 : 1, "month")
            .startOf("month"),
          end: dayjs(),
        }
  );

  useEffect(() => {
    if (!range.start && !range.end) return;

    setFilters((prevFilters) =>
      prevFilters
        ? {
            ...prevFilters,
            [dateKey]: {
              startDate: range.start ? range.start.format("YYYY-MM-DD") : null,
              endDate: range.end ? range.end.format("YYYY-MM-DD") : null,
            },
          }
        : {
            [dateKey]: {
              startDate: null,
              endDate: null,
            },
        }
    );
  }, [dateKey, range, setFilters]);

  const handleClearRange = () => {
    setRange({ start: null, end: null });
    setFilters((prevFilters) => {
      const { [dateKey]: _, ...rest } = prevFilters;
      return rest;
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box mb={noMargin ? 0 : 2}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <DatePicker
            label={startLabel || "Start Date"}
            value={range.start}
            onChange={(newValue) => setRange({ ...range, start: newValue })}
            slotProps={{ textField: { fullWidth: true } }}
            format="DD/MM/YYYY"
          />

          <DatePicker
            label={endLabel || "End Date"}
            value={range.end}
            onChange={(newValue) => setRange({ ...range, end: newValue })}
            slotProps={{ textField: { fullWidth: true } }}
            format="DD/MM/YYYY"
          />

          {withDeleteRange && (
            <IconButton
              onClick={handleClearRange}
              color="error"
              variant="outlined"
            >
              <MdClose />
            </IconButton>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeFilter;
