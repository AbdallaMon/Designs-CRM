"use client";
import { isAudio, isImage, isVideo } from "../fileTypes";
import { ImageFileRow } from "./ImageFileRow";
import { VideoPlayer } from "./VideoPlayer";
import { AudioFileRow } from "./AudioFileRow";
import { FileLinkRow } from "./FileLinkRow";
import { GridFileItem } from "./GridFileItem";

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
