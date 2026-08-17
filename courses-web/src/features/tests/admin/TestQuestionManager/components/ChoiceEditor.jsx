"use client";
import React, { useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Radio,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
} from "@mui/material";
import {
  MdDelete as DeleteIcon,
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
import { QuestionTypes } from "@/app/helpers/constants";

const ChoiceEditor = React.memo(
  ({ choice, index, questionType, onUpdate, onRemove, onMove, canRemove }) => {
    const handleTextChange = useCallback(
      (e) => {
        onUpdate(choice.id, "text", e.target.value);
      },
      [choice.id, onUpdate]
    );

    const handleCorrectChange = useCallback(
      (e) => {
        onUpdate(choice.id, "isCorrect", e.target.checked);
      },
      [choice.id, onUpdate]
    );

    const handleRadioChange = useCallback(() => {
      onUpdate(choice.id, "isCorrect", true);
    }, [choice.id, onUpdate]);

    const handleRemove = useCallback(() => {
      onRemove(choice.id);
    }, [choice.id, onRemove]);

    const handleMoveUp = useCallback(() => {
      onMove(choice.id, "up");
    }, [choice.id, onMove]);

    const handleMoveDown = useCallback(() => {
      onMove(choice.id, "down");
    }, [choice.id, onMove]);

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              fullWidth
              label={`Choice ${index + 1}`}
              value={choice.text}
              onChange={handleTextChange}
              disabled={questionType === QuestionTypes.TRUE_FALSE}
            />

            {questionType === QuestionTypes.MULTIPLE_CHOICE ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={choice.isCorrect}
                    onChange={handleCorrectChange}
                  />
                }
                label="Correct"
              />
            ) : questionType === QuestionTypes.ORDERING ? (
              <>
                <IconButton onClick={handleMoveUp}>
                  <MdArrowUpward />
                </IconButton>
                <IconButton onClick={handleMoveDown}>
                  <MdArrowDownward />
                </IconButton>
              </>
            ) : (
              <FormControlLabel
                control={
                  <Radio
                    checked={choice.isCorrect}
                    onChange={handleRadioChange}
                  />
                }
                label="Correct"
              />
            )}

            {questionType !== QuestionTypes.TRUE_FALSE && canRemove && (
              <IconButton onClick={handleRemove} color="error">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

ChoiceEditor.displayName = "ChoiceEditor";

export default ChoiceEditor;
