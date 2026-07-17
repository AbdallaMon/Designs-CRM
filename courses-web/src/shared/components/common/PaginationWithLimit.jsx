import {Box, FormControl, MenuItem, Pagination, Select, Typography} from "@mui/material";
import {totalLimitPages} from "@/app/helpers/constants";
import React from "react";

export default function PaginationWithLimit({page, totalPages, limit, setPage, setLimit, total}) {
    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleLimitChange = (event) => {
        const newLimit = parseInt(event.target.value, 10);
        setLimit(newLimit);

        const newPage = Math.min(page, Math.ceil(total / newLimit));
        setPage(newPage);
    };
    return (
          <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row-reverse'
              ,py:2,px:2
          }}>
              <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
              />
              <Box sx={{display: 'flex', alignItems: 'center'}}>
                  <Typography variant="body2" sx={{marginRight: '8px'}}>
                      Items per page
                  </Typography>
                  <FormControl variant="outlined" size="small">
                      <Select
                            value={limit}
                            onChange={handleLimitChange}
                            sx={{backgroundColor: 'white'}}
                      >
                          {totalLimitPages.map((size) => (
                                <MenuItem key={size} value={size}>
                                    {size}
                                </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
              </Box>
          </Box>

    )
}