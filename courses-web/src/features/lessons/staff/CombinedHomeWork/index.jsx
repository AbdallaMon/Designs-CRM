import { useState, useEffect, useCallback } from "react";
import { HOMEWORK_TYPES } from "@dms/shared";
import { Box, useTheme } from "@mui/material";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import HomeworkStatusHeader from "./components/HomeworkStatusHeader";
import HomeworkRequirementsDialog from "./components/HomeworkRequirementsDialog";
import HomeworkUploadDialog from "./components/HomeworkUploadDialog";
import { homeworkPayload } from "@/app/helpers/contracts/coursePayloads";

const CombinedHomeWork = ({ courseId, lessonId, onUpdate }) => {
  const [homeworkDialog, setHomeworkDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setProgress, setOverlay } = useUploadContext();

  const { toastLoading: submitting, setToastLoading: setSubmitting } =
    useToastContext();
  const theme = useTheme();

  const fetchHomeworks = useCallback(async () => {
    await getDataAndSet({
      url: `staff-courses/${courseId}/lessons/${lessonId}/home-work`,
      setData: setHomeworks,
      setLoading,
    });
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  const handleUploadClick = (type) => {
    setUploadType(type);
    setUploadDialog(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file) {
      return;
    }
    let url = "";
    const fileUpload = await uploadInChunks(file.file, setProgress, setOverlay);

    if (fileUpload.status !== 200 || !fileUpload.url) return;
    url = fileUpload.url;

    const req = await handleRequestSubmit(
      homeworkPayload({ url, title, type: uploadType }),
      setSubmitting,
      `staff-courses/${courseId}/lessons/${lessonId}/home-work`
    );
    if (req.status === 200) {
      onUpdate();
      handleCloseUploadDialog();
      await fetchHomeworks();
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialog(false);
    setTitle("");
    setFile(null);
  };

  const videoHomeworks = homeworks.filter(
    (hw) => hw.type === HOMEWORK_TYPES.VIDEO,
  );
  const summaryHomeworks = homeworks.filter(
    (hw) => hw.type === HOMEWORK_TYPES.SUMMARY,
  );
  const hasVideo = videoHomeworks.length > 0;
  const hasSummary = summaryHomeworks.length > 0;
  const canProceed = hasSummary && hasVideo;

  return (
    <Box dir="rtl">
      <HomeworkStatusHeader
        theme={theme}
        canProceed={canProceed}
        setHomeworkDialog={setHomeworkDialog}
      />

      <HomeworkRequirementsDialog
        homeworkDialog={homeworkDialog}
        setHomeworkDialog={setHomeworkDialog}
        loading={loading}
        handleUploadClick={handleUploadClick}
        theme={theme}
        hasVideo={hasVideo}
        hasSummary={hasSummary}
        videoHomeworks={videoHomeworks}
        summaryHomeworks={summaryHomeworks}
        homeworks={homeworks}
      />

      <HomeworkUploadDialog
        uploadDialog={uploadDialog}
        handleCloseUploadDialog={handleCloseUploadDialog}
        uploadType={uploadType}
        title={title}
        setTitle={setTitle}
        file={file}
        setFile={setFile}
        submitting={submitting}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
};

export default CombinedHomeWork;
