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
  isFullWidth,
  isLanguage,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const fetchItems = async () => {
      const req = await getDataAndSet({
        url: `shared/ids?where=${JSON.stringify({
          ...where,
        })}&model=${model}&select=${select}&isLanguage=${isLanguage}&`,
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
    <Box sx={{ width: "100%", maxWidth: isFullWidth ? "100%" : 400 }}>
      <Autocomplete
        options={items}
        getOptionLabel={(option) => `${model} ${option.id}`}
        value={selectedId}
        onChange={handleChange}
        loading={loading}
        fullWidth={isFullWidth}
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
                  {(option.title &&
                    option.title.find((t) => t.language.code === "ar").text) ||
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
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </Box>
  );
};
