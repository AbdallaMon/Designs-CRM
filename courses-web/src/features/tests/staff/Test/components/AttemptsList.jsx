"use client";
import React from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { FaPlay, FaEye, FaEdit } from "react-icons/fa";
import dayjs from "dayjs";
import { toArabicNumerals } from "../helpers";

const AttemptsList = ({
  attempts,
  test,
  canStartNewAttempt,
  onStartNewAttempt,
  isAttemptExpired,
  onReview,
  onContinue,
}) => (
  <Box>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography variant="h5">محاولات الاختبار</Typography>
      {canStartNewAttempt() && (
        <Button
          variant="contained"
          startIcon={<FaPlay />}
          onClick={onStartNewAttempt}
        >
          بدء محاولة جديدة
        </Button>
      )}
    </Box>

    {attempts.length === 0 ? (
      <Alert severity="info">
        لا توجد محاولات بعد. اضغط على "بدء محاولة جديدة" للبداية.
      </Alert>
    ) : (
      <List>
        {attempts.map((attempt, index) => (
          <Paper key={attempt.id} sx={{ mb: 2 }}>
            <ListItem>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="h6">
                      المحاولة {toArabicNumerals(attempt.attemptCount)}
                    </Typography>
                    {attempt.endTime ? (
                      <Chip
                        label={attempt.passed ? "نجح" : "فشل"}
                        color={attempt.passed ? "success" : "error"}
                        size="small"
                      />
                    ) : (
                      <Chip label="قيد التقدم" color="warning" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        بدأت في:{" "}
                        {dayjs(attempt.startTime).format(
                          "DD/MM/YYYY - HH:mm"
                        )}
                      </Typography>
                      {attempt.endTime && (
                        <>
                          <Typography variant="body2">
                            اكتملت في:{" "}
                            {dayjs(attempt.endTime).format(
                              "DD/MM/YYYY - HH:mm"
                            )}
                          </Typography>
                          <Typography variant="body2">
                            النتيجة: {toArabicNumerals(attempt.score)}%
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                }
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                {isAttemptExpired(attempt, test) ? (
                  <Button
                    variant="outlined"
                    startIcon={<FaEye />}
                    onClick={() => onReview(attempt)}
                  >
                    مراجعة
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<FaEdit />}
                    onClick={() => onContinue(attempt)}
                  >
                    متابعة
                  </Button>
                )}
              </Box>
            </ListItem>
          </Paper>
        ))}
      </List>
    )}
  </Box>
);

export default AttemptsList;
