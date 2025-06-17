"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid2 as Grid,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Container,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdArrowBack as ArrowBack,
  MdArrowForward as ArrowForward,
  MdCheck as Check,
  MdDownload as Download,
  MdExpandMore as ExpandMore,
  MdRoom as Room,
  MdWarning as Warning,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SignatureComponent from "./SignatureComponet";
import { ClientImageAppBar, SelectedPatterns } from "./Utility";
import { ClientSelectedImages } from "./ClientSelectedImages";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { ImageGroup } from "./ImageGroup";
import { ChoosePattern } from "./ChoosePattern";

const ClientImageSelection = ({ token }) => {
  // Main state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(!token ? "Error link is uncorrect" : "");
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Selection states
  const [availablePatterns, setAvailablePatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const { setLoading: setToastLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  // UI states
  const [loadingImages, setLoadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Refs for scrolling
  const spaceRefs = useRef({});

  // Signature canvas ref

  const steps = [
    "Select Pattern",
    "Choose Images",
    "Review & Notes",
    "Sign & Approve",
  ];

  useEffect(() => {
    initializeSession();
  }, [token]);

  async function onSignatureSaved() {
    await initializeSession();
  }

  const initializeSession = async () => {
    try {
      const request = await getData({
        url: `client/image-session?token=${token}&`,
        setLoading,
      });
      if (request.status !== 200) {
        setError(request.error);
        return;
      }

      const sessionData = request.data;
      await getColorPatterns();

      setSession(sessionData);
      if (sessionData.sessionStatus === "APPROVED") {
        const selectedPattenrs = sessionData.preferredPatterns.map((p) => p.id);
        setSelectedPattern(selectedPattenrs);
        setCurrentStep(4);
        return;
      }
      if (
        sessionData.preferredPatterns &&
        sessionData.preferredPatterns.length > 0
      ) {
        const selectedPattenrs = sessionData.preferredPatterns.map((p) => p.id);
        setSelectedPattern(selectedPattenrs);
        const spaceIds = sessionData.selectedSpaces.map((s) => s.spaceId);
        await loadImages(selectedPattenrs, spaceIds);
        if (
          sessionData.selectedImages.length > 0 &&
          sessionData.sessionStatus === "IN_PROGRESS"
        ) {
          setCurrentStep(2);
          const mainImages = sessionData.selectedImages.map((i) => {
            return i.image;
          });
          setSelectedImages(mainImages);
        } else if (
          sessionData.sessionStatus === "APPROVING" &&
          sessionData.selectedImages.length > 0
        ) {
          setCurrentStep(3);
        } else {
          setCurrentStep(1);
        }
      } else {
        setCurrentStep(0);
      }
    } catch (err) {
      console.log(err, "err");
      setError(
        "Failed to load session data. Please contact customer services for assistance."
      );
    }
  };

  async function getColorPatterns() {
    const request = await getData({
      url: `client/image-session/data?model=colorPattern&`,
      setLoading,
    });
    if (request.status === 200) {
      setAvailablePatterns(request.data);
    }
  }

  const loadImages = async (patternIds, spaceIds) => {
    const spaceParam = spaceIds.join(",");
    const patternParam = patternIds.join(",");

    const request = await getData({
      url: `client/image-session/images?spaces=${spaceParam}&patterns=${patternParam}&`,
      setLoading: setLoadingImages,
    });

    if (request.status === 200) {
      setAvailableImages(request.data);
    } else {
      setError("Failed to load images");
    }
  };

  // Helper function to group images by space
  const groupImagesBySpace = (images) => {
    const grouped = {};

    session.selectedSpaces.forEach(({ space }) => {
      grouped[space.id] = {
        space: space,
        images: [],
      };
    });
    images.forEach((image) => {
      if (image.spaces && image.spaces.length > 0) {
        image.spaces.forEach((space) => {
          if (grouped[space.id]) {
            grouped[space.id].images.push(image);
          }
        });
      }
    });

    return Object.values(grouped);
  };

  const handlePatternSelect = (pattern) => {
    setSelectedPattern((prev) => {
      if (prev.includes(pattern.id)) {
        return prev.filter((id) => id !== pattern.id);
      } else {
        return [...prev, pattern.id];
      }
    });
  };

  const handleImageSelect = (image) => {
    const isSelected = selectedImages.find((img) => img.id === image.id);
    if (isSelected) {
      setSelectedImages(selectedImages.filter((img) => img.id !== image.id));
    } else {
      setSelectedImages([...selectedImages, image]);
    }
    setValidationError("");
  };

  const handleNext = async () => {
    setValidationError("");

    if (currentStep === 0 && selectedPattern.length === 0) {
      setAlertError("Please select at least one color pattern");
      return;
    }

    if (currentStep === 0) {
      const patternRequest = await handleRequestSubmit(
        { patterns: selectedPattern, token },
        setToastLoading,
        `client/image-session/save-patterns`,
        false,
        "Processing"
      );
      if (patternRequest.status === 200) {
        setSession(patternRequest.data);
        const spaceIds = session.selectedSpaces.map((s) => s.spaceId);

        await loadImages(selectedPattern, spaceIds);
        setCurrentStep((old) => old + 1);
      }
      return;
    }

    if (currentStep === 1) {
      // Validate space selections
      if (!selectedImages || selectedImages.length === 0) {
        setValidationError(`Please select at least one image `);
        return;
      }

      setSubmitting(true);
      const imageRequest = await handleRequestSubmit(
        { imageIds: selectedImages.map((img) => img.id), token },
        setToastLoading,
        `client/image-session/save-images`,
        false,
        "Processing"
      );

      if (imageRequest.status === 200) {
        setSession(imageRequest.data);
        setCurrentStep(2);
      }
      setSubmitting(false);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        p={3}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>
          Loading your session...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Session Error</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" mt={1}>
            Please contact staff to regenerate a new session.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Completed state
  if (currentStep === 4 && session?.sessionStatus === "APPROVED") {
    return (
      <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }}>
        <ClientImageAppBar />
        <Container maxWidth="lg" sx={{ px: "0px !important", mt: 2, mb: 2 }}>
          <Paper
            elevation={3}
            sx={{ p: 3, px: { xs: 1, md: 3 }, textAlign: "center" }}
          >
            <Check sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Approved!
            </Typography>
            <Typography variant="body1" paragraph>
              Your selections have been approved and processed.
            </Typography>
            {session.pdfUrl ? (
              <Button
                variant="contained"
                startIcon={<Download />}
                href={session.pdfUrl}
                target="_blank"
                size="large"
                sx={{ mt: 2 }}
              >
                Download PDF
              </Button>
            ) : (
              <Alert severity="info">
                We&apos;re currently generating your PDF. You&apos;ll receive an
                email with the download link as soon as it&apos;s ready.
              </Alert>
            )}
          </Paper>
        </Container>
        <ClientSelectedImages
          availablePatterns={availablePatterns}
          selectedPattern={selectedPattern}
          session={session}
        />
      </Container>
    );
  }

  // Group images by space for rendering
  const imagesBySpace = groupImagesBySpace(availableImages);

  return (
    <Container maxWidth="lg" sx={{ pb: 12 }}>
      {/* Header */}
      <ClientImageAppBar />

      {/* Stepper */}
      <Box sx={{ p: 2, py: 0.5, bgcolor: "background.paper" }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Container maxWidth="md" sx={{ mt: 2, px: 0 }}>
        {/* Validation Error Alert */}
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }} icon={<Warning />}>
            <Typography variant="body2">{validationError}</Typography>
          </Alert>
        )}

        {currentStep === 0 && (
          <ChoosePattern
            availablePatterns={availablePatterns}
            handlePatternSelect={handlePatternSelect}
            selectedPattern={selectedPattern}
          />
        )}

        {currentStep === 1 && (
          <Box>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <SelectedPatterns
                availablePatterns={availablePatterns}
                selectedPattern={selectedPattern}
              />
            </Box>

            <Divider />

            <ImageGroup
              handleImageSelect={handleImageSelect}
              loadingImages={loadingImages}
              selectedImages={selectedImages}
              images={availableImages}
              type="SELECT"
            />
          </Box>
        )}

        {currentStep === 2 && (
          <ClientSelectedImages
            availablePatterns={availablePatterns}
            selectedPattern={selectedPattern}
            session={session}
          />
        )}

        {currentStep === 3 && (
          <>
            <SignatureComponent
              session={session}
              token={token}
              onSignatureSaved={onSignatureSaved}
            />
          </>
        )}
      </Container>

      {currentStep < 3 && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
          elevation={3}
        >
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>

            {currentStep === 1 && (
              <Chip
                label={`${selectedImages.length} images selected`}
                color={selectedImages.length > 0 ? "primary" : "default"}
              />
            )}

            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              disabled={
                (currentStep === 0 && !selectedPattern) ||
                (currentStep === 1 && selectedImages.length === 0) ||
                submitting
              }
              onClick={handleNext}
            >
              {submitting ? "Saving..." : "Next"}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ClientImageSelection;
