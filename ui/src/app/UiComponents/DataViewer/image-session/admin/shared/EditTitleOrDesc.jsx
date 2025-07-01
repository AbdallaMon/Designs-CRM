import { Box } from "@mui/material";
import { MemoizedTextField, useDebounce } from "./CreateTitleOrDesc";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";

export function EditTitleOrDescFields({
  data, // This prop is now only used for the debounced update comparison
  setData,
  type = "TITLE",
  initialData = [],
}) {
  const { languages, loadingLngs } = useLanguage();
  const fieldName = type === "TITLE" ? "titles" : "descriptions";
  const baseLabel = type === "TITLE" ? "Title" : "Description";

  const [localData, setLocalData] = useState(null);

  // --- KEY CHANGE 2: Debounce the entire local state ---
  const debouncedLocalData = useDebounce(localData, 200);

  // --- EFFECT 1: Smart Initialization ---
  useEffect(() => {
    if (localData !== null || !languages || languages.length === 0) {
      return;
    }

    const textField = type === "TITLE" ? "text" : "content";
    const existingDataMap = new Map();
    initialData.forEach((item) => {
      existingDataMap.set(item.languageId, {
        id: item.id,
        langId: item.languageId,
        text: item[textField] || "",
        isExisting: true,
      });
    });

    const completeData = {
      [fieldName]: {},
      edits: {},
      creates: {},
    };

    languages.forEach((lng) => {
      if (existingDataMap.has(lng.id)) {
        completeData[fieldName][lng.id] = existingDataMap.get(lng.id);
      } else {
        completeData[fieldName][lng.id] = {
          id: null,
          langId: lng.id,
          text: "",
          isExisting: false,
        };
      }
    });

    // Initialize the fast local state
    setLocalData(completeData);
  }, [languages, initialData, localData, type, fieldName]);

  // --- EFFECT 2: Debounced Parent Update ---
  // This effect sends the complete, debounced state back to the parent.
  useEffect(() => {
    // Only update parent if debounced data exists and is different from parent data
    if (debouncedLocalData && debouncedLocalData !== data) {
      setData((old) => ({
        ...old,
        [fieldName]: debouncedLocalData,
      }));
    }
  }, [debouncedLocalData, data, setData]);

  // --- KEY CHANGE 3: Handle text changes locally and instantly ---
  const handleTextChange = useCallback(
    (languageId, value) => {
      const textField = type === "TITLE" ? "text" : "content";

      setLocalData((prevData) => {
        // This logic is identical to your original, but operates on local state
        const updatedData = { ...prevData };
        const currentItem = prevData[fieldName][languageId];

        updatedData[fieldName] = {
          ...prevData[fieldName],
          [languageId]: { ...currentItem, text: value },
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
            const newEdits = { ...prevData.edits };
            delete newEdits[languageId];
            updatedData.edits = newEdits;
          }
        } else {
          if (value.trim()) {
            updatedData.creates = {
              ...prevData.creates,
              [languageId]: { [textField]: value, languageId: languageId },
            };
          } else {
            const newCreates = { ...prevData.creates };
            delete newCreates[languageId];
            updatedData.creates = newCreates;
          }
        }
        return updatedData;
      });
    },
    [type, fieldName]
  );

  // Helper function to read from local state
  const getLabel = (language) => {
    const isExisting = localData?.[fieldName]?.[language.id]?.isExisting;
    const status = isExisting ? "" : " (New)";
    return `${baseLabel} (${language.name})${status}`;
  };

  if (loadingLngs || !localData) {
    return <Box>Loading languages...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      {languages.map((lng) => {
        const item = localData[fieldName][lng.id];
        const isNew = !item?.isExisting;

        return (
          <MemoizedTextField
            key={lng.id}
            label={getLabel(lng)}
            value={item?.text || ""}
            onChange={(e) => handleTextChange(lng.id, e.target.value)}
            variant="outlined"
            fullWidth
            placeholder={`Enter ${type.toLowerCase()} in ${lng.name}`}
            multiline={type === "DESCRIPTION"}
            minRows={type === "DESCRIPTION" ? 4 : 1}
            maxRows={type === "DESCRIPTION" ? 8 : 1}
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
                ...(isNew && { color: "success.main" }),
              },
            }}
          />
        );
      })}
    </Box>
  );
}
