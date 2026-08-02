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
import { formatNumber } from "../helpers";

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
      <Typography variant="h5">Test attempts</Typography>
      {canStartNewAttempt() && (
        <Button
          variant="contained"
          startIcon={<FaPlay />}
          onClick={onStartNewAttempt}
        >
          Start a new attempt
        </Button>
      )}
    </Box>

    {attempts.length === 0 ? (
      <Alert severity="info">
        No attempts yet. Select "Start a new attempt" to begin.
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
                      Attempt {formatNumber(attempt.attemptCount)}
                    </Typography>
                    {attempt.endTime ? (
                      <Chip
                        label={attempt.passed ? "Passed" : "Failed"}
                        color={attempt.passed ? "success" : "error"}
                        size="small"
                      />
                    ) : (
                      <Chip label="In progress" color="warning" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Started at:{" "}
                        {dayjs(attempt.startTime).format(
                          "DD/MM/YYYY - HH:mm"
                        )}
                      </Typography>
                      {attempt.endTime && (
                        <>
                          <Typography variant="body2">
                            Completed at:{" "}
                            {dayjs(attempt.endTime).format(
                              "DD/MM/YYYY - HH:mm"
                            )}
                          </Typography>
                          <Typography variant="body2">
                            Score: {formatNumber(attempt.score)}%
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
                    Review
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<FaEdit />}
                    onClick={() => onContinue(attempt)}
                  >
                    Continue
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
