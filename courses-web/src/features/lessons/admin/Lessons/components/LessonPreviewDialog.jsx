import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  MdPictureAsPdf,
  MdLink,
  MdVisibility,
  MdVisibilityOff,
  MdOndemandVideo,
  MdPlayArrow,
  MdQuiz,
} from "react-icons/md";
import { formatDuration } from "../helpers";

const getVideoTypeIcon = (videoType) => {
  return videoType === "IFRAME" ? <MdOndemandVideo /> : <MdPlayArrow />;
};

const LessonPreviewDialog = ({ open, onClose, selectedLesson }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{selectedLesson?.title}</Typography>

        <Chip
          label={`Lesson #${selectedLesson?.order}`}
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>
    </DialogTitle>

    <DialogContent>
      {selectedLesson && (
        <Box>
          {selectedLesson.description && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLesson.description}
              </Typography>
            </Box>
          )}

          <Box display="flex" gap={4} mb={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Duration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDuration(selectedLesson.duration)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Preview Status
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {selectedLesson.isPreviewable ? (
                  <MdVisibility size={16} color="green" />
                ) : (
                  <MdVisibilityOff size={16} color="gray" />
                )}
                <Typography variant="body2" color="text.secondary">
                  {selectedLesson.isPreviewable
                    ? "Previewable"
                    : "Not previewable"}
                </Typography>
              </Box>
            </Box>
          </Box>
          {selectedLesson.videos?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Videos ({selectedLesson.videos.length})
              </Typography>
              <List dense>
                {selectedLesson.videos.map((video, index) => (
                  <ListItem key={video.id}>
                    <ListItemIcon>
                      {getVideoTypeIcon(video.videoType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          Video url {video.url}
                        </a>
                      }
                      secondary={`Type: ${video.videoType}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedLesson.pdfs?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                PDFs ({selectedLesson.pdfs.length})
              </Typography>
              <List dense>
                {selectedLesson.pdfs.map((pdf, index) => (
                  <ListItem key={pdf.id}>
                    <ListItemIcon>
                      <MdPictureAsPdf />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          PDF {pdf.url}
                        </a>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedLesson.links?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Links ({selectedLesson.links.length})
              </Typography>
              <List dense>
                {selectedLesson.links.map((link) => (
                  <ListItem key={link.id}>
                    <ListItemIcon>
                      <MdLink />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {link.title}
                        </a>
                      }
                      secondary={link.url}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedLesson.tests?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Tests ({selectedLesson.tests.length})
              </Typography>
              <List dense>
                {selectedLesson.tests.map((test, index) => (
                  <ListItem key={test.id}>
                    <ListItemIcon>
                      <MdQuiz />
                    </ListItemIcon>
                    <ListItemText primary={`Test ${index + 1}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Created:{" "}
              {new Date(selectedLesson.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated:{" "}
              {new Date(selectedLesson.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      )}
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default LessonPreviewDialog;
