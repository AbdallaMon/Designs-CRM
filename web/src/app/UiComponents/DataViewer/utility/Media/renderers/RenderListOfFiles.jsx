"use client";
import { Box, Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Fragment, useMemo, useState } from "react";
import { isImage, isVideo } from "../fileTypes";
import { RenderFileAccordingToType } from "./RenderFileAccordingToType";
import { AttachmentViewer } from "./AttachmentViewer";
dayjs.extend(relativeTime);

export function RenderListOfFiles({
  attachments,
  groupByMonth,
  currentRenderedMonths,
  onNearToEnd,
  hasMore,
  loadingMore,
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  function closeViewer() {
    setViewerOpen(false);
    setViewerIndex(0);
  }
  function openViewer(index) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  const mediaFiles = useMemo(
    () =>
      attachments.filter((a) => {
        const m = a?.fileMimeType || "";
        return isImage(m) || isVideo(m);
      }),
    [attachments]
  );

  const others = useMemo(
    () =>
      attachments.filter((a) => {
        const m = a?.fileMimeType || "";
        return !isImage(m) && !isVideo(m);
      }),
    [attachments]
  );
  const layout = (() => {
    const n = mediaFiles.length;
    if (n === 1) return { cols: 1, rows: 1, tileH: 260 };
    if (n === 2) return { cols: 2, rows: 1, tileH: 170 };
    if (n === 3) return { cols: 2, rows: 2, tileH: 140 };
    return { cols: 2, rows: 2, tileH: 140 };
  })();
  return (
    <>
      {groupByMonth && (
        <>
          <Grid container spacing={2}>
            {attachments?.map((att, idx) => {
              if (
                att.showMonthDivider &&
                currentRenderedMonths &&
                currentRenderedMonths[att.month] === 1
              ) {
                return (
                  <Fragment key={att.id}>
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Typography variant="subtitle2" fontWeight={600} mb={1}>
                        {dayjs(att.month).format("MMMM YYYY")}
                      </Typography>
                    </Grid>
                    <Grid
                      key={att.id}
                      size={{ xs: 6, md: 3 }}
                      sx={{
                        maxHeight: 200,
                      }}
                    >
                      <RenderFileAccordingToType
                        att={att}
                        onPreview={openViewer}
                        index={idx}
                        groupByMonth={true}
                      />
                    </Grid>
                  </Fragment>
                );
              }
              return (
                <Grid
                  key={att.id}
                  size={{ xs: 6, md: 3 }}
                  sx={{
                    maxHeight: 200,
                  }}
                >
                  <RenderFileAccordingToType
                    key={att.id}
                    att={att}
                    onPreview={openViewer}
                    index={idx}
                    groupByMonth={true}
                  />
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
      {mediaFiles.length > 0 && !groupByMonth && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 360,
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, ${layout.tileH}px)`,
            mb: others.length ? 1 : 0,
          }}
        >
          {mediaFiles?.map((att, idx) => {
            return (
              <RenderFileAccordingToType
                key={att.id}
                att={att}
                onPreview={openViewer}
                index={idx}
              />
            );
          })}
        </Box>
      )}
      {!groupByMonth &&
        others?.map((att) => (
          <Box key={att.id} mb={1}>
            <RenderFileAccordingToType att={att} />
          </Box>
        ))}
      <AttachmentViewer
        open={viewerOpen}
        onClose={closeViewer}
        attachments={attachments}
        startIndex={viewerIndex}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onNearToEnd={onNearToEnd}
        index={viewerIndex}
        setIndex={setViewerIndex}
      />
    </>
  );
}
