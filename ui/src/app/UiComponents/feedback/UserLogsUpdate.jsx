"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Button,
  Typography,
  Switch,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const ActivityLogDialog = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didWork, setDidWork] = useState(true);
  const [loading, setCheckLoading] = useState(false);
  const { setLoading } = useToastContext();
  let currentTime = dayjs().tz("Asia/Dubai");

  const minutes = currentTime.minute();
  currentTime = currentTime.hour();
  if (minutes > 55) {
    currentTime = currentTime + 1;
  }
  useEffect(() => {
    const checkUserLog = async () => {
      let currentTime = dayjs().tz("Asia/Dubai");
      let timeCheckStart, timeCheckEnd;
      if (currentTime.hour() >= 8 && currentTime.hour() <= 17) {
        const minutes = currentTime.minute();
        let hours = currentTime.hour();
        if (minutes >= 55) {
          hours = hours + 1;
        }
        if (hours === 17) {
          timeCheckStart = currentTime
            .hour(hours)
            .subtract(1, "hour")
            .minute(50)
            .second(0)
            .millisecond(0);
          timeCheckEnd = currentTime
            .hour(hours)
            .minute(40)
            .second(0)
            .millisecond(0);
        }
      } else {
        const currentMinute = currentTime.minute();
        timeCheckStart = currentTime.subtract(1, "hour").minute(55).second(0);
        timeCheckEnd = currentTime.minute(15).second(0);
        if (currentMinute >= 55) {
          timeCheckStart = currentTime.minute(40).second(0).millisecond(0);
          // Set the end time to 15 minutes after the hour (e.g., 6:15)
          timeCheckEnd = currentTime
            .add(1, "hour")
            .minute(15)
            .second(0)
            .millisecond(0);
        } else {
          // If we're before :55, the check should be for the previous hour range (e.g., 5:55 to 6:15)
          timeCheckStart = currentTime
            .subtract(1, "hour")
            .minute(55)
            .second(0)
            .millisecond(0);
          timeCheckEnd = currentTime.minute(15).second(0).millisecond(0);
        }
      }

      if (!timeCheckStart && !timeCheckEnd) {
        return;
      }
      if (
        currentTime.isAfter(timeCheckStart) &&
        currentTime.isBefore(timeCheckEnd)
      ) {
        try {
          const formattedStartTime = timeCheckStart
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss[Z]");
          const formattedEndTime = timeCheckEnd
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss[Z]");

          const response = await getData({
            url: `shared/user-logs?userId=${userId}&startTime=${formattedStartTime}&endTime=${formattedEndTime}&`,
            setLoading: setCheckLoading,
          });
          // If there is no log for the specified time range, show the dialog
          if (response.data === false) {
            setOpen(true);
          }
        } catch (error) {
          console.error("Error checking user log:", error);
        }
      }
    };

    checkUserLog();

    const intervalId = setInterval(checkUserLog, 300000);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId]);

  const handleDescriptionChange = (e) => setDescription(e.target.value);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let currentTime = dayjs().tz("Asia/Dubai");
      let minutes = currentTime.minute();
      let hourToSubmit = currentTime.hour();
      if (minutes > 55) {
        hourToSubmit = hourToSubmit + 1;
      }

      const submissionTime = currentTime.hour(hourToSubmit).minute(0).second(0);
      await handleRequestSubmit(
        {
          userId,
          date: submissionTime.format(),
          description: !didWork ? "no thing" : description,
          totalMinutes: !didWork
            ? 0
            : currentTime.hour() > 8 && currentTime.hour() <= 17
            ? 60 * 8
            : 60,
        },
        setLoading,
        `shared/user-logs`
      );
      setOpen(false);
    } catch (error) {
      console.error("Error submitting log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Prevent closing dialog until description is submitted
    if (!description.trim()) return;

    if (!isSubmitting) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body1" color="textPrimary">
            Did u worked from
            {currentTime > 8 && currentTime <= 17
              ? currentTime - 8
              : currentTime - 1}{" "}
            to {currentTime}
          </Typography>
          <Switch
            checked={didWork}
            onChange={(e) => setDidWork(e.target.checked)}
            inputProps={{ "aria-label": "Did u worked" }}
          />
        </Box>
        {didWork && (
          <>
            <Typography variant="h6" gutterBottom>
              Please describe what you did between{" "}
              {currentTime > 8 && currentTime <= 17
                ? currentTime - 8
                : currentTime - 1}{" "}
              to {currentTime}
            </Typography>
            <TextField
              label="Activity Description"
              multiline
              rows={4}
              fullWidth
              value={description}
              onChange={handleDescriptionChange}
              disabled={isSubmitting}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} color="primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityLogDialog;
