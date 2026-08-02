import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { FiUpload } from "react-icons/fi";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";

const HomeworkUploadDialog = ({
  uploadDialog,
  handleCloseUploadDialog,
  uploadType,
  title,
  setTitle,
  file,
  setFile,
  submitting,
  handleSubmit,
}) => {
  return (
    <Dialog
      open={uploadDialog}
      onClose={handleCloseUploadDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }} dir="rtl">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor:
                uploadType === "VIDEO" ? "primary.light" : "secondary.light",
              color:
                uploadType === "VIDEO"
                  ? "primary.contrastText"
                  : "secondary.contrastText",
            }}
          >
            <FiUpload size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upload {uploadType === "VIDEO" ? "video" : "summary"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "24px !important" }} dir="rtl">
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          required
          placeholder={`Enter a title for the ${
            uploadType === "VIDEO" ? "video" : "summary"
          }`}
        />
        <SimpleFileInput
          id="file"
          setData={setFile}
          label={uploadType === "VIDEO" ? "Choose a video file" : "Choose a document"}
          input={{
            accept: uploadType === "VIDEO" ? "video/*" : "application/pdf",
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleCloseUploadDialog}
          disabled={submitting}
          variant="outlined"
          sx={{
            textTransform: "none",
            px: 3,
            borderRadius: 2,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title.trim() || !file || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <FiUpload />
          }
          sx={{
            textTransform: "none",
            px: 3,
            borderRadius: 2,
          }}
        >
          {submitting ? "Uploading..." : "Upload file"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HomeworkUploadDialog;
