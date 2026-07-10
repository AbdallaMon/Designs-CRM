"use client";
import { isAudio, isImage, isVideo } from "@/shared/components/media/fileTypes.js";
import { ImageFileRow } from "@/shared/components/media/renderers/ImageFileRow.jsx";
import { VideoPlayer } from "@/shared/components/media/renderers/VideoPlayer.jsx";
import { AudioFileRow } from "@/shared/components/media/renderers/AudioFileRow.jsx";
import { FileLinkRow } from "@/shared/components/media/renderers/FileLinkRow.jsx";
import { GridFileItem } from "@/shared/components/media/renderers/GridFileItem.jsx";

export function RenderFileAccordingToType({
  att,
  onPreview,
  index,
  iframe,
  handleMediaReady,
  currentIndex,
  groupByMonth,
}) {
  const mime = att?.fileMimeType || "";
  if (isImage(mime)) {
    return (
      <ImageFileRow
        att={att}
        onOpen={() => onPreview(index)}
        handleMediaReady={handleMediaReady}
        index={index}
        iframe={iframe}
        groupByMonth={groupByMonth}
        shouldLoadImmediately={iframe}
      />
    );
  } else if (isVideo(mime)) {
    return (
      <VideoPlayer
        url={att.fileUrl}
        mode={iframe ? "direct" : "click"}
        onClick={() => onPreview(index)}
        handleMediaReady={handleMediaReady}
        groupByMonth={groupByMonth}
      />
    );
  } else if (isAudio(mime)) {
    return groupByMonth ? (
      <GridFileItem file={att} onPreview={onPreview} />
    ) : (
      <AudioFileRow att={att} handleMediaReady={handleMediaReady} />
    );
  } else
    return groupByMonth ? (
      <GridFileItem file={att} onPreview={onPreview} />
    ) : (
      <FileLinkRow
        att={att}
        iframe={iframe}
        handleMediaReady={handleMediaReady}
      />
    );
}
