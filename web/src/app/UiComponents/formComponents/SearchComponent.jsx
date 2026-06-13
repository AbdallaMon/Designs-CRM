"use client";

import React, { useState, useEffect } from "react";
import { TextField, Box, CircularProgress } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  getPropertyValue,
  handleSearchParamsChange,
} from "@/app/helpers/functions/utility";
import { useRouter, useSearchParams } from "next/navigation";

const SearchComponent = ({
  apiEndpoint,
  setFilters,
  inputLabel,
  renderKeys,
  mainKey,
  resetTrigger,
  searchKey = "userId",
  localFilters,
  restOtherFilters = false,
  withParamsChange = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const fetchSearchResults = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_URL
        }/utility/${apiEndpoint}&query=${query}&filters=${JSON.stringify(
          localFilters
        )}`,
        { credentials: "include" }
      );
      const result = await response.json();
      setSearchResults(result.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      fetchSearchResults(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSelect = (event, newValue) => {
    setSelectedItem(newValue);
    if (withParamsChange) {
      const param = { target: { value: newValue && newValue.id } };
      handleSearchParamsChange(param, searchKey, searchParams, router);
    }
    if (newValue) {
      setSearchTerm(newValue[mainKey] || "");
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
        getOptionLabel={(option) => {
          return renderKeys
            .map((key) => getPropertyValue(option, key))
            .join(" - ");
        }}
        loading={loading}
        value={selectedItem}
        sx={{
          minWidth: 300,
          width: "100%",
        }}
        onChange={handleSelect}
        onInputChange={(event, newInputValue) => {
          setSearchTerm(newInputValue);
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
