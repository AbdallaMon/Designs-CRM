import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export const AutoCompleteSelector = ({
  onSelect,
  where,
  initialData,
  model = "Template",
  keyId = "templateId",
  select,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const fetchItems = async () => {
      const req = await getDataAndSet({
        url: `shared/ids?where=${JSON.stringify({
          ...where,
        })}&model=${model}&select=${select}&`,
        setLoading,
        setData: setItems,
      });
      if (initialData) {
        const currentItem = req.data.find(
          (item) => item.id === initialData[keyId]
        );
        setSelectedId(currentItem);
      }
    };

    fetchItems();
  }, []);

  const handleChange = (event, newValue) => {
    setSelectedId(newValue);
    if (newValue && onSelect) {
      onSelect(newValue.id, newValue);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Autocomplete
        options={items}
        getOptionLabel={(option) => `${model} ${option.id}`}
        value={selectedId}
        onChange={handleChange}
        loading={loading}
        filterOptions={(options, { inputValue }) => {
          // Custom filter to search by displayName, type, and id
          return options.filter((option) =>
            option.id.toString().includes(inputValue)
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={model}
            placeholder={`Select a ${model.toLowerCase()}...`}
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
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box
              sx={{ display: "flex", flexDirection: "column", width: "100%" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1">
                  {`${model} ${option.id}`}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                ID: {option.id}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={loading ? `Loading ${model}s...` : `No ${model}s found`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </Box>
  );
};
