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
import { FaEye } from "react-icons/fa";
import dayjs from "dayjs";

const AttemptsList = ({ attempts, onReview }) => (
  <Box dir="rtl">
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography variant="h5">محاولات الاختبار</Typography>
    </Box>

    {attempts.length === 0 ? (
      <Alert severity="info">لا توجد محاولات بعد.</Alert>
    ) : (
      <List>
        {attempts.map((attempt, index) => (
          <Paper key={attempt.id} sx={{ mb: 2 }}>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6">
                      المحاولة {attempt.attemptCount}
                    </Typography>
                    {attempt.endTime ? (
                      <Chip
                        label={attempt.passed ? "نجح" : "فشل"}
                        color={attempt.passed ? "success" : "error"}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="قيد التقييم"
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      بدأ في:{" "}
                      {dayjs(attempt.startTime).format("DD/MM/YYYY - HH:mm")}
                    </Typography>
                    {attempt.endTime && (
                      <>
                        <Typography variant="body2">
                          انتهى في:{" "}
                          {dayjs(attempt.endTime).format(
                            "DD/MM/YYYY - HH:mm"
                          )}
                        </Typography>
                        <Typography variant="body2">
                          النتيجة: {attempt.score}%
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FaEye />}
                  onClick={() => onReview(attempt)}
                >
                  مراجعة
                </Button>
              </Box>
            </ListItem>
          </Paper>
        ))}
      </List>
    )}
  </Box>
);

export default AttemptsList;
