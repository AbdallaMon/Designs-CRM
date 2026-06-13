import { Box, Typography } from "@mui/material";
import { MemoizedTextField, useDebounce } from "./CreateTitleOrDesc"; // Assuming these are in this path
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";

/**
 * A component to edit titles and descriptions for multiple languages simultaneously.
 * It updates a specific field within the parent's state object.
 */
export function EditTitleAndDescriptionFields({
  data, // The parent's entire state object.
  setData, // The function to update the parent's state.
  initialTitles = [],
  initialDescriptions = [],
  stateKey = "translations", // The key in the parent state to manage.
}) {
  const { languages, loadingLngs } = useLanguage();
  const [localData, setLocalData] = useState(null);

  // Debounce the entire local state to batch updates.
  const debouncedLocalData = useDebounce(localData, 300);

  // --- EFFECT 1: Smart Initialization ---
  // Initializes the local state. This logic remains the same.
  useEffect(() => {
    if (localData !== null || !languages || languages.length === 0) {
      return;
    }

    const initializeField = (initialItems, textField) => {
      const existingDataMap = new Map();
      initialItems.forEach((item) => {
        existingDataMap.set(item.languageId, {
          id: item.id,
          langId: item.languageId,
          text: item[textField] || "",
          isExisting: true,
        });
      });

      const fieldState = {};
      languages.forEach((lng) => {
        if (existingDataMap.has(lng.id)) {
          fieldState[lng.id] = existingDataMap.get(lng.id);
        } else {
          fieldState[lng.id] = {
            id: null,
            langId: lng.id,
            text: "",
            isExisting: false,
          };
        }
      });
      return fieldState;
    };

    const titleData = initializeField(initialTitles, "text");
    const descriptionData = initializeField(initialDescriptions, "content");

    setLocalData({
      titles: titleData,
      descriptions: descriptionData,
      edits: {},
      creates: {},
    });
  }, [languages, initialTitles, initialDescriptions, localData]);

  // --- EFFECT 2: Debounced and Scoped Parent Update ---
  // Sends the debounced local state back to the parent, updating only the specified 'stateKey'.
  useEffect(() => {
    // Only update if debounced data exists and is different from the corresponding part of the parent state.
    if (debouncedLocalData && debouncedLocalData !== data?.[stateKey]) {
      setData((prevParentData) => ({
        ...prevParentData,
        [stateKey]: debouncedLocalData, // Update only the specific field.
      }));
    }
  }, [debouncedLocalData, data, setData, stateKey]);

  // --- Handler for text changes with 'type' property added ---
  // Manages local state changes and adds 'type' to edit/create payloads.
  const handleTextChange = useCallback((fieldType, languageId, value) => {
    const textField = fieldType === "titles" ? "text" : "content";
    // NEW: Define the type string ('TITLE' or 'DESCRIPTION')
    const typeEnum = fieldType === "titles" ? "TITLE" : "DESCRIPTION";

    setLocalData((prevData) => {
      const updatedData = { ...prevData };
      const currentItem = prevData[fieldType][languageId];

      updatedData[fieldType] = {
        ...prevData[fieldType],
        [languageId]: { ...currentItem, text: value },
      };

      const newEdits = { ...(prevData.edits || {}) };
      if (!newEdits[fieldType]) newEdits[fieldType] = {};

      const newCreates = { ...(prevData.creates || {}) };
      if (!newCreates[fieldType]) newCreates[fieldType] = {};

      // Update the nested edits/creates payloads, now including the 'type' field.
      if (currentItem.isExisting) {
        if (value.trim()) {
          newEdits[fieldType][languageId] = {
            id: currentItem.id,
            [textField]: value,
            languageId: languageId,
            type: typeEnum, // Add type to edits
          };
        } else {
          delete newEdits[fieldType][languageId];
        }
      } else {
        if (value.trim()) {
          newCreates[fieldType][languageId] = {
            [textField]: value,
            languageId: languageId,
            type: typeEnum, // Add type to creates
          };
        } else {
          delete newCreates[fieldType][languageId];
        }
      }

      updatedData.edits = newEdits;
      updatedData.creates = newCreates;

      return updatedData;
    });
  }, []);

  const getLabel = (baseLabel, fieldType, language) => {
    const isExisting = localData?.[fieldType]?.[language.id]?.isExisting;
    const status = isExisting ? "" : " (New)";
    return `${baseLabel} (${language.name})${status}`;
  };

  if (loadingLngs || !localData) {
    return <Box>Loading...</Box>;
  }

  // --- Rendering logic remains the same ---
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4, pt: 1 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Titles
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {languages.map((lng) => {
            const item = localData.titles[lng.id];
            const isNew = !item?.isExisting;
            return (
              <MemoizedTextField
                key={`title-${lng.id}`}
                label={getLabel("Title", "titles", lng)}
                value={item?.text || ""}
                onChange={(e) =>
                  handleTextChange("titles", lng.id, e.target.value)
                }
                placeholder={`Enter title in ${lng.name}`}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: isNew ? "success.main" : undefined,
                      borderStyle: isNew ? "dashed" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: isNew ? "success.main" : undefined,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Descriptions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {languages.map((lng) => {
            const item = localData.descriptions[lng.id];
            const isNew = !item?.isExisting;
            return (
              <MemoizedTextField
                key={`desc-${lng.id}`}
                label={getLabel("Description", "descriptions", lng)}
                value={item?.text || ""}
                onChange={(e) =>
                  handleTextChange("descriptions", lng.id, e.target.value)
                }
                placeholder={`Enter description in ${lng.name}`}
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: isNew ? "success.main" : undefined,
                      borderStyle: isNew ? "dashed" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: isNew ? "success.main" : undefined,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
