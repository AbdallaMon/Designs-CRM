import dayjs from "dayjs";
import { Box, Button, Link, Paper, Typography } from "@mui/material";
import React from "react";
import {
  MdAttachFile as AttachFile,
  MdPictureAsPdf as PictureAsPdf,
} from "react-icons/md";

export const handleSearchParamsChange = (
  event,
  key,
  searchParams,
  router,
  onChange
) => {
  if (onChange) return onChange(event);
  const value = event.target.value;
  const params = new URLSearchParams(searchParams);
  if (value) {
    params.set(key, value);
  } else {
    params.set(key, "all");
  }
  router.push(`?${params.toString()}`);
};

export const getPropertyValue = (
  item,
  propertyPath,
  enums,
  type,
  defaultValue
) => {
  let value = propertyPath.split(".").reduce((acc, part) => {
    if (acc) {
      const arrayIndexMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrayIndexMatch) {
        const arrayName = arrayIndexMatch[1];
        const index = parseInt(arrayIndexMatch[2], 10);
        return acc[arrayName] && acc[arrayName][index];
      } else {
        return acc[part];
      }
    }
    return undefined;
  }, item);
  if (defaultValue) value = defaultValue;

  if (
    (propertyPath.toLowerCase().includes("date") || type === "date") &&
    dayjs(value).isValid()
  ) {
    return dayjs(value).format("DD-MM-YYYY");
  }
  if (enums && type === "boolean") {
    if (value) {
      return enums.TRUE;
    } else return enums.FALSE;
  }

  if (enums) return enums[value];
  return value;
};

export const renderFileLink = (url, label, style) => {
  if (!url) return <Typography>لا يوجد {label}</Typography>;

  const isImage = /\.(jpeg|jpg|png|gif)$/i.test(url);
  const isPdf = /\.pdf$/i.test(url);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="body1" fontWeight="bold">
          {label && label?.length > 0 && `${label}:`}
        </Typography>
        {isImage ? (
          <Box display="flex" alignItems="center" gap={1}>
            <img src={url} alt={label} width="100" style={style} />
          </Box>
        ) : isPdf ? (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PictureAsPdf />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            عرض ملف PDF
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AttachFile />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            تحميل الملف
          </Button>
        )}
      </Box>
    </Paper>
  );
};
export const enumToKeyValueArray = (enumObj) => {
  return Object.entries(enumObj).map(([key, value]) => ({
    id: key, // Enum key becomes `id`
    name: value, // Enum value becomes `name`
  }));
};
export function hideMoreData(content, max = 20) {
  if (content?.length > max) {
    return content.slice(0, max) + " ......";
  }
  return content;
}
export const calculateTimeLeft = (setTimeLeft, nextCall) => {
  if (!nextCall?.time) return;
  const now = new Date();
  const callTime = new Date(nextCall.time);
  const diff = callTime - now;
  if (diff <= 0) {
    // Call is happening exactly now
    setTimeLeft("Call is now");
    return 0; // Call is happening now
  } else if (diff < 0) {
    // Call was more than an hour ago
    const passedTime = Math.abs(diff);
    const passedHours = Math.floor(passedTime / (1000 * 60 * 60));
    const passedMinutes = Math.floor(
      (passedTime % (1000 * 60 * 60)) / (1000 * 60)
    );
    setTimeLeft(
      `Passed ${passedHours > 0 ? `${passedHours}h ` : ""}${
        passedMinutes > 0 ? `${passedMinutes}m ` : ""
      }ago`
    );
    return;
  }

  // Upcoming calls
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (diff <= 3600000) {
    // Call is within the current hour
    setTimeLeft("Call is now");
  } else {
    // Regular time display
    setTimeLeft(
      `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${
        minutes > 0 ? `${minutes}m ` : ""
      }${seconds}s`
    );
  }
};

export const checkIfADesigner = (user) => {
  return user.role === "TWO_D_DESIGNER" || user.role === "THREE_D_DESIGNER";
};
export const checkIfAdmin = (user) => {
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
};
