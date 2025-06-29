import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { Box, TextField } from "@mui/material";
import { useEffect } from "react";

export function CreateTitleOrDesc({ data, setData, type = "TITLE" }) {
  const { languages, loadingLngs } = useLanguage();
  const fieldName = type === "TITLE" ? "titles" : "descriptions";
  const baseLabel = type === "TITLE" ? "Title" : "Description";

  useEffect(() => {
    if (languages && languages.length > 0 && (!data || !data[fieldName])) {
      const initialData = {};

      // languages.forEach((lng))
      initialData[fieldName] = languages.reduce((acc, lng) => {
        acc[lng.id] = {
          langId: lng.id,
          text: "",
        };
        return acc;
      }, {});
      setData((old) => ({ ...(old || []), ...initialData }));
    }
  }, [languages, data, setData, type]);

  const handleTextChange = (languageId, value) => {
    setData((prevData) => ({
      ...prevData,
      [fieldName]: {
        ...prevData[fieldName],
        [languageId]: {
          langId: languageId,
          text: value,
        },
      },
    }));
  };

  const getCurrentValue = (languageId) => {
    return data?.[fieldName]?.[languageId]?.text || "";
  };

  const getLabel = (language) => {
    return `${baseLabel} (${language.name})`;
  };

  if (loadingLngs) {
    return <Box>Loading languages...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      {languages.map((lng) => {
        return (
          <TextField
            key={lng.id}
            label={getLabel(lng)}
            value={getCurrentValue(lng.id)}
            onChange={(e) => handleTextChange(lng.id, e.target.value)}
            multiline={type === "DESCRIPTION"}
            rows={type === "DESCRIPTION" ? 4 : 1}
            maxRows={type === "DESCRIPTION" ? 8 : 1}
            variant="outlined"
            fullWidth
            placeholder={`Enter ${type.toLowerCase()} in ${lng.name}`}
          />
        );
      })}
    </Box>
  );
}
