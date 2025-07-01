import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { Box, TextField } from "@mui/material";
import { useEffect, useState, useCallback, memo } from "react";

// A simple debounce hook (you can place this in a separate utility file)
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- FURTHER OPTIMIZATION: Memoized TextField ---
// This component will only re-render if its specific props (value, label, etc.) change.
export const MemoizedTextField = memo(function MemoizedTextField(props) {
  return <TextField {...props} />;
});

export function CreateTitleOrDesc({ data, setData, type = "TITLE" }) {
  const { languages, loadingLngs } = useLanguage();
  const fieldName = type === "TITLE" ? "titles" : "descriptions";
  const baseLabel = type === "TITLE" ? "Title" : "Description";

  const [localData, setLocalData] = useState(null);
  const debouncedLocalData = useDebounce(localData, 200);

  // --- EFFECT 1 (INITIALIZATION) with THE FIX ---
  // This effect now has a more specific dependency, preventing the feedback loop.
  useEffect(() => {
    if (languages && languages.length > 0) {
      const parentSlice = data?.[fieldName];
      if (parentSlice) {
        setLocalData(parentSlice);
      } else {
        const initialFields = languages.reduce((acc, lng) => {
          acc[lng.id] = { langId: lng.id, text: "" };
          return acc;
        }, {});
        setLocalData(initialFields);
      }
    }
    // ✅ THE FIX: Depend on the specific data slice, not the whole data object.
  }, [languages, data?.[fieldName], fieldName]);

  // --- EFFECT 2 (PARENT UPDATE) ---
  // This remains the same. It correctly updates the parent with debounced data.
  useEffect(() => {
    if (debouncedLocalData && debouncedLocalData !== data?.[fieldName]) {
      setData((old) => ({
        ...old,
        [fieldName]: debouncedLocalData,
      }));
    }
  }, [debouncedLocalData, setData, fieldName]);

  const handleTextChange = useCallback((languageId, value) => {
    setLocalData((prev) => ({
      ...prev,
      [languageId]: {
        langId: languageId,
        text: value,
      },
    }));
  }, []);

  const getLabel = (language) => `${baseLabel} (${language.name})`;

  if (loadingLngs || !localData) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      {languages.map((lng) => (
        // ✅ Using the MemoizedTextField for maximum performance
        <MemoizedTextField
          key={lng.id}
          label={getLabel(lng)}
          value={localData[lng.id]?.text || ""}
          onChange={(e) => handleTextChange(lng.id, e.target.value)}
          multiline={type === "DESCRIPTION"}
          rows={type === "DESCRIPTION" ? 4 : 1}
          variant="outlined"
          fullWidth
          placeholder={`Enter ${type.toLowerCase()} in ${lng.name}`}
        />
      ))}
    </Box>
  );
}
