import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { Box, TextField } from "@mui/material";
import { useEffect } from "react";

export function EditTitleOrDescFields({
  data,
  setData,
  type = "TITLE",
  initialData = [],
}) {
  const { languages, loadingLngs } = useLanguage();
  const fieldName = type === "TITLE" ? "titles" : "descriptions";
  const baseLabel = type === "TITLE" ? "Title" : "Description";
  // Initialize data structure when languages load
  useEffect(() => {
    if (languages && languages.length > 0) {
      const textField = type === "TITLE" ? "text" : "content";
      // Create a map of existing data by languageId
      const existingDataMap = {};
      initialData.forEach((item) => {
        existingDataMap[item.languageId] = {
          id: item.id,
          langId: item.languageId,
          text: item[textField] || "",
          isExisting: true,
        };
      });

      // Create complete data structure including missing languages
      const completeData = {
        [fieldName]: {},
        edits: {},
        creates: {},
      };
      languages.forEach((lng) => {
        if (existingDataMap[lng.id]) {
          // Use existing data
          completeData[fieldName][lng.id] = existingDataMap[lng.id];
        } else {
          // Add new entry for missing language
          completeData[fieldName][lng.id] = {
            id: null,
            langId: lng.id,
            text: "",
            isExisting: false,
          };
        }
      });

      setData(completeData);
    }
  }, [languages, initialData, setData, type]);

  // Handle text field changes
  const handleTextChange = (languageId, value) => {
    const textField = type === "TITLE" ? "text" : "content";

    setData((prevData) => {
      const updatedData = { ...prevData };
      const currentItem = prevData[fieldName][languageId];

      updatedData[fieldName] = {
        ...prevData[fieldName],
        [languageId]: {
          ...currentItem,
          text: value,
        },
      };
      if (currentItem.isExisting) {
        if (value.trim()) {
          updatedData.edits = {
            ...prevData.edits,
            [languageId]: {
              id: currentItem.id,
              [textField]: value,
              languageId: languageId,
            },
          };
        } else {
          // Remove from edits if empty
          const newEdits = { ...prevData.edits };
          delete newEdits[languageId];
          updatedData.edits = newEdits;
        }
      } else {
        // This is a new item - add to creates
        if (value.trim()) {
          updatedData.creates = {
            ...prevData.creates,
            [languageId]: {
              [textField]: value,
              languageId: languageId,
            },
          };
        } else {
          // Remove from creates if empty
          const newCreates = { ...prevData.creates };
          delete newCreates[languageId];
          updatedData.creates = newCreates;
        }
      }

      return updatedData;
    });
  };

  // Get current value for a language
  const getCurrentValue = (languageId) => {
    return data?.[fieldName]?.[languageId]?.text || "";
  };

  // Get label based on type and language
  const getLabel = (language) => {
    const isExisting = data?.[fieldName]?.[language.id]?.isExisting;
    const status = isExisting ? "" : " (New)";
    return `${baseLabel} (${language.name})${status}`;
  };

  // Check if field is new (for styling purposes)
  const isNewField = (languageId) => {
    return !data?.[fieldName]?.[languageId]?.isExisting;
  };

  if (loadingLngs) {
    return <Box>Loading languages...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      {languages.map((lng) => {
        const isNew = isNewField(lng.id);
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
            sx={{
              "& .MuiOutlinedInput-root": {
                ...(isNew && {
                  "& fieldset": {
                    borderColor: "success.main",
                    borderStyle: "dashed",
                  },
                }),
              },
              "& .MuiInputLabel-root": {
                ...(isNew && {
                  color: "success.main",
                }),
              },
            }}
          />
        );
      })}
    </Box>
  );
}
