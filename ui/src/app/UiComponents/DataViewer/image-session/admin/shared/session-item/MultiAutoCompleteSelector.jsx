import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";

export const MultiAutoCompleteSelector = ({
  setData,
  updateKey,
  model,
  initialSelectedIds = [],
  where = {},
  select = "id,title",
  label = `Select ${model}s`,
}) => {
  const [allItems, setAllItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const response = await getDataAndSet({
        url: `shared/ids?where=${JSON.stringify(
          where
        )}&model=${model}&select=${select}&`,
        setLoading,
        setData: setAllItems,
      });

      // After fetching all items, determine the initial selection.
      if (initialSelectedIds.length > 0 && response.data) {
        const initialItems = response.data.filter((item) =>
          initialSelectedIds.includes(item.id)
        );
        setSelectedItems(initialItems);
      }
    };

    fetchItems();
  }, [model, JSON.stringify(where), select]);

  const handleSelectionChange = useCallback(
    (event, newSelectedItems) => {
      setSelectedItems(newSelectedItems);

      const selectedIds = newSelectedItems.map((item) => item.id);

      setData((prevData) => ({
        ...prevData,
        [updateKey]: selectedIds,
      }));
    },
    [setData, updateKey]
  );

  return (
    <Box>
      <Autocomplete
        multiple // This prop enables multi-selection.
        id={`multi-autocomplete-${model}`}
        options={allItems}
        value={selectedItems}
        onChange={handleSelectionChange}
        loading={loading}
        // Tells Autocomplete how to get the display label for each option.
        getOptionLabel={(option) => {
          return `${(option.title && option.title[0].text) || model} (ID: ${
            option.id
          })`;
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disableCloseOnSelect
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            placeholder={`Search and select ${model.toLowerCase()}s...`}
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
        renderOption={(props, option, { selected }) => {
          return (
            <li {...props} key={option.id}>
              <Box
                sx={{ display: "flex", flexDirection: "column", width: "100%" }}
              >
                <Typography
                  variant="body1"
                  fontWeight={selected ? "bold" : "normal"}
                >
                  {(option.title && option.title[0].text) ||
                    `${model} ${option.id}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {option.id}
                </Typography>
              </Box>
            </li>
          );
        }}
        noOptionsText={loading ? `Loading ${model}s...` : `No ${model}s found`}
      />
    </Box>
  );
};
