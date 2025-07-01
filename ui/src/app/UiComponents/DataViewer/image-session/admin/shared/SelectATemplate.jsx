import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export const TemplateAutocomplete = ({
  onTemplateSelect,
  placeholder = "Select a template...",
  type,
  initialData,
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  useEffect(() => {
    const fetchTemplates = async () => {
      const req = await getDataAndSet({
        url: `admin/image-session/templates/ids?type=${type}&`,
        setLoading,
        setData: setTemplates,
      });
      if (initialData) {
        const currentTemplate = req.data.find(
          (temp) => temp.id === initialData.templateId
        );
        setSelectedTemplate(currentTemplate);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateChange = (event, newValue) => {
    setSelectedTemplate(newValue);
    if (newValue && onTemplateSelect) {
      onTemplateSelect(newValue.id, newValue);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Autocomplete
        options={templates}
        getOptionLabel={(option) => `Template ${option.id}`}
        value={selectedTemplate}
        onChange={handleTemplateChange}
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
            label="Template"
            placeholder={placeholder}
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
                  {`Template ${option.id}`}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                ID: {option.id}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={loading ? "Loading templates..." : "No templates found"}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </Box>
  );
};
