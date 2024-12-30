import React, {useEffect} from 'react';
import {FormControl, InputLabel, Select, MenuItem, CircularProgress, Box} from '@mui/material';
import {useRouter, useSearchParams} from "next/navigation";
import {handleSearchParamsChange} from "@/app/helpers/functions/utility";

const FilterSelect = ({label, options, param, onChange, loading, setFilters, reset,withAll=true}) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const current = searchParams.get(param)
    useEffect(() => {
        if (searchParams.get(param)) {
            if (reset) {
                setFilters({[param]: searchParams.get(param)})
            } else {
                setFilters((oldFilters) => ({...oldFilters, [param]: searchParams.get(param)}))
            }

        }
    }, [searchParams])

    function handleChange(event) {

        handleSearchParamsChange(event, param, searchParams, router, onChange)
        // if (onChange) return onChange(event)
        // const value = event.target.value;
        // const params = new URLSearchParams(searchParams);
        // if (value) {
        //     params.set(param, value);
        // } else {
        //     params.set(param, "all");
        // }
        // router.push(`?${params.toString()}`);
    }

    return (
          <Box width="100%">
              <FormControl variant="outlined" margin="normal" sx={{
                  mb: 2,
                  minWidth: "120px",

                  width: {
                      xs: '100%',
                      sm: 200,
                  },
              }}>
                  <InputLabel>{label}</InputLabel>
                  <Select
                        value={options?.find((option) => option.id == current)?.name || 'All '}
                        onChange={handleChange}
                        label={label}
                        disabled={loading}
                        renderValue={(selected) => {
                            if (loading) {
                                return (
                                      <Box display="flex" alignItems="center">
                                          <CircularProgress size={20} sx={{marginRight: 2}}/>
                                          <span>Loading</span>
                                      </Box>
                                );
                            }
                            return selected || 'All';
                        }}
                  >
                      {withAll&&
                      <MenuItem value="">All</MenuItem>
                      }
                      {options.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                                {option.name}
                            </MenuItem>
                      ))}
                  </Select>
              </FormControl>
          </Box>
    );
};

export default FilterSelect;
