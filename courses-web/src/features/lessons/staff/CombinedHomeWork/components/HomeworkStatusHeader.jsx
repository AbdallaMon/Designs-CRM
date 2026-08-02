import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { FiBookOpen, FiCheck, FiAlertCircle } from "react-icons/fi";

const HomeworkStatusHeader = ({ theme, canProceed, setHomeworkDialog }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          Lesson homework
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiBookOpen />}
          onClick={() => setHomeworkDialog(true)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            py: 1,
          }}
        >
          View requirements
        </Button>
      </Box>

      {/* Status Card */}
      <Card
        sx={{
          background: canProceed
            ? "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)",
          border: `1px solid ${
            canProceed
              ? theme.palette.success.light
              : theme.palette.warning.light
          }`,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {canProceed ? (
              <FiCheck size={24} color={theme.palette.success.main} />
            ) : (
              <FiAlertCircle size={24} color={theme.palette.warning.main} />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 0.5 }}
              >
                {canProceed ? "All requirements are complete!" : "Homework required"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {canProceed
                  ? "You can now continue to the next lesson or test."
                  : `Submit a PDF summary and a video to continue.`}
              </Typography>
            </Box>
            {canProceed && (
              <Chip
                label="Ready"
                color="success"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HomeworkStatusHeader;
