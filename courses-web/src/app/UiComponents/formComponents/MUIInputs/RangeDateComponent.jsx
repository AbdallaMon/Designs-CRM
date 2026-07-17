import {Box, TextField} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import {MobileDatePicker} from "@mui/x-date-pickers"; // Import the locale you want to use

// Ensure the locale is set to day/month/year
dayjs.locale("en-gb");

export default function RangeDateComponent({
                                               startDate,
                                               endDate,
                                               handleStartDateChange,
                                               handleEndDateChange
                                           }) {
    return (
          <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                  <MobileDatePicker
                        label="Start Date"
                        value={startDate ? dayjs(startDate) : null}
                        sx={{minWidth: 120}}
                        onChange={(newDate) => handleStartDateChange(newDate ? newDate.format('YYYY-MM-DD') : null)}
                        renderInput={(params) => (
                              <TextField
                                    {...params}
                              />
                        )}
                  />
                  <Box sx={{mx: 2}}> to </Box>
                  <MobileDatePicker
                        label="End Date"
                        value={endDate ? dayjs(endDate) : null}
                        sx={{minWidth: 120}}

                        onChange={(newDate) => handleEndDateChange(newDate ? newDate.format('YYYY-MM-DD') : null)}
                        renderInput={(params) => (
                              <TextField
                                    {...params}
                              />
                        )}
                  />
              </LocalizationProvider>
          </Box>
    );
}
