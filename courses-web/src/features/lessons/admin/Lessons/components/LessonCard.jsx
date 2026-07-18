import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Grid,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  MdPictureAsPdf,
  MdLink,
  MdEdit,
  MdPreview,
  MdAccessTime,
  MdVisibility,
  MdVisibilityOff,
  MdOndemandVideo,
  MdQuiz,
} from "react-icons/md";
import Link from "next/link";
import DeleteModal from "@/shared/components/models/DeleteModal";
import LessonAccessDialog from "../../LessonAccess";
import { formatDuration } from "../helpers";

const LessonCard = ({
  lesson,
  courseId,
  getLessons,
  toggleMustUploadHomeWork,
  handlePreview,
}) => (
  <Grid item xs={12} md={6} xl={4}>
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{ flex: 1, mr: 2 }}
          >
            {lesson.title}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`Order : ${lesson.order}`}
              size="small"
              variant="outlined"
              color="primary"
            />
            <DeleteModal
              buttonType="ICON"
              item={lesson}
              href={`admin/courses/${courseId}/lessons`}
              handleClose={getLessons}
            />
          </Box>
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={lesson.mustUploadHomework}
                onChange={async (e) => {
                  await toggleMustUploadHomeWork({ lesson });
                }}
                color="primary"
              />
            }
            label="Must upload home works"
            sx={{ ml: 0 }}
          />
        </Box>
        {lesson.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              "-webkit-line-clamp": 3,
              "-webkit-box-orient": "vertical",
              overflow: "hidden",
            }}
          >
            {lesson.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <MdAccessTime size={16} />
            <Typography variant="body2" color="text.secondary">
              {formatDuration(lesson.duration)}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {lesson.isPreviewable ? (
              <MdVisibility size={16} color="green" />
            ) : (
              <MdVisibilityOff size={16} color="gray" />
            )}
            <Typography variant="body2" color="text.secondary">
              {lesson.isPreviewable ? "Previewable" : "Not previewable"}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {lesson.videos?.length > 0 && (
            <Chip
              icon={<MdOndemandVideo />}
              label={`${lesson.videos.length} video${
                lesson.videos.length > 1 ? "s" : ""
              }`}
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            icon={<MdPictureAsPdf />}
            label={`${lesson.pdfs?.length || 0} PDF${
              (lesson.pdfs?.length || 0) !== 1 ? "s" : ""
            }`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<MdLink />}
            label={`${lesson.links?.length || 0} link${
              (lesson.links?.length || 0) !== 1 ? "s" : ""
            }`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<MdQuiz />}
            label={`${lesson._count.tests} test${
              lesson._count.tests > 1 ? "s" : ""
            }`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box mt="auto">
          <LessonAccessDialog courseId={courseId} lessonId={lesson.id} />
        </Box>
      </CardContent>

      {/* Enhanced Actions Section */}
      <Box sx={{ p: 2, pt: 1, borderTop: 1, borderColor: "divider" }}>
        {/* Primary Actions Row */}
        <Box display="flex" gap={1} mb={1}>
          <Button
            startIcon={<MdPreview />}
            onClick={() => handlePreview(lesson)}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
          >
            Preview
          </Button>
          <Button
            startIcon={<MdEdit />}
            variant="contained"
            size="small"
            component={Link}
            href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}`}
            sx={{ flex: 1 }}
          >
            Edit
          </Button>
        </Box>

        {/* Secondary Actions Row */}
        <Box display="flex" gap={1}>
          <Button
            component={Link}
            href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}/home-works`}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
          >
            Homework
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdQuiz />}
            component={Link}
            href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}/tests`}
            sx={{ flex: 1 }}
          >
            Tests
          </Button>
        </Box>
      </Box>
    </Card>
  </Grid>
);

export default LessonCard;
