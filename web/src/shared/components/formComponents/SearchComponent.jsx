"use client";

import React, { useState, useEffect, useRef } from "react";
import { TextField, Box, Chip, CircularProgress } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  handleSearchParamsChange,
} from "@/app/helpers/functions/utility";
import { apiRequest } from "@/app/helpers/functions/apiClient";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatSearchOption,
  getNewLeadSearchHref,
  uniqueSearchResults,
} from "./search-options.js";

const SearchComponent = ({
  resource,
  profile,
  setFilters,
  inputLabel,
  renderKeys,
  resetTrigger,
  searchKey = "userId",
  restOtherFilters = false,
  withParamsChange = false,
  size,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const latestRequest = useRef(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const fetchSearchResults = async (query) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const response = await apiRequest(
        `utilities/search?${new URLSearchParams({
          resource,
          query,
          ...(profile ? { profile } : {}),
        })}`
      );
      const result = await response.json();
      if (requestId !== latestRequest.current) return;
      setSearchResults(
        response.ok ? uniqueSearchResults(result.data) : []
      );
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const timer = window.setTimeout(() => fetchSearchResults(searchTerm), 250);
      return () => {
        window.clearTimeout(timer);
        latestRequest.current += 1;
      };
    } else {
      latestRequest.current += 1;
      setSearchResults([]);
      setLoading(false);
    }
  }, [searchTerm, resource, profile]);

  const handleSelect = (event, newValue) => {
    const newLeadHref = getNewLeadSearchHref(newValue, resource);
    if (newLeadHref) {
      setSelectedItem(null);
      router.push(newLeadHref);
      return;
    }

    setSelectedItem(newValue);
    if (withParamsChange) {
      const param = { target: { value: newValue && newValue.id } };
      handleSearchParamsChange(param, searchKey, searchParams, router);
    }
    if (newValue) {
      if (restOtherFilters) {
        setFilters({ query: newValue, [searchKey]: newValue.id });
      } else {
        setFilters((prevFilters) => ({
          ...prevFilters,
          query: newValue,
          [searchKey]: newValue.id,
        }));
      }
    } else {
      setSearchTerm("");
      setFilters((prevFilters) => ({
        ...prevFilters,
        query: null,
        [searchKey]: null,
      }));
    }
  };

  useEffect(() => {
    if (resetTrigger !== null && resetTrigger !== undefined) {
      setSearchTerm("");
      setSelectedItem(null);
    }
  }, [resetTrigger]);

  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Autocomplete
        options={searchResults}
        getOptionKey={(option) => `${resource}-${option.id}`}
        getOptionLabel={(option) => formatSearchOption(option, resource, renderKeys)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          const isNewLead = Boolean(getNewLeadSearchHref(option, resource));
          return (
            <Box
              component="li"
              key={key}
              {...optionProps}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                {formatSearchOption(option, resource, renderKeys)}
              </Box>
              {isNewLead && (
                <Chip
                  label="New lead"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.68rem", flexShrink: 0 }}
                />
              )}
            </Box>
          );
        }}
        loading={loading}
        value={selectedItem}
        size={size}
        sx={{
          minWidth: 300,
          width: "100%",
        }}
        onChange={handleSelect}
        onInputChange={(event, newInputValue, reason) => {
          if (reason === "input" || reason === "clear") {
            setSearchTerm(newInputValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={inputLabel}
            variant="outlined"
            fullWidth
            type="search"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default SearchComponent;
