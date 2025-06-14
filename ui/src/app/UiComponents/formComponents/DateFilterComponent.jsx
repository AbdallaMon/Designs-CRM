"use client";
import React, {useState, useEffect} from "react";
import {IconButton, Box, ButtonGroup, Button} from "@mui/material";
import {FaTimes} from "react-icons/fa";
import DateComponent from "@/app/UiComponents/FormComponents/MUIInputs/DateChangerComponent";
import RangeDateComponent from "@/app/UiComponents/FormComponents/MUIInputs/RangeDateComponent";

const DateFilterComponent = ({setFilters, filters}) => {
    const [filterType, setFilterType] = useState("day"); // 'day' or 'range'
    const [date, setDate] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        if (filterType === "day" && date) {
            setFilters({...filters, date, startDate: null, endDate: null})

        } else if (filterType === "range" && startDate && endDate) {
            setFilters({...filters, date: null, startDate, endDate})
        }
    }, [filterType, date, startDate, endDate]);

    const resetFilters = () => {
        setDate(null);
        setStartDate(null);
        setEndDate(null);
        setFilters({...filters, date: null, startDate: null, endDate: null})
    };

    return (
          <Box display="flex" alignItems="center" width="fit-content">
              <ButtonGroup variant="outlined" sx={{mr: 2}}>
                  <Button
                        onClick={() => setFilterType("day")}
                        variant={filterType === "day" ? "contained" : "outlined"}
                  >
                      Day
                  </Button>
                  <Button
                        onClick={() => setFilterType("range")}
                        variant={filterType === "range" ? "contained" : "outlined"}
                  >
                      Range
                  </Button>
              </ButtonGroup>

              <Box display="flex" flexGrow={1}>
                  {filterType === "day" ? (
                        <DateComponent
                              date={date}
                              handleDateChange={(newDate) => setDate(newDate)}
                              label="Select a day"
                        />
                  ) : (
                        <RangeDateComponent
                              startDate={startDate}
                              endDate={endDate}
                              handleStartDateChange={(newDate) => setStartDate(newDate)}
                              handleEndDateChange={(newDate) => setEndDate(newDate)}
                        />
                  )}
              </Box>

              <IconButton
                    aria-label="reset"
                    color="secondary"
                    onClick={resetFilters}
                    sx={{ml: 2}}
              >
                  <FaTimes/>
              </IconButton>
          </Box>
    );
};

export default DateFilterComponent;
