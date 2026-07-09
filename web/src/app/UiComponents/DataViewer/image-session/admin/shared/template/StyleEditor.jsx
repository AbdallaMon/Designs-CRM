"use client";
import React, { useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { MdStyle as Style, MdExpandMore as ExpandMore } from "react-icons/md";
import StyleEditorControls from "./StyleEditorControls";

/**
 * Refactored style editor component with improved performance and UX.
 */
const StyleEditor = ({
  template,
  customStyles,
  onStyleChange,
  setTemplate,
  handleTemplateChange,
  type,
}) => {
  const visibleElements = useMemo(
    () =>
      [
        { key: "card", label: "Card Container" },
        { key: "title", label: "Title", visible: template.showTitle },
        {
          key: "description",
          label: "Description",
          visible: template.showDescription,
        },
        { key: "consButton", label: "Cons Button", visible: template.showCons },
        { key: "colors", label: "Colors", visible: template.showColors },
      ].filter((element) => element.visible !== false),
    [template]
  );

  const handleStyleUpdate = useCallback(
    (elementKey, property, value) => {
      onStyleChange((prevStyles) => ({
        ...prevStyles,
        [elementKey]: {
          ...prevStyles[elementKey],
          [property]: value,
        },
      }));
    },
    [onStyleChange]
  );

  return (
    <Box>
      {visibleElements.map((element) => (
        <Accordion
          key={element.key}
          sx={{ mb: 1 }}
          TransitionProps={{ unmountOnExit: true }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <Style sx={{ mr: 1, verticalAlign: "middle" }} />
              {element.label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StyleEditorControls
              element={element}
              customStyles={customStyles}
              onStyleUpdate={handleStyleUpdate}
              template={template}
              onTemplateChange={handleTemplateChange}
              setTemplate={setTemplate}
              type={type}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default StyleEditor;
