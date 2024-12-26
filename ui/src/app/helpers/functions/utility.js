import dayjs from "dayjs";
import {Box, Button, Link, Paper, Typography} from "@mui/material";
import React from "react";
import {
    MdAttachFile as AttachFile,
    MdPictureAsPdf as PictureAsPdf,
    MdImage as Image
} from 'react-icons/md';

export const handleSearchParamsChange = (event, key, searchParams, router, onChange) => {
    if (onChange) return onChange(event)
    const value = event.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
        params.set(key, value);
    } else {
        params.set(key, "all");
    }
    router.push(`?${params.toString()}`);
};

export const getPropertyValue = (item, propertyPath, enums, type, defaultValue,) => {
    let value = propertyPath.split('.').reduce((acc, part) => {
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
    if (defaultValue) value = defaultValue

    if ((propertyPath.toLowerCase().includes('date') || type === "date") && dayjs(value).isValid()) {
        return dayjs(value).format('YYYY-MM-DD');
    }
    if (enums && type === "boolean") {
        if (value) {
            return enums.TRUE
        } else return enums.FALSE

    }
    if (enums) return enums[value]
    return value;
};

export function convertEnumToOptions(enums, propertyKey = "id", valueKey = "name") {
    return Object.entries(enums).map(([property, value]) => ({[propertyKey]: property, [valueKey]: value}))
}


export const renderFileLink = (url, label, style) => {
    if (!url) return <Typography>لا يوجد {label}</Typography>;

    const isImage = /\.(jpeg|jpg|png|gif)$/i.test(url);
    const isPdf = /\.pdf$/i.test(url);

    return (
          <Paper variant="outlined" sx={{p: 2, mb: 2}}>
              <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body1" fontWeight="bold">
                      {label && label?.length > 0 && `${label}:`}
                  </Typography>
                  {isImage ? (
                        <Box display="flex" alignItems="center" gap={1}>

                            <img src={url} alt={label} width="100" style={style}/>
                        </Box>
                  ) : isPdf ? (
                        <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<PictureAsPdf/>}
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
                              startIcon={<AttachFile/>}
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